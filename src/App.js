import React, { useEffect, useState } from "react";
import { ethers } from 'ethers';
import { Container, Heading, Text, Button, VStack, HStack, Box, useToast, useDisclosure, Spinner, Link, Tag, TagLeftIcon, TagLabel, Divider, Center } from '@chakra-ui/react'
import { ExternalLinkIcon } from '@chakra-ui/icons';
import { RiWallet3Line } from 'react-icons/ri';

import BasicModal from './components/ui/BasicModal';
import myEpicNft from './utils/MyEpicNFT.json';

// Constants
const OPENSEA_COLLECTIONS_LINK = 'https://testnets.opensea.io/collection/squarenft-fmf1e1djjt';
const OPENSEA_ASSET_LINK = 'https://testnets.opensea.io/assets';
const CONTRACT_ADDRESS = "0x40B6AB6911381840F0Df8Da474f1A825f1F3b63B";

const App = () => {
  // App states
  const [currentAccount, setCurrentAccount] = useState('');
  const [totalMint, setTotalMint] = useState(0);
  const [totalMaxMint, setTotalMaxMint] = useState(0);
  const [isConnectWalletLoading, setIsConnectWalletLoading] = useState(false);
  const [isMintingLoading, setIsMintingLoading] = useState(false);
  const [tokenId, setTokenId] = useState();
  
  // Chakra UI states
  const { onOpen: onOpenLinkModal, isOpen: isOpenLinkModal, onClose: onCloseLinkModal } = useDisclosure();
  const { onOpen: onOpenNetworkModal, isOpen: isOpenNetworkModal, onClose: onCloseNetworkModal } = useDisclosure();
  const { onOpen: onOpenWalletModal, isOpen: isOpenWalletModal, onClose: onCloseWalletModal } = useDisclosure();
  const toast = useToast();

  useEffect(() => {
    checkIfWalletIsConnected();
    getMintedNumbers();
    // checkForRinkebyNetwork();
  }, [])

  // const viewToast = (isError = false) => {
  //   return toast({
  //     duration: 4000,
  //     position: 'bottom',
  //     isClosable: true,
  //     render: () => (
  //       <Box width={'3xs'} color='white' p={3} bg={isError ? 'red.300' : 'green.600'} borderRadius={'md'} textAlign={'center'} mb={5}>
  //           {isError ? 'Error' : 'Success'}
  //       </Box>
  //     )
  //   });
  // };

  window?.ethereum?.on('accountsChanged', function (accounts) {
    setCurrentAccount(accounts[0]);
  })

  const getMintedNumbers = async () => {
    const { ethereum } = window;

    if (!ethereum) {
      return;
    }

    const provider = new ethers.providers.Web3Provider(window.ethereum, 'any');
    const contract = new ethers.Contract(CONTRACT_ADDRESS, myEpicNft.abi, provider);

    provider.on("network", (newNetwork, oldNetwork) => {
      // When a Provider makes its initial connection, it emits a "network"
      // event with a null oldNetwork along with the newNetwork. So, if the
      // oldNetwork exists, it represents a changing network
      if (oldNetwork) {
          window.location.reload();
      }

      if (newNetwork.name !== 'rinkeby') {
        onOpenNetworkModal();
      }
    });

    const getTotalMintedMaxNumber = await contract.getTotalMaxMintedNumber();
    const getMintedNumbers = await contract.getMintedNumber();

    setTotalMaxMint(getTotalMintedMaxNumber.toString());
    setTotalMint(getMintedNumbers.toString());
  };

  const checkIfWalletIsConnected = async () => {
    const { ethereum } = window;

    if (!ethereum) {
      console.log('Make sure you have MetaMask!');
      return;
    }
    else {
      console.log('We have the ethereum object', ethereum);
    }

    // Check if we're authrorized to access the user's wallet
    const accounts = await ethereum.request({ method: 'eth_accounts' });

    if (accounts.length !== 0) {
      const account = accounts[0];
      setCurrentAccount(account);
    
      // Register event listener for the current connected wallet
      setupEventListener();
    }
    else {
      console.log('No authorized account found');
    }
  };

  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        onOpenWalletModal();
        return;
      }

      setIsConnectWalletLoading(true);
      const [account] = await ethereum.request({ method: 'eth_requestAccounts' });
      setCurrentAccount(account);
      setIsConnectWalletLoading(false);

      // Register event listener for new wallet
      setupEventListener();
    }
    catch (error) {
      console.log(error);
    }
  };

  const askContractToMintNft = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(CONTRACT_ADDRESS, myEpicNft.abi, signer);

        setIsMintingLoading(true);
        console.log('Going to pop wallet now to pay gas...');
        let nftTxn = await connectedContract.makeAnEpicNFT();

        console.log('Mining... please wait');
        await nftTxn.wait();

        // Open modal with a link to opensea
        onOpenLinkModal();
        console.log(`Mined, see transaction: https://rinkeby.etherscan.io/tx/${nftTxn.hash}`);
      }
      else {
        console.log("Ethereum object doesn't exist!");
      }
    }
    catch (error) {
      console.log(error);
    }
  };

  const setupEventListener = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(CONTRACT_ADDRESS, myEpicNft.abi, signer);

        connectedContract.on("NewEpicNFTMinted", (from, nftId) => {
          // Minting is complete, we now disable the loading from button
          setIsMintingLoading(false);

          // Update minted amount left
          getMintedNumbers();

          setTokenId(nftId.toNumber());
        })
      }
    }
    catch (error) {
      console.log(error);
    }
  };

  const renderButton = () => {
    return currentAccount === '' || currentAccount === undefined ? 
    (
      <Button colorScheme={'cyan'} onClick={connectWallet} isLoading={isConnectWalletLoading}>
          Connect to Wallet
        </Button>
    )
    :
    (
      <Button colorScheme={'green'} onClick={askContractToMintNft} isLoading={isMintingLoading} isDisabled={totalMint === totalMaxMint}>
        Mint NFT
      </Button>
    )
  };

  const renderConnectedWallet = () => {
    if (currentAccount === '' || currentAccount === undefined) {
      return;
    }

    const firstFive = currentAccount.slice(0, 5);
    const lastFour = currentAccount.slice(currentAccount.length - 4);

    return (
      <HStack>
        <Tag>
          <TagLeftIcon as={RiWallet3Line} />
          <TagLabel>{firstFive}...{lastFour}</TagLabel>
        </Tag>

        <Link href='https://faucets.chain.link/rinkeby' fontSize={'xs'} color='cyan.300' isExternal>
          <Text as={'u'}>Request testnet ETH</Text>
        </Link>
      </HStack>
    )
  }

  const renderTokenLink = () => (
    <Box>
      <Link href={`${OPENSEA_ASSET_LINK}/${CONTRACT_ADDRESS}/${tokenId}`} color='teal.400' fontWeight={'semibold'} isExternal>
        Go to your NFT <ExternalLinkIcon verticalAlign={'text-top'}/>
      </Link>

      <Text fontSize={'sm'}>
        The image can take up to 10 mins to show up on OpenSea. ⌛
      </Text>
    </Box>
  );

  return (
    <Container
      mt={10}
      pt={10}
      minH={'90vh'}
      bgGradient={'linear(to-r, #355c7d, #6c5b7b, #c06c84)'}
      borderRadius={'2xl'}
      boxShadow={'2xl'}
    >
      <VStack spacing={4}>
        <Heading bgGradient={'linear(to-r, #60c657 30%, #35aee2 60%)'} bgClip='text'>My Hero NFT Collection</Heading>
        {renderConnectedWallet()}

        <Text>
          Each unique. Each Hero. Discover your NFT today.
        </Text>

        <Heading size={'lg'} bgGradient={'linear(to-l, #ff0080, #ff8c00, #40e0d0)'} bgClip={'text'}>
          {totalMaxMint - totalMint} lefts 🔥
        </Heading>

        <Center height={'100px'}>
          <Divider orientation='vertical' />
        </Center>

        <HStack>
          <Link href={OPENSEA_COLLECTIONS_LINK} isExternal>
            <Button>Gallery</Button>
          </Link>
          {renderButton()}
        </HStack>

        <BasicModal isOpen={isOpenLinkModal} onClose={onCloseLinkModal}>
          {/* { isMintingLoading here relies on the NewEpicNFTMinted to trigger } */}
          {isMintingLoading ? <Spinner /> : renderTokenLink()}
        </BasicModal>

        <BasicModal isOpen={isOpenNetworkModal} onClose={onCloseNetworkModal}>
          Please change your network to Rinkeby 🙏
        </BasicModal>

        <BasicModal isOpen={isOpenWalletModal} onClose={onCloseWalletModal}>
          Can't detect your MetaMask wallet 😅
        </BasicModal>
      </VStack>
    </Container>
  );
};

export default App;

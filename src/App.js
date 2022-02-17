import React, { useEffect, useState } from "react";
import { ethers } from 'ethers';
import { Container, Heading, Text, Button, VStack, HStack, Box, useToast, useDisclosure, Spinner, Link } from '@chakra-ui/react'
import { ExternalLinkIcon } from '@chakra-ui/icons';

import BasicModal from './components/ui/BasicModal';
import myEpicNft from './utils/MyEpicNFT.json';

// Constants
const OPENSEA_LINK = 'https://testnets.opensea.io/assets';
// const CONTRACT_ADDRESS = "0x8E79821b65d93f3f557F59D90910d0e64869bE0E";
const CONTRACT_ADDRESS = "0x959922bE3CAee4b8Cd9a407cc3ac1C251C2007B1";

const App = () => {
  // App states
  const [currentAccount, setCurrentAccount] = useState('');
  const [totalMint, setTotalMint] = useState(0);
  const [totalMaxMint, setTotalMaxMint] = useState(0);
  const [isConnectWalletLoading, setIsConnectWalletLoading] = useState(false);
  const [isMintingLoading, setIsMintingLoading] = useState(false);
  const [tokenId, setTokenId] = useState();
  const [networkError, setNetworkError] = useState();
  
  // Chakra UI states
  const { onOpen: onOpenLinkModal, isOpen: isOpenLinkModal, onClose: onCloseLinkModal } = useDisclosure();
  const { onOpen: onOpenNetworkModal, isOpen: isOpenNetworkModal, onClose: onCloseNetworkModal } = useDisclosure();
  const toast = useToast();

  window.ethereum.on('accountsChanged', function (accounts) {
    setCurrentAccount(accounts[0]);
  })

  useEffect(() => {
    checkIfWalletIsConnected();
    getMintedNumbers();
    checkForRinkebyNetwork();
  }, [])

  const viewToast = (isError = false) => {
    return toast({
      duration: 4000,
      position: 'bottom',
      isClosable: true,
      render: () => (
        <Box width={'3xs'} color='white' p={3} bg={isError ? 'red.300' : 'green.600'} borderRadius={'md'} textAlign={'center'} mb={5}>
            {isError ? 'Error' : 'Success'}
        </Box>
      )
    });
  };

  const getMintedNumbers = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, myEpicNft.abi, provider);

    const getTotalMintedMaxNumber = await contract.getTotalMaxMintedNumber();
    const getMintedNumbers = await contract.getMintedNumber();

    setTotalMaxMint(getTotalMintedMaxNumber.toString());
    setTotalMint(getMintedNumbers.toString());
  };

  const checkForRinkebyNetwork = async () => {
    const { ethereum } = window;
    let chainId = await ethereum.request({ method: 'eth_chainId' });
    console.log("Connected to chain " + chainId);

    // String, hex code of the chainId of the Rinkebey test network
    const rinkebyChainId = "0x4"; 
    if (chainId !== rinkebyChainId) {
      onOpenNetworkModal();
    }
  }

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
        alert('Get MetaMask!');
        return;
      }

      setIsConnectWalletLoading(true);
      const [account] = await ethereum.request({ method: 'eth_requestAccounts' });
      setCurrentAccount(account);
      setIsConnectWalletLoading(false);

      console.log('connectWallet');

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

          // console.log(`${CONTRACT_ADDRESS} / ${nftId.toNumber()}`);
          // alert(`Hey there! We've minted your NFT and sent it to your wallet. 
          // It may be blank right now. It can take a max of 10 min to show up on OpenSea. 
          // Here's the link: https://testnets.opensea.io/assets/${CONTRACT_ADDRESS}/${tokenId.toNumber()}`);
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

    return (
      <HStack fontFamily={'monospace'} bg={'ActiveCaption'} borderRadius={'xl'} p={1} color={'black'}>
        <Text fontSize='smaller'>Connected Wallet: </Text>
        <Text fontSize='smaller' fontWeight={'semibold'}>
          {currentAccount}
        </Text>
      </HStack>
    )
  }

  const renderTokenLink = () => (
    <Box>
      <Link href={`${OPENSEA_LINK}/${CONTRACT_ADDRESS}/${tokenId}`} color='teal.400' fontWeight={'semibold'} isExternal>
        Go to your NFT <ExternalLinkIcon verticalAlign={'text-top'}/>
      </Link>

      <Text fontSize={'sm'}>
        It can take up to 10 mins to show up on OpenSea. ⌛
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
        <Heading bgGradient={'linear(to-r, #60c657 30%, #35aee2 60%)'} bgClip='text'>My NFT Collection</Heading>

        <Text>
          Each unique. Each Hero. Discover your NFT today.
        </Text>

        <Heading size={'md'} bgGradient={'linear(to-l, #40e0d0, #ff8c00, #ff0080)'} bgClip={'text'}>
          {totalMaxMint - totalMint} lefts 🔥
        </Heading>

        {renderButton()}

        <BasicModal isOpen={isOpenLinkModal} onClose={onCloseLinkModal}>
          {/* { isMintingLoading here relies on the NewEpicNFTMinted to trigger } */}
          {isMintingLoading ? <Spinner /> : renderTokenLink()}
        </BasicModal>

        <BasicModal isOpen={isOpenNetworkModal} onClose={onCloseNetworkModal}>
          Please change your network to Rinkeby 🙏
        </BasicModal>

        {renderConnectedWallet()}
      </VStack>
    </Container>
  );
};

export default App;

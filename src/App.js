import './styles/App.css';
import twitterLogo from './assets/twitter-logo.svg';
import React, { useEffect, useState } from "react";
import { ethers } from 'ethers';
import myEpicNft from './utils/MyEpicNFT.json';

// Constants
const TWITTER_HANDLE = '_buildspace';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;
const OPENSEA_LINK = 'https://testnets.opensea.io/assets/';
const CONTRACT_ADDRESS = "0x8E79821b65d93f3f557F59D90910d0e64869bE0E";
// const CONTRACT_ADDRESS = "0xA51c1fc2f0D1a1b8494Ed1FE312d7C3a78Ed91C0";

const App = () => {
  // Store user's public wallet
  const [currentAccount, setCurrentAccount] = useState('');
  const [totalMint, setTotalMint] = useState(0);
  const [totalMaxMint, setTotalMaxMint] = useState(0);

  useEffect(() => {
    checkIfWalletIsConnected();
  }, [])

  const getMintedNumbers = async () => {
    // totalMint
    // totalMaxMint
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
      console.log('Found an authorized accounts: ', account);
      setCurrentAccount(account);
    
      // Register event listener for the current connected wallet
      setupEventListener();
    }
    else {
      console.log('No authorized account found');
    }
  }

  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert('Get MetaMask!');
        return;
      }

      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      setCurrentAccount(accounts[0]);

      // Register event listener for new wallet
      setupEventListener();
    }
    catch (error) {
      console.log(error);
    }
  }

  const askContractToMintNft = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(CONTRACT_ADDRESS, myEpicNft.abi, signer);

        console.log('Going to pop wallet now to pay gas...');
        let nftTxn = await connectedContract.makeAnEpicNFT();

        console.log('Mining... please wait');
        await nftTxn.wait();

        console.log(`Mined, see transaction: https://rinkeby.etherscan.io/tx/${nftTxn.hash}`);
      }
      else {
        console.log("Ethereum object doesn't exist!");
      }
    }
    catch (error) {
      console.log(error);
    }
  }

  const setupEventListener = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(CONTRACT_ADDRESS, myEpicNft.abi, signer);

        connectedContract.on("NewEpicNFTMinted", (from, tokenId) => {
          console.log(from, tokenId.toNumber());
          // alert(`Hey there! We've minted your NFT and sent it to your wallet. 
          // It may be blank right now. It can take a max of 10 min to show up on OpenSea. 
          // Here's the link: https://testnets.opensea.io/assets/${CONTRACT_ADDRESS}/${tokenId.toNumber()}`);
        })
      }
      else {
        console.log("Ethereum object doesn't exist!");
      }
    }
    catch (error) {
      console.log(error);
    }
  }

  // Render Methods
  const renderNotConnectedContainer = () => (
    <button className="cta-button connect-wallet-button" onClick={connectWallet}>
      Connect to Wallet
    </button>
  );

  return (
    <div className="App">
      <div className="container">
        <div className="header-container">
          <p className="header gradient-text">My NFT Collection</p>
          <p className="sub-text">
            Each unique. Each beautiful. Discover your NFT today.
          </p>
          {currentAccount === '' 
            ? 
              renderNotConnectedContainer() 
            : (
              <button onClick={askContractToMintNft} className="cta-button connect-wallet-button">
                Mint NFT
              </button>
            )}
        </div>
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`built on @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
};

export default App;

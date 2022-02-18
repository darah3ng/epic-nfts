require('dotenv').config({ path:__dirname + '/.env' });
require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

console.log(process.env.REACT_APP_ETHERSCAN_API_KEY);

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: "0.8.1",
  networks: {
    rinkeby: {
      url: "https://eth-rinkeby.alchemyapi.io/v2/TnaTLso7tLkPAmATgwibneeQbi3KyrVI",
      accounts: [`${process.env.REACT_APP_PRIVATE_KEY_RINKEBY_BUILDSPACE}`]
    }
  },
  etherscan: {
    apiKey: `${process.env.REACT_APP_ETHERSCAN_API_KEY}`
  }
};

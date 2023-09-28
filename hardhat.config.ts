import * as dotenv from "dotenv";

import { HardhatUserConfig, task } from "hardhat/config";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-solhint";
import "@nomiclabs/hardhat-truffle5";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";
import "hardhat-prettier"
import '@openzeppelin/hardhat-upgrades';
import "@rumblefishdev/hardhat-kms-signer";

dotenv.config();

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});
import './tasks/estimateGas'

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.17",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  gasReporter: {
    enabled: (process.env.REPORT_GAS) ? true : false,
    showMethodSig: true,
    showTimeSpent: true,
    token: "BNB",
    currency: "USD",
    coinmarketcap: '1fba6c1d-805d-4d5b-abff-2b218a069489',
    outputFile: 'gas_price.md',
    noColors: true,
  },
  typechain: {
    outDir: "typechain",
    target: "ethers-v5",
  },
  // defaultNetwork: "goerli",
  networks: {
    binance: {
      url: process.env.BINANCE_URL || "",
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    binance_testnet: {
      url: process.env.BINANCE_TESTNET_URL || "",
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    rinkeby: {
      url: process.env.RINKEBY_URL || "",
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    goerli: {
      url: process.env.GOERLI_URL || "",
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    sepolia: {
      url: process.env.SEPOLIA_URL || "",
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    truffle: {
      url: "http://localhost:24012/rpc",
      timeout: 60000,
      gasMultiplier: 1,
    },
    hardhat: {
      accounts: {
        count: 10,
      },
    },
  },
  // gasReporter: {
  //   enabled: process.env.REPORT_GAS !== undefined,
  //   currency: "USD",
  // },
  etherscan: {
    apiKey: {
      etherscan: process.env.ETHERSCAN_API_KEY || "",
      mainnet: process.env.ETHERSCAN_API_KEY || "",
      sepolia: process.env.ETHERSCAN_API_KEY || "",
      bscTestnet: process.env.BSC_TESTNET_API_KEY || "",
    }
  },
};

export default config;

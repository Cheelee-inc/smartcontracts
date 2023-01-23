import {
  CHEELConfigInterface,
  CommonBlacklistInterface, LEEConfigInterface, NFTConfigInterface, NFTSaleConfigInterface, TreasuryConfigInterface
} from '../lib/ContractsConfigInterface';
import * as Networks from '../lib/Networks';

export const CommonBlacklistConfig: CommonBlacklistInterface = {
  testnet: Networks.bscTestnet,
  mainnet: Networks.bscMainnet,
  contractName: 'CommonBlacklist',
  multiSigAddress: '0xe69c24fa49fc2ff52305e4300d627a9094b648f5',
  contractAddress: '0xcb6078492EBCFd3916945f5b9a33BAEFc305b8D3',
  proxyContractAddress: '0x67fb66b687649023Dd915e0a69Ce8EcA65A19C93',
};

export const LEEConfig: LEEConfigInterface = {
  testnet: Networks.bscTestnet,
  mainnet: Networks.bscMainnet,
  contractName: 'LEE',
  tokenName: 'CHEELEE Attention Token',
  tokenSymbol: 'LEE',
  maxAmount: 7000000000,
  blackList: '0xA249d6BC908509273101Ee1705d8AAa4c1d0c064',
  multiSigAddress: '0xE6e74cA74e2209A5f2272f531627f44d34AFc299',
  contractAddress: '0xcd7311a7F9112817187c42fe9596f9890e192caC',
  proxyContractAddress: '0x916587F9b832e8609321b62200EdF93D94AA77Bf',
};

export const CHEELConfig: CHEELConfigInterface = {
  testnet: Networks.bscTestnet,
  mainnet: Networks.bscMainnet,
  contractName: 'CHEEL',
  tokenName: 'CHEELEE',
  tokenSymbol: 'CHEEL',
  maxAmount: 1000000000,
  blackList: 'blackList',
  multiSigAddress: '0xe69c24fa49fc2ff52305e4300d627a9094b648f5',
  contractAddress: '0x4bA4b73305805395FB37e84E49C74a8Bd29e703c',
  proxyContractAddress: '0xeD1B0eE1fd6AA9cEeCB4343Ce56475641A29e258',
};

export const NFTGlassesConfig: NFTConfigInterface = {
  testnet: Networks.bscTestnet,
  mainnet: Networks.bscMainnet,
  contractName: 'NFT',
  nftName: 'CHEELEE NFT Glasses',
  nftSymbol: 'CNFTG',
  blackList: 'blackList',
  multiSigAddress: '0xC40b7fBb7160B98323159BA800e122C9DeD0668D',
  contractAddress: '0x0645E0F7eE8ED0F20F3fC1DBFE81829Dd33CbFf2',
  proxyContractAddress: '0xC3C7d40941C620b1Ff6f73093d75b54DfB7E82F0',
};

export const NFTCasesConfig: NFTConfigInterface = {
  testnet: Networks.bscTestnet,
  mainnet: Networks.bscMainnet,
  contractName: 'NFT',
  nftName: 'CHEELEE NFT Cases',
  nftSymbol: 'CNFTC',
  blackList: 'blackList',
  multiSigAddress: '0xC40b7fBb7160B98323159BA800e122C9DeD0668D',
  contractAddress: '0x0645E0F7eE8ED0F20F3fC1DBFE81829Dd33CbFf2',
  proxyContractAddress: '0x252FE80eC028aAfEB3925f8233a9ef024aDfdDfA',
};

export const NFTSaleConfig: NFTSaleConfigInterface = {
  testnet: Networks.bscTestnet,
  mainnet: Networks.bscMainnet,
  contractName: 'NFTSale',
  multiSigAddress: '0x841005214049dcE3168CF8a323DD742BcfbF1dc4',
  contractAddress: '0x0645E0F7eE8ED0F20F3fC1DBFE81829Dd33CbFf2',
  proxyContractAddress: '0x252FE80eC028aAfEB3925f8233a9ef024aDfdDfA',
};

export const TreasuryConfig: TreasuryConfigInterface = {
  testnet: Networks.bscTestnet,
  mainnet: Networks.bscMainnet,
  contractName: 'NFTSale',
  multiSigAddress: '0x4c4B657574782E68ECEdabA8151e25dC2C9C1C70',
  contractAddress: '0x0645E0F7eE8ED0F20F3fC1DBFE81829Dd33CbFf2',
  proxyContractAddress: '0x252FE80eC028aAfEB3925f8233a9ef024aDfdDfA',
};

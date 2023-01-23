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
  proxyContractAddress: '0xA18aBFeB119eC4e7412994293b24bdD6B55f06B1',
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
  contractAddress: '0x82DdbB6bA5adc5ca7248d0eE64318a721778d95C',
  proxyContractAddress: '0x76eBABfA9AdEAc8dF6ba4d6aB469BD6c4Ff2462A',
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
  contractAddress: '0xf02AB9810c7bC496979165ccd24a1BBDFD0B1eAc',
  proxyContractAddress: '0x3587035541b61bF766c0d41E9e639329A41C48D0',
};

export const NFTGlassesConfig: NFTConfigInterface = {
  testnet: Networks.bscTestnet,
  mainnet: Networks.bscMainnet,
  contractName: 'NFT',
  nftName: 'CHEELEE NFT Glasses',
  nftSymbol: 'CNFTG',
  blackList: 'blackList',
  multiSigAddress: '0xC40b7fBb7160B98323159BA800e122C9DeD0668D',
  contractAddress: '0x51edF70583b8AB40EDee56e626C61a96149f7f41',
  proxyContractAddress: '0x0e28d8A7740fbDCFD51fC27aF90E4bc26315e2BB',
};

export const NFTCasesConfig: NFTConfigInterface = {
  testnet: Networks.bscTestnet,
  mainnet: Networks.bscMainnet,
  contractName: 'NFT',
  nftName: 'CHEELEE NFT Cases',
  nftSymbol: 'CNFTC',
  blackList: 'blackList',
  multiSigAddress: '0xC40b7fBb7160B98323159BA800e122C9DeD0668D',
  contractAddress: '0x51edF70583b8AB40EDee56e626C61a96149f7f41',
  proxyContractAddress: '0xaeda2431d2A292C734783922E69f3694F0Fb6C3f',
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

import {
  CHEELConfigInterface,
  CommonBlacklistInterface, LEEConfigInterface, NFTConfigInterface, NFTSaleConfigInterface, TreasuryConfigInterface
} from '../lib/ContractsConfigInterface';
import * as Networks from '../lib/Networks';

export const CommonBlacklistConfig: CommonBlacklistInterface = {
  testnet: Networks.bscTestnet,
  mainnet: Networks.bscMainnet,
  contractName: 'CommonBlacklist',
  multiSigAddress: '0x126481E4E79cBc8b4199911342861F7535e76EE7',
  contractAddress: '0x5c01f5AFF26Abb2d444e71B3f4321E408dbea1EB',
  proxyContractAddress: '0xf7c0F7d756283349438ae2278DF389e5eC3bb2d2',
  adminContractAddress: '0xe9B36a6cacB369E7eee08d595720662425454bc2',
};

export const LEEConfig: LEEConfigInterface = {
  testnet: Networks.bscTestnet,
  mainnet: Networks.bscMainnet,
  contractName: 'LEE',
  tokenName: 'CHEELEE Attention Token',
  tokenSymbol: 'LEE',
  maxAmount: 7000000000,
  blackList: '0xf7c0F7d756283349438ae2278DF389e5eC3bb2d2',
  multiSigAddress: '0xE6e74cA74e2209A5f2272f531627f44d34AFc299',
  contractAddress: '0x99E6E770ccB85fca08B4990F763C5491c56D3384',
  proxyContractAddress: '0xB6be99BEDBa40F0606199534977dE2b6D5857bfe',
  adminContractAddress: '0xe9B36a6cacB369E7eee08d595720662425454bc2',
};

export const CHEELConfig: CHEELConfigInterface = {
  testnet: Networks.bscTestnet,
  mainnet: Networks.bscMainnet,
  contractName: 'CHEEL',
  tokenName: 'CHEELEE',
  tokenSymbol: 'CHEEL',
  maxAmount: 1000000000,
  blackList: '0xf7c0F7d756283349438ae2278DF389e5eC3bb2d2',
  multiSigAddress: '0x126481E4E79cBc8b4199911342861F7535e76EE7',
  contractAddress: '0x79a2296D3F48F9A9a267a888F77e5401624c89d2',
  proxyContractAddress: '0xACC7f64ea52C947Ca838bE1Fb274FC477cFE8791',
  adminContractAddress: '0xe9B36a6cacB369E7eee08d595720662425454bc2',
};

export const NFTGlassesConfig: NFTConfigInterface = {
  testnet: Networks.bscTestnet,
  mainnet: Networks.bscMainnet,
  contractName: 'NFT',
  nftName: 'CHEELEE NFT Glasses',
  nftSymbol: 'CNFTG',
  blackList: '0xf7c0F7d756283349438ae2278DF389e5eC3bb2d2',
  multiSigAddress: '0xC40b7fBb7160B98323159BA800e122C9DeD0668D',
  contractAddress: '0x13cFCc486A34595Df30DF5A4507d65A72126b464',
  proxyContractAddress: '0xC76415525c3C7F3c226B204660143823482e8fCD',
  adminContractAddress: '0xe9B36a6cacB369E7eee08d595720662425454bc2',
};

export const NFTCasesConfig: NFTConfigInterface = {
  testnet: Networks.bscTestnet,
  mainnet: Networks.bscMainnet,
  contractName: 'NFT',
  nftName: 'CHEELEE NFT Cases',
  nftSymbol: 'CNFTC',
  blackList: '0xf7c0F7d756283349438ae2278DF389e5eC3bb2d2',
  multiSigAddress: '0xC40b7fBb7160B98323159BA800e122C9DeD0668D',
  contractAddress: '0x13cFCc486A34595Df30DF5A4507d65A72126b464',
  proxyContractAddress: '0xcF87261003F389cF6F0b06f9511C43E155cE5D72',
  adminContractAddress: '0xe9B36a6cacB369E7eee08d595720662425454bc2',
};

export const NFTSaleConfig: NFTSaleConfigInterface = {
  testnet: Networks.bscTestnet,
  mainnet: Networks.bscMainnet,
  contractName: 'NFTSale',
  multiSigAddress: '0x841005214049dcE3168CF8a323DD742BcfbF1dc4',
  contractAddress: '0x0645E0F7eE8ED0F20F3fC1DBFE81829Dd33CbFf2',
  proxyContractAddress: '0x252FE80eC028aAfEB3925f8233a9ef024aDfdDfA',
  adminContractAddress: '0xe9B36a6cacB369E7eee08d595720662425454bc2',
};

export const TreasuryConfig: TreasuryConfigInterface = {
  testnet: Networks.bscTestnet,
  mainnet: Networks.bscMainnet,
  contractName: 'Treasury',
  multiSigAddress: '0x4c4B657574782E68ECEdabA8151e25dC2C9C1C70',
  contractAddress: '0x31b9F82C5C160297Bd56c7eFD0e8a0A62077062e',
  proxyContractAddress: '0x54b2647c151990aC9E6bBe1cf39d5571D562c87c',
  adminContractAddress: '0xe9B36a6cacB369E7eee08d595720662425454bc2',
};

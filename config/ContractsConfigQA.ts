import {
  CHEELConfigInterface,
  CommonBlacklistInterface,
  LEEConfigInterface,
  NFTConfigInterface,
  NFTSaleConfigInterface,
  TreasuryConfigInterface,
  USDTInterface
} from '../lib/ContractsConfigInterface';
import * as Networks from '../lib/Networks';

export const USDTConfig: USDTInterface = {
  testnet: Networks.bscTestnet,
  mainnet: Networks.bscMainnet,
  contractName: 'USDT',
  tokenName: 'Tether USD',
  symbol: 'USDT',
  decimals: 18,
  maxSupply: 7000000000,
  contractAddress: '0x22699c65d7d943f7F5Fa4a5060020cC7c46b75EF',
};

export const CommonBlacklistConfig: CommonBlacklistInterface = {
  testnet: Networks.bscTestnet,
  mainnet: Networks.bscMainnet,
  contractName: 'CommonBlacklist',
  multiSigAddress: '0x2ee51F0bCC1ece7B94091e5E250b08e8276256D9',
  contractAddress: '0x7B66D8D4e4e7154030c669cF74791f095C9F914A',
  proxyContractAddress: '0x49659741a701571ee9C3ae00d1Ceab37b93d4484',
  adminContractAddress: '0x0a5B7dC257419A932908175494604152CF1B9B96',
};

export const LEEConfig: LEEConfigInterface = {
  testnet: Networks.bscTestnet,
  mainnet: Networks.bscMainnet,
  contractName: 'LEE',
  tokenName: 'CHEELEE Attention Token',
  tokenSymbol: 'LEE',
  maxAmount: 7000000000,
  blackList: '0x49659741a701571ee9C3ae00d1Ceab37b93d4484',
  multiSigAddress: '0x2ee51F0bCC1ece7B94091e5E250b08e8276256D9',
  contractAddress: '0xAc355CD7733e1D6457927CA715Ce33551357350E',
  proxyContractAddress: '0xEe04FC2591295436a66b6EE435a37BBa433cC38f',
  adminContractAddress: '0x0a5B7dC257419A932908175494604152CF1B9B96',
};

export const CHEELConfig: CHEELConfigInterface = {
  testnet: Networks.bscTestnet,
  mainnet: Networks.bscMainnet,
  contractName: 'CHEEL',
  tokenName: 'CHEELEE',
  tokenSymbol: 'CHEEL',
  maxAmount: 1000000000,
  blackList: '0x49659741a701571ee9C3ae00d1Ceab37b93d4484',
  multiSigAddress: '0x2ee51F0bCC1ece7B94091e5E250b08e8276256D9',
  contractAddress: '0xf4DC6a5e7fa77f1F2668cE032B8dEa48ADEac91B',
  proxyContractAddress: '0xc17A117dd59F3c1fCbdca096319e4B2bE90EF677',
  adminContractAddress: '0x0a5B7dC257419A932908175494604152CF1B9B96',
};

export const NFTGlassesConfig: NFTConfigInterface = {
  testnet: Networks.bscTestnet,
  mainnet: Networks.bscMainnet,
  contractName: 'NFT',
  nftName: 'CHEELEE NFT Glasses',
  nftSymbol: 'CNFTG',
  blackList: '0x49659741a701571ee9C3ae00d1Ceab37b93d4484',
  multiSigAddress: '0x2ee51F0bCC1ece7B94091e5E250b08e8276256D9',
  contractAddress: '0x4Be56Ab0f2727E1A59838F313991F546C6940C1C',
  proxyContractAddress: '0xa54f7EFf538f4f289c4baFbb285F01bA22F127e6',
  adminContractAddress: '0x0a5B7dC257419A932908175494604152CF1B9B96',
};

export const NFTCasesConfig: NFTConfigInterface = {
  testnet: Networks.bscTestnet,
  mainnet: Networks.bscMainnet,
  contractName: 'NFT',
  nftName: 'CHEELEE NFT Cases',
  nftSymbol: 'CNFTC',
  blackList: '0x49659741a701571ee9C3ae00d1Ceab37b93d4484',
  multiSigAddress: '0x2ee51F0bCC1ece7B94091e5E250b08e8276256D9',
  contractAddress: '0x4Be56Ab0f2727E1A59838F313991F546C6940C1C',
  proxyContractAddress: '0xB0c4e0314aF7B0c140e95AaE659Da8d9a91b79EA',
  adminContractAddress: '0x0a5B7dC257419A932908175494604152CF1B9B96',
};

export const NFTGemsConfig: NFTConfigInterface = {
  testnet: Networks.bscTestnet,
  mainnet: Networks.bscMainnet,
  contractName: 'NFT',
  nftName: 'CHEELEE NFT Gems',
  nftSymbol: 'CNFTG',
  blackList: '0x49659741a701571ee9C3ae00d1Ceab37b93d4484',
  multiSigAddress: '0x2ee51F0bCC1ece7B94091e5E250b08e8276256D9',
  contractAddress: '0x4Be56Ab0f2727E1A59838F313991F546C6940C1C',
  proxyContractAddress: '0x36783882580B4392d5742c8aa0Ad8Cbc78411d54',
  adminContractAddress: '0x0a5B7dC257419A932908175494604152CF1B9B96',
};

export const NFTCasesSaleConfig: NFTSaleConfigInterface = {
  testnet: Networks.bscTestnet,
  mainnet: Networks.bscMainnet,
  contractName: 'NFTSale',
  signer: '0xd02ea004e9cC09c19baab15DEA619Ad0e2E06282',
  usdt: '0x22699c65d7d943f7F5Fa4a5060020cC7c46b75EF',
  wallet: '0x2ee51F0bCC1ece7B94091e5E250b08e8276256D9',
  multiSigAddress: '0x2ee51F0bCC1ece7B94091e5E250b08e8276256D9',
  contractAddress: '0x829272b001110f9c424b2EdF8c60c9Dfc6eE7293',
};

export const NFTGlassesSaleConfig: NFTSaleConfigInterface = {
  testnet: Networks.bscTestnet,
  mainnet: Networks.bscMainnet,
  contractName: 'NFTSale',
  signer: '0xd02ea004e9cC09c19baab15DEA619Ad0e2E06282',
  usdt: '0x22699c65d7d943f7F5Fa4a5060020cC7c46b75EF',
  wallet: '0x2ee51F0bCC1ece7B94091e5E250b08e8276256D9',
  multiSigAddress: '0x2ee51F0bCC1ece7B94091e5E250b08e8276256D9',
  contractAddress: '0xEdD7c5d8E64eC62AfDC832bc35c05085C2579893',
};

export const TreasuryConfig: TreasuryConfigInterface = {
  testnet: Networks.bscTestnet,
  mainnet: Networks.bscMainnet,
  contractName: 'Treasury',
  signer: '0xd02ea004e9cC09c19baab15DEA619Ad0e2E06282',
  usdt: '0x22699c65d7d943f7F5Fa4a5060020cC7c46b75EF',
  multiSigAddress: '0x2ee51F0bCC1ece7B94091e5E250b08e8276256D9',
  contractAddress: '0xa028183175B9B4885772841be63281928E63C335',
  proxyContractAddress: '0x92fb0442Fd10813f7e6eC5f2Ee4cfCc4EEb70982',
  adminContractAddress: '0x0a5B7dC257419A932908175494604152CF1B9B96',
};

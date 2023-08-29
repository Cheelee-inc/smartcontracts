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
  contractAddress: '0xCF0F093AE5A3226FD0118D4AD4B900c5B1b793aB',
};

export const CommonBlacklistConfig: CommonBlacklistInterface = {
  testnet: Networks.bscTestnet,
  mainnet: Networks.bscMainnet,
  contractName: 'CommonBlacklist',
  multiSigAddress: '0x2ee51F0bCC1ece7B94091e5E250b08e8276256D9',
  contractAddress: '0x7B66D8D4e4e7154030c669cF74791f095C9F914A',
  proxyContractAddress: '0xa68A49D6B92c4E041542D8EdCd0CD4A915682e05',
  adminContractAddress: '0x0a5B7dC257419A932908175494604152CF1B9B96',
};

export const LEEConfig: LEEConfigInterface = {
  testnet: Networks.bscTestnet,
  mainnet: Networks.bscMainnet,
  contractName: 'LEE',
  tokenName: 'CHEELEE Attention Token',
  tokenSymbol: 'LEE',
  maxAmount: 7000000000,
  blackList: '0xa68A49D6B92c4E041542D8EdCd0CD4A915682e05',
  multiSigAddress: '0x2ee51F0bCC1ece7B94091e5E250b08e8276256D9',
  contractAddress: '0xAc355CD7733e1D6457927CA715Ce33551357350E',
  proxyContractAddress: '0xa0b6B10aaCeb44ef473f81fA1Fc9dD244E9E3987',
  adminContractAddress: '0x0a5B7dC257419A932908175494604152CF1B9B96',
};

export const CHEELConfig: CHEELConfigInterface = {
  testnet: Networks.bscTestnet,
  mainnet: Networks.bscMainnet,
  contractName: 'CHEEL',
  tokenName: 'CHEELEE',
  tokenSymbol: 'CHEEL',
  maxAmount: 1000000000,
  blackList: '0xa68A49D6B92c4E041542D8EdCd0CD4A915682e05',
  multiSigAddress: '0x2ee51F0bCC1ece7B94091e5E250b08e8276256D9',
  contractAddress: '0xf4DC6a5e7fa77f1F2668cE032B8dEa48ADEac91B',
  proxyContractAddress: '0xA3e75fA9d2ea872A9C819065765505D57BEfaB36',
  adminContractAddress: '0x0a5B7dC257419A932908175494604152CF1B9B96',
};

export const NFTGlassesConfig: NFTConfigInterface = {
  testnet: Networks.bscTestnet,
  mainnet: Networks.bscMainnet,
  contractName: 'NFT',
  nftName: 'CHEELEE NFT Glasses',
  nftSymbol: 'CNFTG',
  blackList: '0xa68A49D6B92c4E041542D8EdCd0CD4A915682e05',
  multiSigAddress: '0x2ee51F0bCC1ece7B94091e5E250b08e8276256D9',
  contractAddress: '0x4Be56Ab0f2727E1A59838F313991F546C6940C1C',
  proxyContractAddress: '0x4cA77D8938e94291814dFad5810192B0db7a6D08',
  adminContractAddress: '0x0a5B7dC257419A932908175494604152CF1B9B96',
};

export const NFTCasesConfig: NFTConfigInterface = {
  testnet: Networks.bscTestnet,
  mainnet: Networks.bscMainnet,
  contractName: 'NFT',
  nftName: 'CHEELEE NFT Cases',
  nftSymbol: 'CNFTC',
  blackList: '0xa68A49D6B92c4E041542D8EdCd0CD4A915682e05',
  multiSigAddress: '0x2ee51F0bCC1ece7B94091e5E250b08e8276256D9',
  contractAddress: '0x4Be56Ab0f2727E1A59838F313991F546C6940C1C',
  proxyContractAddress: '0x0d0feF1CB856FD07f5b8815339aB008A2e2B0F61',
  adminContractAddress: '0x0a5B7dC257419A932908175494604152CF1B9B96',
};

export const NFTGemsConfig: NFTConfigInterface = {
  testnet: Networks.bscTestnet,
  mainnet: Networks.bscMainnet,
  contractName: 'NFT',
  nftName: 'CHEELEE NFT Gems',
  nftSymbol: 'CNFTG',
  blackList: '0xa68A49D6B92c4E041542D8EdCd0CD4A915682e05',
  multiSigAddress: '0x2ee51F0bCC1ece7B94091e5E250b08e8276256D9',
  contractAddress: '0x4Be56Ab0f2727E1A59838F313991F546C6940C1C',
  proxyContractAddress: '0x4E389036f00450a13B7EcBE201eE85332dEc5b1b',
  adminContractAddress: '0x0a5B7dC257419A932908175494604152CF1B9B96',
};

export const NFTCasesSaleConfig: NFTSaleConfigInterface = {
  testnet: Networks.bscTestnet,
  mainnet: Networks.bscMainnet,
  contractName: 'NFTSale',
  signer: '0xd02ea004e9cC09c19baab15DEA619Ad0e2E06282',
  usdt: '0xCF0F093AE5A3226FD0118D4AD4B900c5B1b793aB',
  wallet: '0x2ee51F0bCC1ece7B94091e5E250b08e8276256D9',
  multiSigAddress: '0x2ee51F0bCC1ece7B94091e5E250b08e8276256D9',
  contractAddress: '0x5E90b70f738dE63bB4570229777209964dDcb1A8',
};

export const NFTGlassesSaleConfig: NFTSaleConfigInterface = {
  testnet: Networks.bscTestnet,
  mainnet: Networks.bscMainnet,
  contractName: 'NFTSale',
  signer: '0xd02ea004e9cC09c19baab15DEA619Ad0e2E06282',
  usdt: '0xCF0F093AE5A3226FD0118D4AD4B900c5B1b793aB',
  wallet: '0x2ee51F0bCC1ece7B94091e5E250b08e8276256D9',
  multiSigAddress: '0x2ee51F0bCC1ece7B94091e5E250b08e8276256D9',
  contractAddress: '0x701442D236Ab4b6041e57f06794dB4154619871b',
};

export const TreasuryConfig: TreasuryConfigInterface = {
  testnet: Networks.bscTestnet,
  mainnet: Networks.bscMainnet,
  contractName: 'Treasury',
  signer: '0xd02ea004e9cC09c19baab15DEA619Ad0e2E06282',
  usdt: '0xCF0F093AE5A3226FD0118D4AD4B900c5B1b793aB',
  multiSigAddress: '0x2ee51F0bCC1ece7B94091e5E250b08e8276256D9',
  contractAddress: '0xa028183175B9B4885772841be63281928E63C335',
  proxyContractAddress: '0x73b00B64c2c994e1B3E2337adfd22e8FcA0f663a',
  adminContractAddress: '0x0a5B7dC257419A932908175494604152CF1B9B96',
};

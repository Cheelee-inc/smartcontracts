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
  contractAddress: '0xCB367893413E4c961C8220b2e3Ce9174A32959C5',
  proxyContractAddress: '0x7C1E145346Cb97BeeD131ce541d0497Bada9f1DF',
  adminContractAddress: '0x1cf4dF9dA9062Fd7c441a9B77c6bcF45596492bB',
};

export const LEEConfig: LEEConfigInterface = {
  testnet: Networks.bscTestnet,
  mainnet: Networks.bscMainnet,
  contractName: 'LEE',
  tokenName: 'CHEELEE Attention Token',
  tokenSymbol: 'LEE',
  maxAmount: 7000000000,
  blackList: '0x7C1E145346Cb97BeeD131ce541d0497Bada9f1DF',
  multiSigAddress: '0xE6e74cA74e2209A5f2272f531627f44d34AFc299',
  contractAddress: '0x7Fa8d22c2d8EBeFcE3595B38EE7FDbab0F697D6f',
  proxyContractAddress: '0x5b72798a4F4983D6e32215125374A8E2a39cc2de',
  adminContractAddress: '0x1cf4dF9dA9062Fd7c441a9B77c6bcF45596492bB',
};

export const CHEELConfig: CHEELConfigInterface = {
  testnet: Networks.bscTestnet,
  mainnet: Networks.bscMainnet,
  contractName: 'CHEEL',
  tokenName: 'CHEELEE',
  tokenSymbol: 'CHEEL',
  maxAmount: 1000000000,
  blackList: '0x7C1E145346Cb97BeeD131ce541d0497Bada9f1DF',
  multiSigAddress: '0x126481E4E79cBc8b4199911342861F7535e76EE7',
  contractAddress: '0xFC510c8e5C7973F8fbaeb2b20b9e686d05851abf',
  proxyContractAddress: '0x439CBe5d6cb1ade400BF2a83f207Bdc491b4fd0d',
  adminContractAddress: '0x1cf4dF9dA9062Fd7c441a9B77c6bcF45596492bB',
};

export const NFTGlassesConfig: NFTConfigInterface = {
  testnet: Networks.bscTestnet,
  mainnet: Networks.bscMainnet,
  contractName: 'NFT',
  nftName: 'CHEELEE NFT Glasses',
  nftSymbol: 'CNFTG',
  blackList: '0x7C1E145346Cb97BeeD131ce541d0497Bada9f1DF',
  multiSigAddress: '0xC40b7fBb7160B98323159BA800e122C9DeD0668D',
  contractAddress: '0x4B9a05F7B88596EaF752Bc2fc7617ac998e3a91C',
  proxyContractAddress: '0x6484E027BDA3B082FE04dAf76e36C973B3352d45',
  adminContractAddress: '0x1cf4dF9dA9062Fd7c441a9B77c6bcF45596492bB',
};

export const NFTCasesConfig: NFTConfigInterface = {
  testnet: Networks.bscTestnet,
  mainnet: Networks.bscMainnet,
  contractName: 'NFT',
  nftName: 'CHEELEE NFT Cases',
  nftSymbol: 'CNFTC',
  blackList: '0x7C1E145346Cb97BeeD131ce541d0497Bada9f1DF',
  multiSigAddress: '0xC40b7fBb7160B98323159BA800e122C9DeD0668D',
  contractAddress: '0x4B9a05F7B88596EaF752Bc2fc7617ac998e3a91C',
  proxyContractAddress: '0x41d2bA27d97f026968De00F034580Fd0dd8d4333',
  adminContractAddress: '0x1cf4dF9dA9062Fd7c441a9B77c6bcF45596492bB',
};

export const NFTSaleConfig: NFTSaleConfigInterface = {
  testnet: Networks.bscTestnet,
  mainnet: Networks.bscMainnet,
  contractName: 'NFTSale',
  multiSigAddress: '0x841005214049dcE3168CF8a323DD742BcfbF1dc4',
  contractAddress: '0x0645E0F7eE8ED0F20F3fC1DBFE81829Dd33CbFf2',
  proxyContractAddress: '0x252FE80eC028aAfEB3925f8233a9ef024aDfdDfA',
  adminContractAddress: '0x1cf4dF9dA9062Fd7c441a9B77c6bcF45596492bB',
};

export const TreasuryConfig: TreasuryConfigInterface = {
  testnet: Networks.bscTestnet,
  mainnet: Networks.bscMainnet,
  contractName: 'Treasury',
  multiSigAddress: '0xe69C24fA49FC2fF52305E4300D627a9094b648f5',
  contractAddress: '0xD43722bCfa6C8274c25878627371d7Ac51235bB9',
  proxyContractAddress: '0x703FEaa4eCadc96673a06C31c4053Fd014272999',
  adminContractAddress: '0x1cf4dF9dA9062Fd7c441a9B77c6bcF45596492bB',
};

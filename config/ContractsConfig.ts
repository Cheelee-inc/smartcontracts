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
  contractAddress: '0x93962788805379c25Ef610FF5fd3c54f38D17333',
  proxyContractAddress: '0x6EE6F05425DCF27DDFab9603c4Fb93ea9B3d4cD5',
  adminContractAddress: '0x47CB8b3086956d4b99dd87df2cAc17F0f8CD3E48',
};

export const LEEConfig: LEEConfigInterface = {
  testnet: Networks.bscTestnet,
  mainnet: Networks.bscMainnet,
  contractName: 'LEE',
  tokenName: 'CHEELEE Attention Token',
  tokenSymbol: 'LEE',
  maxAmount: 7000000000,
  blackList: '0x6EE6F05425DCF27DDFab9603c4Fb93ea9B3d4cD5',
  multiSigAddress: '0xE6e74cA74e2209A5f2272f531627f44d34AFc299',
  contractAddress: '0xee3bA59E1626E08449D52B95aF447DcBF4fd96f5',
  proxyContractAddress: '0x93d28cd94D896b1fec29FF0618C13B3574AbA5Bc',
  adminContractAddress: '0x1d305206AEf96eC878C34342b34beb760f597BC2',
};

export const CHEELConfig: CHEELConfigInterface = {
  testnet: Networks.bscTestnet,
  mainnet: Networks.bscMainnet,
  contractName: 'CHEEL',
  tokenName: 'CHEELEE',
  tokenSymbol: 'CHEEL',
  maxAmount: 1000000000,
  blackList: '0x6EE6F05425DCF27DDFab9603c4Fb93ea9B3d4cD5',
  multiSigAddress: '0x126481E4E79cBc8b4199911342861F7535e76EE7',
  contractAddress: '0x8D355840a9F59a864D4CFa7F79aeC16EF6F887AE',
  proxyContractAddress: '0xaC67223965b54C7cBA04783B9F61214A8b8de4af',
  adminContractAddress: '0x1d305206AEf96eC878C34342b34beb760f597BC2',
};

export const NFTGlassesConfig: NFTConfigInterface = {
  testnet: Networks.bscTestnet,
  mainnet: Networks.bscMainnet,
  contractName: 'NFT',
  nftName: 'CHEELEE NFT Glasses',
  nftSymbol: 'CNFTG',
  blackList: '0x6EE6F05425DCF27DDFab9603c4Fb93ea9B3d4cD5',
  multiSigAddress: '0xC40b7fBb7160B98323159BA800e122C9DeD0668D',
  contractAddress: '0xff914f231Ce78aEF7f958a3caF649e8Fc1fFb7B9',
  proxyContractAddress: '0xA73b6D5C0be6b9247d316138321501b2f24F5dC0',
  adminContractAddress: '0x1d305206AEf96eC878C34342b34beb760f597BC2',
};

export const NFTCasesConfig: NFTConfigInterface = {
  testnet: Networks.bscTestnet,
  mainnet: Networks.bscMainnet,
  contractName: 'NFT',
  nftName: 'CHEELEE NFT Cases',
  nftSymbol: 'CNFTC',
  blackList: '0x6EE6F05425DCF27DDFab9603c4Fb93ea9B3d4cD5',
  multiSigAddress: '0xC40b7fBb7160B98323159BA800e122C9DeD0668D',
  contractAddress: '0xff914f231Ce78aEF7f958a3caF649e8Fc1fFb7B9',
  proxyContractAddress: '0x8BB23b7113a426e2dFa9c5e5Db8848ceA5254bb8',
  adminContractAddress: '0x1d305206AEf96eC878C34342b34beb760f597BC2',
};

export const NFTSaleConfig: NFTSaleConfigInterface = {
  testnet: Networks.bscTestnet,
  mainnet: Networks.bscMainnet,
  contractName: 'NFTSale',
  multiSigAddress: '0x841005214049dcE3168CF8a323DD742BcfbF1dc4',
  contractAddress: '0x0645E0F7eE8ED0F20F3fC1DBFE81829Dd33CbFf2',
  proxyContractAddress: '0x252FE80eC028aAfEB3925f8233a9ef024aDfdDfA',
  adminContractAddress: '0x1d305206AEf96eC878C34342b34beb760f597BC2',
};

export const TreasuryConfig: TreasuryConfigInterface = {
  testnet: Networks.bscTestnet,
  mainnet: Networks.bscMainnet,
  contractName: 'NFTSale',
  multiSigAddress: '0xe69C24fA49FC2fF52305E4300D627a9094b648f5',
  contractAddress: '0xb32c42883dC9Dd456Cf2D105214b54e6cABc30Dc',
  proxyContractAddress: '0x33FcB42B89cd1839B224BF96e687E54fB2718619',
  adminContractAddress: '0x1d305206AEf96eC878C34342b34beb760f597BC2',
};

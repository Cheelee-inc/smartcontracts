import NetworkConfigInterface from '../lib/NetworkConfigInterface';

export interface CommonBlacklistInterface {
  testnet: NetworkConfigInterface;
  mainnet: NetworkConfigInterface;
  contractName: string;
  multiSigAddress: string;
  contractAddress: string|null;
  proxyContractAddress: string;
  adminContractAddress: string|null;
}

export interface LEEConfigInterface {
  testnet: NetworkConfigInterface;
  mainnet: NetworkConfigInterface;
  contractName: string;
  tokenName: string;
  tokenSymbol: string;
  maxAmount: number;
  blackList: string;
  multiSigAddress: string;
  contractAddress: string|null;
  proxyContractAddress: string;
  adminContractAddress: string|null;
}

export interface CHEELConfigInterface {
  testnet: NetworkConfigInterface;
  mainnet: NetworkConfigInterface;
  contractName: string;
  tokenName: string;
  tokenSymbol: string;
  maxAmount: number;
  blackList: string;
  multiSigAddress: string;
  contractAddress: string|null;
  proxyContractAddress: string;
  adminContractAddress: string|null;
}

export interface NFTConfigInterface {
  testnet: NetworkConfigInterface;
  mainnet: NetworkConfigInterface;
  contractName: string;
  nftName: string;
  nftSymbol: string;
  blackList: string;
  multiSigAddress: string;
  contractAddress: string|null;
  proxyContractAddress: string;
  adminContractAddress: string|null;
}

export interface NFTSaleConfigInterface {
  testnet: NetworkConfigInterface;
  mainnet: NetworkConfigInterface;
  contractName: string;
  multiSigAddress: string;
  contractAddress: string|null;
  proxyContractAddress: string;
  adminContractAddress: string|null;
}

export interface TreasuryConfigInterface {
  testnet: NetworkConfigInterface;
  mainnet: NetworkConfigInterface;
  contractName: string;
  multiSigAddress: string;
  contractAddress: string|null;
  proxyContractAddress: string;
  adminContractAddress: string|null;
}



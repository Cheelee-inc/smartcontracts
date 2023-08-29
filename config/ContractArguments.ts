// Update the following array if you change the constructor arguments...
import {
  NFTCasesConfig,
  NFTCasesSaleConfig,
  NFTGlassesConfig,
  NFTGlassesSaleConfig,
  USDTConfig
} from "./ContractsConfig";

export const USDTArguments = [
  USDTConfig.tokenName,
  USDTConfig.symbol,
  USDTConfig.decimals,
  USDTConfig.maxSupply,
] as const;

export const NFTCasesSaleArguments = [
  NFTCasesConfig.proxyContractAddress,
  NFTCasesSaleConfig.signer,
  "1000000000000000000",
  1000,
  1000,
] as const;

export const NFTGlassesSaleArguments = [
  NFTGlassesConfig.proxyContractAddress,
  NFTGlassesSaleConfig.signer,
  "1000000000000000000",
  1000,
  1000,
] as const;

const ContractArguments = [] as const;

export default ContractArguments;

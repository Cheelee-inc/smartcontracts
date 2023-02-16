import ContractArguments from "../config/ContractArguments";

const hre = require("hardhat");
import {
  CommonBlacklistConfig,
  LEEConfig,
  CHEELConfig,
  NFTCasesConfig,
  NFTGlassesConfig
} from "../config/ContractsConfig";

async function main() {
  await hre.run("verify:verify", {address: CommonBlacklistConfig.contractAddress, constructorArguments: ContractArguments,});
  // await hre.run("verify:verify", {address: LEEConfig.contractAddress, constructorArguments: ContractArguments,});
  // await hre.run("verify:verify", {address: CHEELConfig.contractAddress, constructorArguments: ContractArguments,});
  // await hre.run("verify:verify", {address: NFTCasesConfig.contractAddress, constructorArguments: ContractArguments,});
  // await hre.run("verify:verify", {address: NFTGlassesConfig.contractAddress, constructorArguments: ContractArguments,});
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

import { ethers, upgrades } from 'hardhat';
import { LEEConfig } from "../config/ContractsConfig";
import {LEEContractType} from "../lib/ContractProvider";

async function main() {
  console.log('Upgrade LEE contract...');

  // We get the contract to deploy
  const NewLEEContract = await ethers.getContractFactory(LEEConfig.contractName);
  const newLEEContract = await upgrades.upgradeProxy(LEEConfig.proxyContractAddress, NewLEEContract) as LEEContractType;

  console.log('LEE Contract is upgraded:', newLEEContract);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

import { ethers, upgrades } from 'hardhat';
import {CHEELConfig} from "../config/ContractsConfig";
import {CHEELContractType} from "../lib/ContractProvider";

async function main() {
  console.log('Upgrade CHEEL contract...');

  // We get the contract to deploy
  const NewCHEELContract = await ethers.getContractFactory(CHEELConfig.contractName);
  const newCHEELContract = await upgrades.upgradeProxy(CHEELConfig.proxyContractAddress, NewCHEELContract) as CHEELContractType;

  console.log('CHEEL Contract is upgraded:', newCHEELContract);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

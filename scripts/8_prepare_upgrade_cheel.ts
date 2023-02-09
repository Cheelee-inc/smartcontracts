import { ethers, upgrades } from 'hardhat';
import {CHEELConfig} from "../config/ContractsConfig";

async function main() {
  console.log('Preparing for upgrade CHEEL contract...');

  // We get the contract to deploy
  const NewCHEELContract = await ethers.getContractFactory(CHEELConfig.contractName);
  const newCHEELContract = await upgrades.prepareUpgrade(CHEELConfig.proxyContractAddress, NewCHEELContract) as string;

  console.log('New CHEEL Contract deployed to:', newCHEELContract);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

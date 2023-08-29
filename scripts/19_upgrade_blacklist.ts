import { ethers, upgrades } from 'hardhat';
import {CommonBlacklistConfig} from "../config/ContractsConfig";
import {CommonBlacklistContractType} from "../lib/ContractProvider";

async function main() {
  console.log('Upgrade Blacklist contract...');

  // We get the contract to deploy
  const NewBlacklistContract = await ethers.getContractFactory(CommonBlacklistConfig.contractName);
  await upgrades.upgradeProxy(CommonBlacklistConfig.proxyContractAddress, NewBlacklistContract) as CommonBlacklistContractType;

  console.log('Blacklist Contract is upgraded');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

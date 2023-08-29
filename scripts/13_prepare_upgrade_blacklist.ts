import { ethers, upgrades } from 'hardhat';
import { CommonBlacklistConfig } from "../config/ContractsConfig";
import {verify} from "./24_verify";

async function main() {
  console.log('Preparing for upgrade Blacklist contract...');

  // We get the contract to deploy
  const NewBlacklistContract = await ethers.getContractFactory(CommonBlacklistConfig.contractName);
  const newBlacklistContract = await upgrades.prepareUpgrade(CommonBlacklistConfig.proxyContractAddress, NewBlacklistContract) as string;

  console.log('New Blacklist Contract deployed to:', newBlacklistContract);
  console.log('Verification for Blacklist contract...');
  await verify(newBlacklistContract, []);
  console.log('Blacklist contract is verified');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

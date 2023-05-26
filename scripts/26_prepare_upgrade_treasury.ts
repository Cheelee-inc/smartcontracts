import { ethers, upgrades } from 'hardhat';
import { TreasuryConfig } from "../config/ContractsConfig";
import {verify} from "./verify";

async function main() {
  console.log('Preparing for upgrade Treasury contract...');

  // We get the contract to deploy
  const NewTreasuryContract = await ethers.getContractFactory(TreasuryConfig.contractName);
  const newTreasuryContract = await upgrades.prepareUpgrade(TreasuryConfig.proxyContractAddress, NewTreasuryContract) as string;

  console.log('New Treasury Contract deployed to:', newTreasuryContract);
  console.log('Verification for Treasury contract...');
  await verify(newTreasuryContract, []);
  console.log('Treasury contract is verified');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

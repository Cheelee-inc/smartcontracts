import { ethers, upgrades } from 'hardhat';
import { LEEConfig } from "../config/ContractsConfig";

async function main() {
  console.log('Preparing for upgrade LEE contract...');

  // We get the contract to deploy
  const NewLEEContract = await ethers.getContractFactory(LEEConfig.contractName);
  const newLEEContract = await upgrades.prepareUpgrade(LEEConfig.proxyContractAddress, NewLEEContract) as string;

  console.log('New LEE Contract deployed to:', newLEEContract);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

import { ethers, upgrades } from 'hardhat';
import {NFTGemsConfig} from "../config/ContractsConfig";
import {NFTContractType} from "../lib/ContractProvider";

async function main() {
  console.log('Upgrade NFT Gems contract...');

  // We get the contract to deploy
  const NewNFTGemsContract = await ethers.getContractFactory(NFTGemsConfig.contractName);
  await upgrades.upgradeProxy(NFTGemsConfig.proxyContractAddress, NewNFTGemsContract) as NFTContractType;

  console.log('NFT Gems Contract is upgraded');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

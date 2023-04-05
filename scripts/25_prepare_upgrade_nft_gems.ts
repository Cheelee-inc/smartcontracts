import { ethers, upgrades } from 'hardhat';
import {NFTGemsConfig} from "../config/ContractsConfig";
import {verify} from "./verify";

async function main() {
  console.log('Preparing for upgrade NFT Gems contract...');

  // We get the contract to deploy
  const NewNFTGemsContract = await ethers.getContractFactory(NFTGemsConfig.contractName);
  const newNFTGemsContract = await upgrades.prepareUpgrade(NFTGemsConfig.proxyContractAddress, NewNFTGemsContract) as string;

  console.log('New NFT Gems Contract deployed to:', newNFTGemsContract);
  console.log('Verification for NFT Gems contract...');
  await verify(newNFTGemsContract, []);
  console.log('NFT Gems contract is verified');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

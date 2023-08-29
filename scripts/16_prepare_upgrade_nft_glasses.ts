import { ethers, upgrades } from 'hardhat';
import {NFTGlassesConfig} from "../config/ContractsConfig";
import {verify} from "./24_verify";

async function main() {
  console.log('Preparing for upgrade NFT Glasses contract...');

  // We get the contract to deploy
  const NewNFTGlassesContract = await ethers.getContractFactory(NFTGlassesConfig.contractName);
  const newNFTGlassesContract = await upgrades.prepareUpgrade(NFTGlassesConfig.proxyContractAddress, NewNFTGlassesContract) as string;

  console.log('New NFT Glasses Contract deployed to:', newNFTGlassesContract);
  console.log('Verification for NFT Glasses contract...');
  await verify(newNFTGlassesContract, []);
  console.log('NFT Glasses contract is verified');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

import { ethers, upgrades } from 'hardhat';
import {NFTCasesConfig} from "../config/ContractsConfig";
import {verify} from "./verify";

async function main() {
  console.log('Preparing for upgrade NFT Cases contract...');

  // We get the contract to deploy
  const NewNFTCasesContract = await ethers.getContractFactory(NFTCasesConfig.contractName);
  const newNFTCasesContract = await upgrades.prepareUpgrade(NFTCasesConfig.proxyContractAddress, NewNFTCasesContract) as string;

  console.log('New NFT Cases Contract deployed to:', newNFTCasesContract);
  console.log('Verification for NFT Cases contract...');
  await verify(newNFTCasesContract, []);
  console.log('NFT Cases contract is verified');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

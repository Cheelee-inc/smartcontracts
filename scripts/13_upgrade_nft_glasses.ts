import { ethers, upgrades } from 'hardhat';
import {NFTGlassesConfig} from "../config/ContractsConfig";
import {NFTContractType} from "../lib/ContractProvider";

async function main() {
  console.log('Upgrade NFT Glasses contract...');

  // We get the contract to deploy
  const NewNFTGlassesContract = await ethers.getContractFactory(NFTGlassesConfig.contractName);
  const newNFTGlassesContract = await upgrades.upgradeProxy(NFTGlassesConfig.proxyContractAddress, NewNFTGlassesContract) as NFTContractType;

  console.log('NFT Glasses Contract is upgraded:', newNFTGlassesContract);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

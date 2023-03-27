import { ethers, upgrades } from 'hardhat';
import {NFTCasesConfig} from "../config/ContractsConfig";
import {NFTContractType} from "../lib/ContractProvider";

async function main() {
  console.log('Upgrade NFT Cases contract...');

  // We get the contract to deploy
  const NewNFTCasesContract = await ethers.getContractFactory(NFTCasesConfig.contractName);
  await upgrades.upgradeProxy(NFTCasesConfig.proxyContractAddress, NewNFTCasesContract) as NFTContractType;

  console.log('NFT Cases Contract is upgraded');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

import { ethers, upgrades } from 'hardhat';
import { NFTContractType } from '../lib/ContractProvider';
import { NFTGlassesConfig } from "../config/ContractsConfig";
import {verify} from "./24_verify";

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  console.log('Deploying NFT Glasses contract...');

  // We get the contract to deploy
  const NFTGlassesContract = await ethers.getContractFactory(NFTGlassesConfig.contractName);
  const nftGlassesProxy = await upgrades.deployProxy(NFTGlassesContract, [NFTGlassesConfig.nftName, NFTGlassesConfig.nftSymbol], { initializer: 'initialize' }) as NFTContractType;

  await nftGlassesProxy.deployed();

  const nftGlassesContract = await upgrades.erc1967.getImplementationAddress(nftGlassesProxy.address);
  const nftGlassesAdmin = await upgrades.erc1967.getAdminAddress(nftGlassesProxy.address);

  console.log('Contract NFT Glasses deployed to:', nftGlassesContract);
  console.log('Proxy NFT Glasses contract deployed to:', nftGlassesProxy.address);
  console.log('Admin NFT Glasses deployed to:', nftGlassesAdmin);

  console.log('Verification for NFT Glasses contract...');
  await verify(nftGlassesContract, []);
  console.log('NFT Glasses contract is verified');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

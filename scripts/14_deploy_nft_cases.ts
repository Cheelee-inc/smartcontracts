import { ethers, upgrades } from 'hardhat';
import { NFTContractType } from '../lib/ContractProvider';
import { NFTCasesConfig } from "../config/ContractsConfig";
import {verify} from "./verify";

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  console.log('Deploying NFT Cases contract...');

  // We get the contract to deploy
  const NFTCasesContract = await ethers.getContractFactory(NFTCasesConfig.contractName);
  const nftCasesProxy = await upgrades.deployProxy(NFTCasesContract, [NFTCasesConfig.nftName, NFTCasesConfig.nftSymbol], { initializer: 'initialize' }) as NFTContractType;

  await nftCasesProxy.deployed();

  const nftCasesContract = await upgrades.erc1967.getImplementationAddress(nftCasesProxy.address);
  const nftCasesdmin = await upgrades.erc1967.getAdminAddress(nftCasesProxy.address);

  console.log('Contract NFT Cases deployed to:', nftCasesContract);
  console.log('Proxy NFT Cases contract deployed to:', nftCasesProxy.address);
  console.log('Admin NFT Cases deployed to:', nftCasesdmin);

  console.log('Verification for NFT Cases contract...');
  await verify(nftCasesContract, []);
  console.log('NFT Cases contract is verified');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

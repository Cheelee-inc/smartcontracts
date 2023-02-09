import { ethers, upgrades } from "hardhat";
import {
  CHEELContractType,
  CommonBlacklistContractType,
  LEEContractType,
  NFTContractType
} from "../lib/ContractProvider";
import {
  CommonBlacklistConfig,
  LEEConfig,
  CHEELConfig,
  NFTCasesConfig,
  NFTGlassesConfig
} from "../config/ContractsConfig";

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  console.log('Deploying blacklist contract...');

  // We get the contract to deploy
  const CommonBlacklistContract = await ethers.getContractFactory(CommonBlacklistConfig.contractName);
  const commonBlacklistProxy = await upgrades.deployProxy(CommonBlacklistContract, [], { initializer: 'initialize' }) as CommonBlacklistContractType;

  await commonBlacklistProxy.deployed();

  const commonBlacklistContract = await upgrades.erc1967.getImplementationAddress(commonBlacklistProxy.address);
  const commonBlacklistAdmin = await upgrades.erc1967.getAdminAddress(commonBlacklistProxy.address);

  console.log('Contract blacklist deployed to:', commonBlacklistContract);
  console.log('Proxy blacklist contract deployed to:', commonBlacklistProxy.address);
  console.log('Admin blacklist contract deployed to:', commonBlacklistAdmin);

  console.log('Deploying LEE contract...');

  // We get the contract to deploy
  const LEEContract = await ethers.getContractFactory(LEEConfig.contractName);
  const leeProxy = await upgrades.deployProxy(LEEContract, [], { initializer: 'initialize' }) as LEEContractType;

  await leeProxy.deployed();

  const leeContract = await upgrades.erc1967.getImplementationAddress(leeProxy.address);
  const leeAdmin = await upgrades.erc1967.getAdminAddress(leeProxy.address);

  console.log('Contract LEE deployed to:', leeContract);
  console.log('Proxy LEE contract deployed to:', leeProxy.address);
  console.log('Admin LEE contract deployed to:', leeAdmin);

  console.log('Deploying CHEEL contract...');

  // We get the contract to deploy
  const CHEELContract = await ethers.getContractFactory(CHEELConfig.contractName);
  const cheelProxy = await upgrades.deployProxy(CHEELContract, [], { initializer: 'initialize' }) as CHEELContractType;

  await cheelProxy.deployed();

  const cheelContract = await upgrades.erc1967.getImplementationAddress(cheelProxy.address);
  const cheelAdmin = await upgrades.erc1967.getAdminAddress(cheelProxy.address);

  console.log('Contract CHEEL deployed to:', cheelContract);
  console.log('Proxy CHEEL contract deployed to:', cheelProxy.address);
  console.log('Admin CHEEL contract deployed to:', cheelAdmin);

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
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

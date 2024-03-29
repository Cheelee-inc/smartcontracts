import { ethers, upgrades } from 'hardhat';
import {
  CommonBlacklistContractType,
} from '../lib/ContractProvider';
import {
  CommonBlacklistConfig,
} from "../config/ContractsConfig";
import {verify} from "./19_verify";

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

  console.log('Verification for Blacklist contract...');
  await verify(commonBlacklistContract, []);
  console.log('Blacklist contract is verified');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

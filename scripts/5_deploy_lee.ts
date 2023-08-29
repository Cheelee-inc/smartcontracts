import { ethers, upgrades } from 'hardhat';
import { LEEContractType } from '../lib/ContractProvider';
import { LEEConfig } from "../config/ContractsConfig";
import {verify} from "./24_verify";

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

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

  console.log('Verification for LEE contract...');
  await verify(leeContract, []);
  console.log('LEE contract is verified');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

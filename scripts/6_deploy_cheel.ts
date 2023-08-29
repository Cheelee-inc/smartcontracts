import { ethers, upgrades } from 'hardhat';
import { CHEELContractType } from '../lib/ContractProvider';
import { CHEELConfig } from "../config/ContractsConfig";
import {verify} from "./24_verify";

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

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

  console.log('Verification for CHEEL contract...');
  await verify(cheelContract, []);
  console.log('CHEEL contract is verified');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

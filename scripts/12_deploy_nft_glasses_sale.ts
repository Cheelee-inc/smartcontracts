import { ethers } from 'hardhat';
import {NFTSaleContractType} from '../lib/ContractProvider';
import {
  NFTGlassesSaleConfig,
} from "../config/ContractsConfig";
import {verify} from "./24_verify";
import {NFTGlassesSaleArguments} from "../config/ContractArguments";

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  console.log('Deploying Glasses Sale contract...');

  // We get the contract to deploy
  const GlassesSaleContract = await ethers.getContractFactory(NFTGlassesSaleConfig.contractName);
  const glassesSaleContract = await GlassesSaleContract.deploy(...NFTGlassesSaleArguments) as NFTSaleContractType;

  await glassesSaleContract.deployed();

  console.log('Contract Glasses Sale deployed to:', glassesSaleContract.address);

  console.log('Verification for Glasses Sale contract...');
  await verify(glassesSaleContract.address, []);
  console.log('Glasses Sale contract is verified');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

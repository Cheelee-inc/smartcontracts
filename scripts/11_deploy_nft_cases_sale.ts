import { ethers } from 'hardhat';
import {NFTSaleContractType} from '../lib/ContractProvider';
import {
  NFTCasesSaleConfig,
} from "../config/ContractsConfig";
import {verify} from "./24_verify";
import {NFTCasesSaleArguments} from "../config/ContractArguments";

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  console.log('Deploying Cases Sale contract...');

  // We get the contract to deploy
  const CasesSaleContract = await ethers.getContractFactory(NFTCasesSaleConfig.contractName);
  const casesSaleContract = await CasesSaleContract.deploy(...NFTCasesSaleArguments) as NFTSaleContractType;

  await casesSaleContract.deployed();

  console.log('Contract Cases Sale deployed to:', casesSaleContract.address);

  console.log('Verification for Cases Sale contract...');
  await verify(casesSaleContract.address, NFTCasesSaleArguments);
  console.log('Cases Sale contract is verified');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

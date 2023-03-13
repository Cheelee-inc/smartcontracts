import { ethers, upgrades } from 'hardhat';
import {TreasuryContractType} from '../lib/ContractProvider';
import {CHEELConfig, LEEConfig, NFTCasesConfig, NFTGlassesConfig, TreasuryConfig} from "../config/ContractsConfig";
import {verify} from "./19_verify";

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  console.log('Deploying Treasury contract...');

  // We get the contract to deploy
  const TreasuryContract = await ethers.getContractFactory(TreasuryConfig.contractName);
  const treasuryProxy = await upgrades.deployProxy(TreasuryContract, [
    NFTCasesConfig.proxyContractAddress,
    NFTGlassesConfig.proxyContractAddress,
    '0x2ee51F0bCC1ece7B94091e5E250b08e8276256D9',
    LEEConfig.proxyContractAddress,
    CHEELConfig.proxyContractAddress,
    '0x2c3C5161dA00BDB3F8C5d961620f33e8835bf0AB'
  ], { initializer: 'initialize' }) as TreasuryContractType;

  await treasuryProxy.deployed();

  const treasuryContract = await upgrades.erc1967.getImplementationAddress(treasuryProxy.address);
  const treasuryAdmin = await upgrades.erc1967.getAdminAddress(treasuryProxy.address);

  console.log('Contract Treasury deployed to:', treasuryContract);
  console.log('Proxy Treasury contract deployed to:', treasuryProxy.address);
  console.log('Admin Treasury deployed to:', treasuryAdmin);

  console.log('Verification for Treasury contract...');
  await verify(treasuryContract, []);
  console.log('Treasury contract is verified');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

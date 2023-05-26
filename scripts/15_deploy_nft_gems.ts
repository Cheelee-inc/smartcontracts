import { ethers, upgrades } from 'hardhat';
import { NFTContractType } from '../lib/ContractProvider';
import { NFTGemsConfig } from "../config/ContractsConfig";
import {verify} from "./verify";

async function main() {
  console.log('Deploying NFT Gems contract...');

  // We get the contract to deploy
  const NFTGemsContract = await ethers.getContractFactory(NFTGemsConfig.contractName);
  const nftGemsProxy = await upgrades.deployProxy(NFTGemsContract, [NFTGemsConfig.nftName, NFTGemsConfig.nftSymbol], { initializer: 'initialize' }) as NFTContractType;

  await nftGemsProxy.deployed();

  const nftGemsContract = await upgrades.erc1967.getImplementationAddress(nftGemsProxy.address);
  const nftGemsdmin = await upgrades.erc1967.getAdminAddress(nftGemsProxy.address);

  console.log('Contract NFT Gems deployed to:', nftGemsContract);
  console.log('Proxy NFT Gems contract deployed to:', nftGemsProxy.address);
  console.log('Admin NFT Gems deployed to:', nftGemsdmin);

  console.log('Verification for NFT Gems contract...');
  await verify(nftGemsContract, []);
  console.log('NFT Gems contract is verified');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

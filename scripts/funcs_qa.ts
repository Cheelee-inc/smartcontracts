import { ethers } from "hardhat";
import {
  CHEELConfig,
  LEEConfig,
  NFTCasesConfig, NFTCasesSaleConfig, NFTGemsConfig,
  NFTGlassesConfig, NFTGlassesSaleConfig, TreasuryConfig
} from "../config/ContractsConfigQA";
import TREASURY_ABI from "../artifacts/contracts/Treasury.sol/Treasury.json";
import LEE_ABI from "../artifacts/contracts/LEE.sol/LEE.json";
import CHEEL_ABI from "../artifacts/contracts/CHEEL.sol/CHEEL.json";
import USDT_ABI from "../artifacts/contracts/test/USDT.sol/USDT.json";
import NFT_ABI from "../artifacts/contracts/NFT.sol/NFT.json";
import NFT_SALE_ABI from "../artifacts/contracts/NFTSale.sol/NFTSale.json";

const treasury = new ethers.Contract(TreasuryConfig.proxyContractAddress, TREASURY_ABI.abi, ethers.provider);
const lee = new ethers.Contract(LEEConfig.proxyContractAddress, LEE_ABI.abi, ethers.provider);
const cheel = new ethers.Contract(CHEELConfig.proxyContractAddress, CHEEL_ABI.abi, ethers.provider);
const usdt = new ethers.Contract(TreasuryConfig.usdt, USDT_ABI.abi, ethers.provider);
const cases = new ethers.Contract(NFTCasesConfig.proxyContractAddress, NFT_ABI.abi, ethers.provider);
const glasses = new ethers.Contract(NFTGlassesConfig.proxyContractAddress, NFT_ABI.abi, ethers.provider);
const gems = new ethers.Contract(NFTGemsConfig.proxyContractAddress, NFT_ABI.abi, ethers.provider);
const cases_sale = new ethers.Contract(NFTCasesSaleConfig.contractAddress, NFT_SALE_ABI.abi, ethers.provider);
const glasses_sale = new ethers.Contract(NFTGlassesSaleConfig.contractAddress, NFT_SALE_ABI.abi, ethers.provider);

const delay = (ms: number | undefined) => new Promise(res => setTimeout(res, ms));

async function main() {
  try {
    // Create a signer using a private key or an Ethereum account
    const privateKey = '223cd05ff1d1049dee8ad2b1766227c27f1883a9d28836e971687b45cbfd1ac2'; // Replace with your private key
    const wallet = new ethers.Wallet(privateKey, ethers.provider);

    const GNOSIS = '0x2ee51F0bCC1ece7B94091e5E250b08e8276256D9';
    const USER = '0x134Add751317e65B8d931492011C06632F21240E';
    const TREASURY = treasury.connect(wallet);
    const LEE = lee.connect(wallet);
    const CHEEL = cheel.connect(wallet);
    const USDT = usdt.connect(wallet);
    const CASES = cases.connect(wallet);
    const GLASSES = glasses.connect(wallet);
    const GEMS = gems.connect(wallet);
    const CASES_SALE = cases_sale.connect(wallet);
    const GLASSES_SALE = glasses_sale.connect(wallet);
    // Connect the signer to the contract instance

    const recipient = wallet.address;

    // Setting blacklist
    try {
      await LEE.setBlacklist(LEEConfig.blackList);
      console.log(await LEE.commonBlacklist());
    } catch (arr) {
      console.log('BLACKLIST for LEE contract not setted')
    }

    await delay(25000);

    try {
      await CHEEL.setBlacklist(CHEELConfig.blackList);
      console.log(await CHEEL.commonBlacklist());
    } catch (arr) {
      console.log('BLACKLIST for CHEEL contract not setted')
    }

    await delay(25000);

    try {
      await CASES.setBlacklist(NFTCasesConfig.blackList);
      console.log(await CASES.commonBlacklist());
    } catch (arr) {
      console.log('BLACKLIST for CASES contract not setted')
    }

    await delay(25000);

    try {
      await GLASSES.setBlacklist(NFTGlassesConfig.blackList);
      console.log(await GLASSES.commonBlacklist());
    } catch (arr) {
      console.log('BLACKLIST for GLASSES contract not setted')
    }

    await delay(25000);

    try {
      await GEMS.setBlacklist(NFTGemsConfig.blackList);
      console.log(await GEMS.commonBlacklist());
    } catch (arr) {
      console.log('BLACKLIST for GEMS contract not setted')
    }

    await delay(25000);

    // Setting nft sale and treasury contracts
    try {
      await CASES.setNftSaleAndTreasury(NFTCasesSaleConfig.contractAddress, TreasuryConfig.proxyContractAddress);
      console.log(await CASES.nftSale());
      console.log(await CASES.treasury());
    } catch (arr) {
      console.log('NFT SALE and Treasury for CASES contract not setted')
    }

    await delay(25000);

    try {
      await GLASSES.setNftSaleAndTreasury(NFTGlassesSaleConfig.contractAddress, TreasuryConfig.proxyContractAddress);
      console.log(await GLASSES.nftSale());
      console.log(await GLASSES.treasury());
    } catch (arr) {
      console.log('NFT SALE and Treasury for GLASSES contract not setted')
    }

    await delay(25000);

    try {
      await USDT.mint(TreasuryConfig.proxyContractAddress, '1000000000000000000000000');
      console.log(await USDT.balanceOf(TreasuryConfig.proxyContractAddress));
    } catch (arr) {
      console.log('Error with USDT minting for Treasury contract')
    }

    await delay(25000);

    try {
      await CHEEL.mint(TreasuryConfig.proxyContractAddress, '1000000000000000000000000');
      console.log(await CHEEL.balanceOf(TreasuryConfig.proxyContractAddress));
    } catch (arr) {
      console.log('Error with CHEEL minting for Treasury contract')
    }

    await delay(25000);

    try {
      await LEE.mint(TreasuryConfig.proxyContractAddress, '1000000000000000000000000');
      console.log(await LEE.balanceOf(TreasuryConfig.proxyContractAddress));
    } catch (arr) {
      console.log('Error with LEE minting for Treasury contract')
    }

    await delay(25000);

    try {
      await USDT.mint(GNOSIS, '1000000000000000000000000');
      console.log(await USDT.balanceOf(GNOSIS));
    } catch (arr) {
      console.log('Error with USDT minting for GNOSIS contract')
    }

    await delay(25000);

    try {
      await CHEEL.mint(GNOSIS, '1000000000000000000000000');
      console.log(await CHEEL.balanceOf(GNOSIS));
    } catch (arr) {
      console.log('Error with CHEEL minting for GNOSIS contract')
    }

    await delay(25000);

    try {
      await LEE.mint(GNOSIS, '1000000000000000000000000');
      console.log(await LEE.balanceOf(GNOSIS));
    } catch (arr) {
      console.log('Error with LEE minting for GNOSIS contract')
    }

    await delay(25000);

    try {
      await USDT.mint(USER, '1000000000000000000000000');
      console.log(await USDT.balanceOf(USER));
    } catch (arr) {
      console.log('Error with USDT minting for USER contract')
    }

    await delay(25000);

    try {
      await CHEEL.mint(USER, '1000000000000000000000000');
      console.log(await CHEEL.balanceOf(USER));
    } catch (arr) {
      console.log('Error with CHEEL minting for USER contract')
    }

    await delay(25000);

    try {
      await LEE.mint(USER, '1000000000000000000000000');
      console.log(await LEE.balanceOf(USER));
    } catch (arr) {
      console.log('Error with LEE minting for USER contract')
    }

    await delay(25000);

    try {
      await TREASURY.setSigner(TreasuryConfig.signer);
    } catch (arr) {
      console.log('Error with Setting signer for Treasury contract')
    }

    await delay(25000);

    try {
      await CASES_SALE.setSigner(NFTCasesSaleConfig.signer);
    } catch (arr) {
      console.log('Error with Setting signer for CASES_SALE contract')
    }

    await delay(25000);

    try {
      await GLASSES_SALE.setSigner(NFTGlassesSaleConfig.signer);
    } catch (arr) {
      console.log('Error with Setting signer for GLASSES_SALE contract')
    }

  } catch (error) {
    console.error('Error sending contract call:', error);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

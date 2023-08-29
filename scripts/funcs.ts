import { ethers } from "hardhat";
import {
  CHEELConfig,
  LEEConfig,
  NFTCasesConfig, NFTCasesSaleConfig, NFTGemsConfig,
  NFTGlassesConfig, NFTGlassesSaleConfig, TreasuryConfig
} from "../config/ContractsConfig";
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

async function main() {
  try {
    // Create a signer using a private key or an Ethereum account
    const privateKey = '223cd05ff1d1049dee8ad2b1766227c27f1883a9d28836e971687b45cbfd1ac2'; // Replace with your private key
    const wallet = new ethers.Wallet(privateKey, ethers.provider);

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
    // await LEE.setBlacklist(LEEConfig.blackList);
    // console.log(await LEE.commonBlacklist());
    // await CHEEL.setBlacklist(CHEELConfig.blackList);
    // console.log(await CHEEL.commonBlacklist());
    // await CASES.setBlacklist(NFTCasesConfig.blackList);
    // console.log(await CASES.commonBlacklist());
    // await GLASSES.setBlacklist(NFTGlassesConfig.blackList);
    // console.log(await GLASSES.commonBlacklist());
    // await GEMS.setBlacklist(NFTGemsConfig.blackList);
    // console.log(await GEMS.commonBlacklist());

    // Setting nft sale and treasury contracts
    // await CASES.setNftSaleAndTreasury(NFTCasesSaleConfig.contractAddress, TreasuryConfig.proxyContractAddress);
    // console.log(await CASES.nftSale());
    // console.log(await CASES.treasury());
    // await GLASSES.setNftSaleAndTreasury(NFTGlassesSaleConfig.contractAddress, TreasuryConfig.proxyContractAddress);
    // console.log(await GLASSES.nftSale());
    // console.log(await GLASSES.treasury());

    // await USDT.mint(TreasuryConfig.proxyContractAddress, '1000000000000000000000000');
    // console.log(await USDT.balanceOf(TreasuryConfig.proxyContractAddress));

    // await CHEEL.mint(TreasuryConfig.proxyContractAddress, '1000000000000000000000000');
    // console.log(await CHEEL.balanceOf(TreasuryConfig.proxyContractAddress));

    // await LEE.mint(TreasuryConfig.proxyContractAddress, '1000000000000000000000000');
    // console.log(await LEE.balanceOf(TreasuryConfig.proxyContractAddress));

    // await USDT.mint('0x2ee51F0bCC1ece7B94091e5E250b08e8276256D9', '1000000000000000000000000');
    // console.log(await USDT.balanceOf('0x2ee51F0bCC1ece7B94091e5E250b08e8276256D9'));

    // await CHEEL.mint('0x2ee51F0bCC1ece7B94091e5E250b08e8276256D9', '1000000000000000000000000');
    // console.log(await CHEEL.balanceOf('0x2ee51F0bCC1ece7B94091e5E250b08e8276256D9'));

    // await LEE.mint('0x2ee51F0bCC1ece7B94091e5E250b08e8276256D9', '1000000000000000000000000');
    // console.log(await LEE.balanceOf('0x2ee51F0bCC1ece7B94091e5E250b08e8276256D9'));

    // await USDT.mint('0x134Add751317e65B8d931492011C06632F21240E', '1000000000000000000000000');
    // console.log(await USDT.balanceOf('0x134Add751317e65B8d931492011C06632F21240E'));
    //
    // await CHEEL.mint('0x134Add751317e65B8d931492011C06632F21240E', '1000000000000000000000000');
    // console.log(await CHEEL.balanceOf('0x134Add751317e65B8d931492011C06632F21240E'));
    //
    // await LEE.mint('0x134Add751317e65B8d931492011C06632F21240E', '1000000000000000000000000');
    // console.log(await LEE.balanceOf('0x134Add751317e65B8d931492011C06632F21240E'));

    // await TREASURY.setSigner(TreasuryConfig.signer);
    // console.log(await TREASURY.signer());

    // await CASES_SALE.setSigner(NFTCasesSaleConfig.signer);
    // console.log(await CASES_SALE.signer());

    await GLASSES_SALE.setSigner(NFTGlassesSaleConfig.signer);
    // console.log(await GLASSES_SALE.signer());
  } catch (error) {
    console.error('Error sending contract call:', error);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

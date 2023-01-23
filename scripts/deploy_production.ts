import * as fs from 'fs';

import hre, { ethers, upgrades } from "hardhat";

import { deployLEE, deployCHEEL, deployNFT, deployTreasury } from "../utils/deployContracts";

async function main() {
  const signer = "0x0000000000000000000000000000000000000000";
  const usdt = "0x55d398326f99059ff775485246999027b3197955";

  const lee = await deployLEE()
  console.log("lee ", lee.address);
  await upgrades.admin.transferProxyAdminOwnership(await lee.GNOSIS());
  fs.renameSync(".openzeppelin/unknown-56.json", ".openzeppelin/unknown-56_lee.json")

  const cheel = await deployCHEEL()
  console.log("cheel ", cheel.address);
  await upgrades.admin.transferProxyAdminOwnership(await cheel.GNOSIS());
  fs.renameSync(".openzeppelin/unknown-56.json", ".openzeppelin/unknown-56_cheel.json")

  const cases = await deployNFT("CHEELEE NFT Cases", "CNFTC");
  console.log("cases ", cases.address);
  await upgrades.admin.transferProxyAdminOwnership(await cases.GNOSIS());
  fs.renameSync(".openzeppelin/unknown-56.json", ".openzeppelin/unknown-56_cases.json")

  const glasses = await deployNFT("CHEELEE NFT Glasses", "CNFTG");
  console.log("glasses ", glasses.address);
  await upgrades.admin.transferProxyAdminOwnership(await glasses.GNOSIS());
  fs.renameSync(".openzeppelin/unknown-56.json", ".openzeppelin/unknown-56_glasses.json")

  const treasury = await deployTreasury(cases, glasses, signer, lee, cheel, usdt);
  console.log("Treasury ", treasury.address);
  await upgrades.admin.transferProxyAdminOwnership(await treasury.GNOSIS());
  fs.renameSync(".openzeppelin/unknown-56.json", ".openzeppelin/unknown-56_treasury.json")

  await verify(lee.address, [])
  await verify(cheel.address, [])
  await verify(cases.address, [])
  await verify(glasses.address, [])
  await verify(treasury.address, [])
}

async function verify(address: string, args: any) {
  return hre.run("verify:verify", {address: address, constructorArguments: args,});
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

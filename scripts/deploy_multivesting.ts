import { ethers, upgrades } from "hardhat";
import { verify } from "./19_verify";

async function main() {
    const MV = await ethers.getContractFactory("MultiVesting");
    const mv = await MV.deploy("0xeE395644EeA4b8e6A3A4e17A3616A5F1B0Bc4634", true, false, 1800, 3600);
    await mv.deployed();
    console.log("MV", mv.address);

    await verify(mv.address, ["0xeE395644EeA4b8e6A3A4e17A3616A5F1B0Bc4634", true, false, 1800, 3600])
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
  
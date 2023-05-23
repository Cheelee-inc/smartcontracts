import { ethers, upgrades } from "hardhat";
import { verify } from "./19_verify";

async function main() {
    let token = ""
    const MV = await ethers.getContractFactory("MultiVesting");
    const mv = await MV.deploy(token, true, false, 900, 1800);
    await mv.deployed();
    console.log("Multivesting", mv.address);

    await verify(mv.address, [token, true, false, 900, 1800])
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
  
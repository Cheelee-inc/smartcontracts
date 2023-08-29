import { ethers } from "hardhat";
import { verify } from "./24_verify";

const CHEEL_TOKEN = "0x1F1C90aEb2fd13EA972F0a71e35c0753848e3DB0"
const UPDATE_BENEFICIARY_MIN_SECONDS = 900;
const UPDATE_BENEFICIARY_MAX_SECONDS = 1800;
const UPDATE_BENEFICIARY_ALLOWED = true;
const EMERGENCY_WITHDRAWAL_ALLOWED = false;


async function main() {
    const MV = await ethers.getContractFactory("MultiVesting");
    const multiVesting = await MV.deploy(CHEEL_TOKEN, UPDATE_BENEFICIARY_ALLOWED,
        EMERGENCY_WITHDRAWAL_ALLOWED, UPDATE_BENEFICIARY_MIN_SECONDS, UPDATE_BENEFICIARY_MAX_SECONDS);
    await multiVesting.deployed();
    console.log("MultiVesting address:", multiVesting.address);

    await verify(multiVesting.address, [CHEEL_TOKEN, UPDATE_BENEFICIARY_ALLOWED,
        EMERGENCY_WITHDRAWAL_ALLOWED, UPDATE_BENEFICIARY_MIN_SECONDS, UPDATE_BENEFICIARY_MAX_SECONDS]);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });

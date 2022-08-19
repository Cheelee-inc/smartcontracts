import { ethers } from "hardhat";

export async function currentTimestamp() {
    const blockNumBefore = await ethers.provider.getBlockNumber();
    const blockBefore = await ethers.provider.getBlock(blockNumBefore);
    return blockBefore.timestamp;
}

export async function increaseTimeDays(days: any) {
    return increaseTime(days * 24 * 60 * 60)
}
  
export async function increaseTime(seconds: any) {
    await ethers.provider.send("evm_increaseTime", [seconds])
    await ethers.provider.send("evm_mine", [])
}
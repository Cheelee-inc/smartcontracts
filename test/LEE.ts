import { expect } from "chai";
import { Signer, BigNumber } from "ethers";
import { ethers } from "hardhat";
import { LEE } from "../typechain";
import { deployLEE } from "../utils/deployContracts"
import { currentTimestamp } from "../utils/helpers"

describe("Test", function () {
  let lee: LEE
  let owner: Signer
  let user: Signer
  let timestamp: number

  let maxValue = BigNumber.from("7000000000000000000000000000")

  beforeEach(async ()=>{
    [owner, user] = await ethers.getSigners()
    timestamp = await currentTimestamp() + 10
    lee = await deployLEE(timestamp);
    await ethers.provider.send("evm_setNextBlockTimestamp", [timestamp])
    await ethers.provider.send("evm_mine", []) 
  })

  it("Test max supply", async()=>{   
    // expect(await lee.currentSupply(timestamp-1)).to.be.equal("0")
    expect(await lee.currentSupply(timestamp)).to.be.equal("0")
    expect(await lee.currentSupply(timestamp+=1)).to.be.equal("675154320987654320987")
    expect(await lee.currentSupply(timestamp+=1)).to.be.equal("1350308641975308641975")
    expect(await lee.currentSupply(timestamp+=1)).to.be.equal("2025462962962962962962")
    expect(await lee.canMint(timestamp)).to.be.equal("2025462962962962962962")

    expect(await lee.currentSupply(timestamp += 30 * 24 * 60 * 60 - 3)).to.be.equal("1750000000000000000000000000")
    expect(await lee.canMint(timestamp)).to.be.equal("1750000000000000000000000000")
    expect(await lee.currentSupply(timestamp += 31 * 24 * 60 * 60)).to.be.equal("3150000000000000000000000000")
    expect(await lee.canMint(timestamp)).to.be.equal("3150000000000000000000000000")
    expect(await lee.currentSupply(timestamp += 30 * 24 * 60 * 60)).to.be.equal("4550000000000000000000000000")
    expect(await lee.currentSupply(timestamp += 60 * 24 * 60 * 60) < maxValue).to.be.equal(true)

    let num = await lee.currentSupply(timestamp += 1 * 24 * 60 * 60)
    expect(num.toString() == maxValue.toString())
  
    num = await lee.currentSupply(timestamp += 1 * 24 * 60 * 60)
    expect(num.toString() == maxValue.toString())

    num = await lee.currentSupply(timestamp += 1000 * 24 * 60 * 60)
    expect(num.toString() == maxValue.toString())

    await ethers.provider.send("evm_setNextBlockTimestamp", [timestamp])
    await ethers.provider.send("evm_mine", []) 

    expect(await lee.canMint(timestamp)).to.be.equal(maxValue.toString())
    expect(await lee.canMint(timestamp += 30 * 24 * 60 * 60)).to.be.equal(maxValue.toString())
    await lee.mint("0x2ee51F0bCC1ece7B94091e5E250b08e8276256D9", maxValue)
    expect(await lee.canMint(timestamp)).to.be.equal("0")
  })

});

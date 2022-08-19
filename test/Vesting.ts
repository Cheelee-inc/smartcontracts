import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BigNumber, Signer } from "ethers";
import { ethers } from "hardhat";
import { exit } from "process";
import { CHEEL, Staking, Vesting } from "../typechain";
import { deployCHEEL, deployVesting } from "../utils/deployContracts"
import { currentTimestamp, increaseTime } from "../utils/helpers"

describe("Test", function () {
  let cheel: CHEEL
  let vesting: Vesting
  let owner: SignerWithAddress
  let receiver: SignerWithAddress

  before(async()=>{
    [owner, receiver] = await ethers.getSigners()
    cheel = await deployCHEEL()
    vesting = await deployVesting(receiver.address, await currentTimestamp(), 1000, 100, cheel.address)
    await cheel.mint(vesting.address, 1000)
  })

  it("Cliff works", async() => {
    await increaseTime(50)
    expect((await vesting.releasable(await currentTimestamp()))[0]).to.be.equal(0)
    expect((await vesting.releasable(await currentTimestamp()))[1]).to.be.equal(53)
    await increaseTime(50)
    expect((await vesting.releasable(await currentTimestamp()))[0]).to.be.equal(103)
    expect((await vesting.releasable(await currentTimestamp()))[1]).to.be.equal(103)

  })

  it("Releasable And VestedAmount works works", async() => {
    
    expect((await vesting.vestedAmount(await currentTimestamp()))[0]).to.be.equal(103)
    expect((await vesting.vestedAmount(await currentTimestamp()))[1]).to.be.equal(1000)

    await vesting.release()
    expect((await vesting.releasable(await currentTimestamp()))[0]).to.be.equal(0)
    expect((await vesting.releasable(await currentTimestamp()))[1]).to.be.equal(104)

    expect((await vesting.vestedAmount(await currentTimestamp()))[0]).to.be.equal(104)
    expect((await vesting.vestedAmount(await currentTimestamp()))[1]).to.be.equal(1000)
    expect(await cheel.balanceOf(await receiver.getAddress())).to.be.equal(104)

    await increaseTime(899)
    expect((await vesting.releasable(await currentTimestamp()))[0]).to.be.equal(896)
    expect((await vesting.releasable(await currentTimestamp()))[1]).to.be.equal(1000)
    
    await increaseTime(1000)
    expect((await vesting.releasable(await currentTimestamp()))[0]).to.be.equal(896)
    expect((await vesting.releasable(await currentTimestamp()))[1]).to.be.equal(1000)    

    await vesting.release()
    expect((await vesting.releasable(await currentTimestamp()))[0]).to.be.equal(0)
    expect((await vesting.releasable(await currentTimestamp()))[1]).to.be.equal(1000)    
    expect((await vesting.vestedAmount(await currentTimestamp()))[0]).to.be.equal(1000)
    expect((await vesting.vestedAmount(await currentTimestamp()))[1]).to.be.equal(1000)

  })

})
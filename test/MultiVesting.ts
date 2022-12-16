import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BigNumber, Signer } from "ethers";
import { ethers } from "hardhat";
import { exit } from "process";
import { CHEEL, Staking, MultiVesting } from "../typechain";
import { deployCHEEL, deployMultiVesting, deployVesting } from "../utils/deployContracts"
import { currentTimestamp, increaseTime } from "../utils/helpers"

describe("MultiVesting", function () {
  let cheel: CHEEL
  let vesting: MultiVesting
  let owner: SignerWithAddress
  let receiver: SignerWithAddress
  let receiver2: SignerWithAddress
  let receiver3: SignerWithAddress
  let gnosisCheel: SignerWithAddress
  let gnosisMV: SignerWithAddress

  before(async()=>{
    [owner, receiver, receiver2, receiver3] = await ethers.getSigners()

    cheel = await deployCHEEL()
    vesting = await deployMultiVesting(cheel.address, true, true)

    gnosisMV = await ethers.getImpersonatedSigner(await vesting.GNOSIS())
    await owner.sendTransaction({to: gnosisMV.address,value: ethers.utils.parseEther("0.3")})
    gnosisCheel = await ethers.getImpersonatedSigner(await cheel.GNOSIS())
    await owner.sendTransaction({to: gnosisCheel.address,value: ethers.utils.parseEther("0.3")})
    
    await vesting.connect(gnosisMV).setSeller(await owner.getAddress())
    await expect(vesting.vest(await owner.getAddress(), await currentTimestamp()-1, 1000, 1000, 100)).to.be.revertedWith("Not enough tokens")
    await cheel.connect(gnosisCheel).mint(vesting.address, 1000)
    await vesting.vest(await owner.getAddress(), await currentTimestamp()-1, 1000, 1000, 100)
  })

  it("Cliff works", async() => {
    await increaseTime(50)
    expect((await vesting.releasable(await owner.getAddress(), await currentTimestamp()))[0]).to.be.equal(0)
    expect((await vesting.releasable(await owner.getAddress(), await currentTimestamp()))[1]).to.be.equal(52)
    await increaseTime(50)
    expect((await vesting.releasable(await owner.getAddress(), await currentTimestamp()))[0]).to.be.equal(102)
    expect((await vesting.releasable(await owner.getAddress(), await currentTimestamp()))[1]).to.be.equal(102)
  })

  it("Releasable And VestedAmount works works", async() => {
    
    expect((await vesting.vestedAmountBeneficiary(await owner.getAddress(), await currentTimestamp()))[0]).to.be.equal(102)
    expect((await vesting.vestedAmountBeneficiary(await owner.getAddress(), await currentTimestamp()))[1]).to.be.equal(1000)

    await vesting.release(await owner.getAddress())
    expect((await vesting.releasable(await owner.getAddress(), await currentTimestamp()))[0]).to.be.equal(0)
    expect((await vesting.releasable(await owner.getAddress(), await currentTimestamp()))[1]).to.be.equal(103)

    expect((await vesting.vestedAmountBeneficiary(await owner.getAddress(), await currentTimestamp()))[0]).to.be.equal(103)
    expect((await vesting.vestedAmountBeneficiary(await owner.getAddress(), await currentTimestamp()))[1]).to.be.equal(1000)
    expect(await cheel.balanceOf(await owner.getAddress())).to.be.equal(103)

    await increaseTime(899)
    expect((await vesting.releasable(await owner.getAddress(), await currentTimestamp()))[0]).to.be.equal(897)
    expect((await vesting.releasable(await owner.getAddress(), await currentTimestamp()))[1]).to.be.equal(1000)
    
    await increaseTime(1000)
    expect((await vesting.releasable(await owner.getAddress(), await currentTimestamp()))[0]).to.be.equal(897)
    expect((await vesting.releasable(await owner.getAddress(), await currentTimestamp()))[1]).to.be.equal(1000)    

    await vesting.release(await owner.getAddress())
    expect((await vesting.releasable(await owner.getAddress(), await currentTimestamp()))[0]).to.be.equal(0)
    expect((await vesting.releasable(await owner.getAddress(), await currentTimestamp()))[1]).to.be.equal(1000)    
    expect((await vesting.vestedAmountBeneficiary(await owner.getAddress(), await currentTimestamp()))[0]).to.be.equal(1000)
    expect((await vesting.vestedAmountBeneficiary(await owner.getAddress(), await currentTimestamp()))[1]).to.be.equal(1000)
    expect((await vesting.vestedAmountBeneficiary(await receiver.getAddress(), await currentTimestamp()))[0]).to.be.equal(0)
    expect((await vesting.vestedAmountBeneficiary(await receiver.getAddress(), await currentTimestamp()))[1]).to.be.equal(0)
  })

  it("Blocking works", async()=>{
    let amount = 1000

    await cheel.connect(gnosisCheel).mint(vesting.address, amount)
    await vesting.vest(await vesting.address, await currentTimestamp()-1, 1000, 1000, 100)

    let fakeToken = await deployCHEEL()
    await fakeToken.connect(gnosisCheel).mint(vesting.address, 1000)
    expect(await fakeToken.balanceOf(gnosisMV.address)).to.be.equal(0)
    expect(await fakeToken.balanceOf(vesting.address)).to.be.equal(1000)
    expect(await vesting.sumVesting()).to.be.not.equal(0)
    await vesting.connect(gnosisMV).emergencyVest(fakeToken.address)
    expect(await vesting.sumVesting()).to.be.not.equal(0)
    expect(await fakeToken.balanceOf(gnosisMV.address)).to.be.equal(1000)
    expect(await fakeToken.balanceOf(vesting.address)).to.be.equal(0)

    expect(await cheel.balanceOf(vesting.address)).to.be.equal(amount)
    expect(await vesting.connect(gnosisMV).emergencyVest(cheel.address)).to.be.ok
    expect(await cheel.balanceOf(vesting.address)).to.be.equal(0)

    await vesting.connect(gnosisMV).disableEarlyWithdraw()
    await expect(vesting.connect(gnosisMV).emergencyVest(cheel.address)).to.be.revertedWith("Option not allowed")
  })

  it("change beneficiary works", async() => {
    console.log(await cheel.balanceOf(vesting.address), await vesting.sumVesting());
    await cheel.connect(gnosisCheel).mint(vesting.address, 2000)
    console.log(await cheel.balanceOf(vesting.address), await vesting.sumVesting());
    await vesting.vest(await receiver2.getAddress(), await currentTimestamp(), 1, 1000, 1)
    expect((await vesting.releasable(await receiver2.getAddress(), await currentTimestamp()))[1]).to.be.equal(1000)    
    
    await vesting.connect(receiver2).updateBeneficiary(receiver2.address, receiver3.address)
    await expect(vesting.connect(receiver3).finishUpdateBeneficiary(receiver2.address)).to.be.revertedWith("Required time hasn't passed")
    await expect(vesting.connect(receiver3).finishUpdateBeneficiary(receiver3.address)).to.be.revertedWith("Not a beneficiary")
    await increaseTime(100)
    await expect(vesting.connect(receiver3).finishUpdateBeneficiary(receiver3.address)).to.be.revertedWith("Not a beneficiary")
    await vesting.connect(receiver3).finishUpdateBeneficiary(receiver2.address)

    await expect(vesting.connect(receiver2).updateBeneficiary(receiver3.address, receiver2.address)).to.be.revertedWith("Not allowed to change")
    await vesting.connect(receiver3).updateBeneficiary(receiver3.address, receiver2.address)
    await expect(vesting.connect(receiver2).updateBeneficiary(receiver3.address, receiver2.address)).to.be.revertedWith("Not allowed to change")
    await increaseTime(201)
    await expect(vesting.connect(receiver2).finishUpdateBeneficiary(receiver3.address)).to.be.revertedWith("Time passed, request new update")

    expect((await vesting.releasable(await receiver2.getAddress(), await currentTimestamp()))[1]).to.be.equal(0)    
    expect((await vesting.releasable(await receiver3.getAddress(), await currentTimestamp()))[1]).to.be.equal(1000)    
  })
})
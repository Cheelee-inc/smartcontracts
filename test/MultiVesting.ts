import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { MultiVesting } from "../typechain";
import {deployCHEEL, deployMultiVesting} from "../utils/deployContracts"
import { currentTimestamp, increaseTime } from "../utils/helpers"
import {Contract} from "ethers";


describe("MultiVesting", function () {
  let commonBlacklist: Contract;
  let cheel: Contract
  let vesting: MultiVesting
  let owner: SignerWithAddress
  let receiver: SignerWithAddress
  let receiver2: SignerWithAddress
  let receiver3: SignerWithAddress
  let receiver4: SignerWithAddress
  let gnosisCheel: SignerWithAddress
  let gnosisMV: SignerWithAddress
  let amount = 1000
  let day = 60 * 60 * 24
  let getDay = (num: number) => {return num * day}

  before(async() => {
    [owner, receiver, receiver2, receiver3, receiver4] = await ethers.getSigners()

    cheel = await deployCHEEL()
    vesting = await deployMultiVesting(cheel.address, true, true)

    gnosisMV = await ethers.getImpersonatedSigner(await vesting.GNOSIS())
    gnosisCheel = await ethers.getImpersonatedSigner(await cheel.GNOSIS())

    await owner.sendTransaction({to: gnosisMV.address,value: ethers.utils.parseEther("0.3")})
    await owner.sendTransaction({to: gnosisCheel.address,value: ethers.utils.parseEther("0.3")})    
  })

  beforeEach(async()=>{
    cheel = await deployCHEEL()
    vesting = await deployMultiVesting(cheel.address, true, true)

    await vesting.connect(gnosisMV).setSeller(await owner.getAddress())
  })

  it("Vest and sumVesting work", async() => {
    expect(await vesting.sumVesting()).to.be.equal(0)
    await expect(vesting.vest(await owner.getAddress(), await currentTimestamp()-1, 1000, amount, 100)).to.be.revertedWith("Not enough tokens")
    expect(await vesting.sumVesting()).to.be.equal(0)
    
    await cheel.connect(gnosisCheel).mint(await vesting.address, amount)
 
    expect(await vesting.sumVesting()).to.be.equal(0)
    await vesting.vest(await owner.getAddress(), await currentTimestamp()-1, 1000, amount, 100)
    expect(await vesting.sumVesting()).to.be.equal(amount)

    await cheel.connect(gnosisCheel).mint(vesting.address, amount)
    await vesting.vest(await vesting.address, await currentTimestamp()-1, 1000, amount, 100)
    expect(await vesting.sumVesting()).to.be.equal(amount * 2)
  })

  it("Cliff works", async() => {
    await cheel.connect(gnosisCheel).mint(vesting.address, amount)
    await vesting.vest(await owner.address, await currentTimestamp()-1, 1000, amount, 100)

    await increaseTime(50)
    expect((await vesting.releasable(await owner.getAddress(), await currentTimestamp()))[0]).to.be.equal(0)
    expect((await vesting.releasable(await owner.getAddress(), await currentTimestamp()))[1]).to.be.equal(52)
    
    await increaseTime(50)
    expect((await vesting.releasable(await owner.getAddress(), await currentTimestamp()))[0]).to.be.equal(102)
    expect((await vesting.releasable(await owner.getAddress(), await currentTimestamp()))[1]).to.be.equal(102)
  })

  it("Releasable And VestedAmount works works", async() => {
    await cheel.connect(gnosisCheel).mint(vesting.address, amount)
    await vesting.vest(owner.address, await currentTimestamp()-1, 1000, amount, 100)

    await increaseTime(100)
    
    expect((await vesting.vestedAmountBeneficiary(await owner.getAddress(), await currentTimestamp()))[0]).to.be.equal(102)
    expect((await vesting.vestedAmountBeneficiary(await owner.getAddress(), await currentTimestamp()))[1]).to.be.equal(amount)

    await vesting.release(await owner.getAddress())
    expect((await vesting.releasable(await owner.getAddress(), await currentTimestamp()))[0]).to.be.equal(0)
    expect((await vesting.releasable(await owner.getAddress(), await currentTimestamp()))[1]).to.be.equal(103)

    expect((await vesting.vestedAmountBeneficiary(await owner.getAddress(), await currentTimestamp()))[0]).to.be.equal(103)
    expect((await vesting.vestedAmountBeneficiary(await owner.getAddress(), await currentTimestamp()))[1]).to.be.equal(amount)
    expect(await cheel.balanceOf(await owner.getAddress())).to.be.equal(103)

    await increaseTime(899)
    expect((await vesting.releasable(await owner.getAddress(), await currentTimestamp()))[0]).to.be.equal(897)
    expect((await vesting.releasable(await owner.getAddress(), await currentTimestamp()))[1]).to.be.equal(amount)
    
    await increaseTime(amount)
    expect((await vesting.releasable(await owner.getAddress(), await currentTimestamp()))[0]).to.be.equal(897)
    expect((await vesting.releasable(await owner.getAddress(), await currentTimestamp()))[1]).to.be.equal(amount)    

    await vesting.release(await owner.getAddress())
    expect((await vesting.releasable(await owner.getAddress(), await currentTimestamp()))[0]).to.be.equal(0)
    expect((await vesting.releasable(await owner.getAddress(), await currentTimestamp()))[1]).to.be.equal(amount)    
    expect((await vesting.vestedAmountBeneficiary(await owner.getAddress(), await currentTimestamp()))[0]).to.be.equal(amount)
    expect((await vesting.vestedAmountBeneficiary(await owner.getAddress(), await currentTimestamp()))[1]).to.be.equal(amount)
    expect((await vesting.vestedAmountBeneficiary(await receiver.getAddress(), await currentTimestamp()))[0]).to.be.equal(0)
    expect((await vesting.vestedAmountBeneficiary(await receiver.getAddress(), await currentTimestamp()))[1]).to.be.equal(0)
  })


  it("Blocking works", async()=>{
    await cheel.connect(gnosisCheel).mint(vesting.address, amount)
    await vesting.vest(await vesting.address, await currentTimestamp()-1, 1000, amount, 100)

    let fakeToken = await deployCHEEL()

    await fakeToken.connect(gnosisCheel).mint(vesting.address, amount)
    expect(await fakeToken.balanceOf(gnosisMV.address)).to.be.equal(0)
    expect(await fakeToken.balanceOf(vesting.address)).to.be.equal(amount)
    expect(await vesting.sumVesting()).to.be.not.equal(0)
    await vesting.connect(gnosisMV).emergencyVest(fakeToken.address)
    expect(await vesting.sumVesting()).to.be.not.equal(0)
    expect(await fakeToken.balanceOf(gnosisMV.address)).to.be.equal(amount)
    expect(await fakeToken.balanceOf(vesting.address)).to.be.equal(0)

    expect(await cheel.balanceOf(vesting.address)).to.be.equal(amount)
    expect(await vesting.connect(gnosisMV).emergencyVest(cheel.address)).to.be.ok
    expect(await cheel.balanceOf(vesting.address)).to.be.equal(0)

    await vesting.connect(gnosisMV).disableEarlyWithdraw()
    await expect(vesting.connect(gnosisMV).emergencyVest(cheel.address)).to.be.revertedWith("Option not allowed")
  })

  it("change beneficiary works", async() => {
    console.log(await cheel.balanceOf(vesting.address), await vesting.sumVesting());
    await cheel.connect(gnosisCheel).mint(vesting.address, amount * 2)
    await vesting.connect(owner).vest(owner.address, await currentTimestamp()-1, 1000, amount, 100)

    console.log(await cheel.balanceOf(vesting.address), await vesting.sumVesting());
    await expect(vesting.connect(receiver2).updateBeneficiary(receiver2.address, receiver4.address)).to.be.revertedWith("Not a beneficiary")
    await vesting.connect(owner).updateBeneficiary(owner.address, receiver4.address)
    await vesting.vest(await receiver2.getAddress(), await currentTimestamp(), 1, amount, 1)
    await expect(vesting.connect(receiver2).updateBeneficiary(receiver2.address, owner.address)).to.be.revertedWith("Already a beneficiary")
    expect((await vesting.releasable(await receiver2.getAddress(), await currentTimestamp()))[1]).to.be.equal(amount)

    await vesting.connect(receiver2).updateBeneficiary(receiver2.address, receiver3.address)
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
    expect((await vesting.releasable(await receiver3.getAddress(), await currentTimestamp()))[1]).to.be.equal(amount)
    await increaseTime(1000)
    await expect(vesting.connect(owner).updateBeneficiary(owner.address, receiver3.address)).to.be.revertedWith("Update pending")
    await expect(vesting.connect(owner).finishUpdateBeneficiary(owner.address)).to.be.revertedWith("Time passed, request new update")

  })

  it("vesting update and create", async()=>{
    console.log("can't update non-existing");
    await expect(vesting.vest(await receiver4.getAddress(), await currentTimestamp(), 1000, 0, 50)).to.be.revertedWith("User is not beneficiary")

    console.log("create vesting");
    await cheel.connect(gnosisCheel).mint(vesting.address, 1000)
    await vesting.vest(await receiver4.getAddress(), await currentTimestamp(), 1000, amount, 100)

    console.log("can't update vesting when balance and _amount > 0");
    await cheel.connect(gnosisCheel).mint(vesting.address, 1000)
    await expect(vesting.vest(await receiver4.getAddress(), await currentTimestamp(), 1000, amount, 50)).to.be.revertedWith("User is already a beneficiary")

    console.log("can't update vest when cliff more than older and _amount = 0");
    await expect(vesting.vest(await receiver4.getAddress(), await currentTimestamp(), 1000, 0, 150)).to.be.revertedWith("New cliff must be no later than older one")

    console.log("can update vest when cliff less than older and amount = 0");
    await vesting.vest(await receiver4.getAddress(), await currentTimestamp(), 1000, 0, 50)
  })

  it("Vesting created for passed timestamp (duration >= cliff)", async () => {
    let currentTime = await currentTimestamp()
    let oldTimestamp = currentTime - getDay(60)

    await cheel.connect(gnosisCheel).mint(vesting.address, amount)
    await vesting.vest(receiver.address, oldTimestamp, getDay(60), amount, getDay(60) + 10)

    await cheel.connect(gnosisCheel).mint(vesting.address, amount)
    await vesting.vest(receiver2.address, oldTimestamp, getDay(60), amount, getDay(60) - 10)

    expect((await vesting.releasable(await receiver.getAddress(), currentTime - 5))[0].toNumber()).to.be.equal(0)
    expect((await vesting.releasable(await receiver2.getAddress(), currentTime - 5))[0].toNumber()).to.be.greaterThanOrEqual(950)

    expect((await vesting.releasable(await receiver.getAddress(), currentTime))[1]).to.be.equal(amount)
    expect((await vesting.releasable(await receiver2.getAddress(), currentTime))[1]).to.be.equal(amount)
  })

  it.skip("Vesting created for passed timestamp (duration < cliff)", async () => {
    let currentTime = await currentTimestamp()
    let oldTimestamp = currentTime - getDay(60)

    await cheel.connect(gnosisCheel).mint(vesting.address, amount)
    await vesting.vest(receiver.address, oldTimestamp, getDay(60), amount, getDay(70))

    //should work
    expect((await vesting.releasable(await receiver.getAddress(), getDay(69)))[0].toNumber()).to.be.equal(0)
    expect((await vesting.releasable(await receiver.getAddress(), getDay(71)))[0].toNumber()).to.be.equal(amount)
  })

  it("change amount of recepient", async () => {
    let currentTime = await currentTimestamp()
    
    await cheel.connect(gnosisCheel).mint(vesting.address, amount*3)
    await vesting.connect(owner).vest(receiver.address, currentTime, getDay(3), amount, getDay(5))

    expect((await vesting.vestedAmountBeneficiary(await receiver.getAddress(), currentTime))[1].toNumber()).to.be.equal(amount)

    await vesting.connect(gnosisMV).updateBeneficiary(receiver.address, receiver2.address)
    await increaseTime(110)
    await vesting.connect(gnosisMV).finishUpdateBeneficiary(receiver.address)

    expect((await vesting.vestedAmountBeneficiary(await receiver.getAddress(), await currentTimestamp()))[1].toNumber()).to.be.equal(0)
    expect((await vesting.vestedAmountBeneficiary(await receiver2.getAddress(), await currentTimestamp()))[1].toNumber()).to.be.equal(amount)

    await vesting.connect(owner).vest(receiver.address, currentTime, getDay(3), amount*2, getDay(5) + 2)
    await vesting.connect(owner).vest(receiver2.address, currentTime, 2, 0, 2)

    expect((await vesting.vestedAmountBeneficiary(await receiver.getAddress(), await currentTimestamp()))[1].toNumber()).to.be.equal(amount*2)
    expect((await vesting.vestedAmountBeneficiary(await receiver2.getAddress(), await currentTimestamp()))[1].toNumber()).to.be.equal(amount)
    
    await increaseTime(10) 

    expect(await cheel.balanceOf(await receiver2.getAddress())).to.be.equal(0)
    await vesting.release(await receiver2.getAddress())
    expect(await cheel.balanceOf(await receiver2.getAddress())).to.be.equal(1000)
  })

  
  it("lock works", async () => {
    vesting = await deployMultiVesting(cheel.address, true, false)

    await expect(vesting.connect(gnosisMV).emergencyVest(cheel.address)).to.be.revertedWith("Option not allowed")
  })
})

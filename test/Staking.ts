import { expect } from "chai";
import { BigNumber, Signer } from "ethers";
import { ethers } from "hardhat";
import { CHEEL, Staking } from "../typechain";
import { deployCHEEL, deployStaking } from "../utils/deployContracts"
import { increaseTime, increaseTimeDays, currentTimestamp } from "../utils/helpers"


describe("Test", function () {
  let cheel: CHEEL
  let staking: Staking
  let owner: Signer
  let user: Signer

  beforeEach(async ()=>{
    [owner, user] = await ethers.getSigners()
    cheel = await deployCHEEL();
    staking = await deployStaking(cheel.address);
  })

  it("Deposit works", async() => {
    let amount = "150000000000000000000"
    await cheel.mint(await user.getAddress(), amount)
    await cheel.connect(user).approve(staking.address, amount);

    expect(await cheel.balanceOf(await user.getAddress())).to.be.equal(amount)

    await expect(staking.connect(user).deposit(1000, 0)).to.be.revertedWith("Not enough tokens")
    await staking.connect(user).deposit(amount, 0)

    let tx = await staking.status(0, await user.getAddress())

    expect(tx.balance).to.be.equal(amount)
    expect(tx.depositTimestamp).not.to.be.equal(0)
    expect(tx.alreadyCollected).to.be.equal(0)
  })

  it("Earned works", async() => {
    let amount = "150000000000000000000"
    await cheel.mint(await user.getAddress(), amount)
    await cheel.connect(user).approve(staking.address, amount);
    await staking.connect(user).deposit(amount, 0)
    await increaseTime(5 * 60 * 60 / 2)
    expect((await staking.earned(await user.getAddress(), 0))._canCollect).to.be.equal(0);
    expect((await staking.earned(await user.getAddress(), 0))._earned).not.to.be.equal(0);
    await increaseTime(3073 * 60 * 60 / 2)
    expect((await staking.earned(await user.getAddress(), 0))._canCollect).not.to.be.equal(0);
    expect((await staking.earned(await user.getAddress(), 0))._earned).not.to.be.equal(0);
  })

  it("Multiple earnings", async() => {
    let amount  =    "150000000000000000000"
    let amount2 =   "1000000000000000000000"
    let amount3 =   "4500000000000000000000"
    let amountIncorrect  =    "15000000000000000000"
    let amount2Incorrect =   "100000000000000000000"
    let amount3Incorrect =   "450000000000000000000"
    let amountSum = "5650000000000000000000"  
    await cheel.mint(await user.getAddress(), amountSum)
    await cheel.connect(user).approve(staking.address, amountSum);

    await expect(staking.connect(user).deposit(amountIncorrect, 0)).to.be.reverted
    await expect(staking.connect(user).deposit(amount2Incorrect, 1)).to.be.reverted
    await expect(staking.connect(user).deposit(amount3Incorrect, 2)).to.be.reverted

    await staking.connect(user).deposit(amount, 0)
    await staking.connect(user).deposit(amount2, 1)
    await staking.connect(user).deposit(amount3, 2)
    
    await increaseTime(5 * 60 * 60 / 2)
    
    let earned, earned2, earned3
    earned = BigNumber.from((await staking.earned(await user.getAddress(), 0))._earned).toString()
    earned2 = BigNumber.from((await staking.earned(await user.getAddress(), 1))._earned).toString()
    earned3 = BigNumber.from((await staking.earned(await user.getAddress(), 2))._earned).toString()

    expect(earned.length < earned2.length && earned2.length < earned3.length).to.be.true
  })

  it("Earning works correctly after 1 year", async() => {
    await cheel.mint(staking.address, "1000000000000000000000000")
    let amount  =    "200000000000000000000"
    await cheel.mint(await user.getAddress(), amount)
    await cheel.connect(user).approve(staking.address, amount);

    await staking.connect(user).deposit(amount, 0)

    await increaseTime(8766 * 60 * 60 / 2)

    let tx = await staking.earned(await user.getAddress(), 0)
    expect(tx._canCollect).to.be.equal("9000000000000000000");
    expect(tx._earned).to.be.equal("9000000000000000000");
  })

  it("Claim and Withdraw works", async() => {
    await cheel.mint(staking.address, "1000000000000000000000000")
    let amount  =    "150000000000000000000"
    await cheel.mint(await user.getAddress(), amount)
    await cheel.connect(user).approve(staking.address, amount);
    await staking.connect(user).deposit(amount, 0)

    await increaseTimeDays(44) //friday

    while((Math.floor(await currentTimestamp() / 86400) + 4) % 7 != 5) {
      await increaseTimeDays(1)
    }

    expect((await staking.earned(await user.getAddress(), 0))[0]).not.to.be.equal(0);
    await staking.connect(user).collect(0)
    expect((await staking.earned(await user.getAddress(), 0))[0]).to.be.equal(0);
    
    await increaseTimeDays(44) //not friday

    expect((await staking.earned(await user.getAddress(), 0))[0]).not.to.be.equal(0);
    await expect(staking.connect(user).collect(0)).to.be.revertedWith("Can collect only on Fridays")
    expect((await staking.earned(await user.getAddress(), 0))[0]).not.to.be.equal(0);

    await staking.connect(user).withdraw(0)
    expect((await staking.earned(await user.getAddress(), 0))[0]).to.be.equal("0");
    expect((await staking.earned(await user.getAddress(), 0))[1]).to.be.equal("0");

    expect(await cheel.balanceOf(await user.getAddress())).not.to.be.equal("0")
  })

  it("add works", async() => {
    let secondsPerYear = 8766 * 60 * 60
    let maxValue = "1000000000000000000000000"

    await cheel.mint(staking.address, maxValue)
    let amount  =    "100000000000000000000"
    await cheel.mint(await user.getAddress(), amount)
    await cheel.connect(user).approve(staking.address, amount);

    await expect(staking.connect(user).deposit(amount, 3)).to.be.reverted

    await staking.addOption(0, 200, 0, maxValue)
    await staking.connect(user).deposit(amount, 3)

    await increaseTime(secondsPerYear)
    console.log(await staking.earned(await user.getAddress(), 3));

    console.log(await staking.getRegisteredUsersSample(0,1,0));
    console.log(await staking.getRegisteredUsersSample(0,1,1));
    console.log(await staking.getRegisteredUsersSample(0,1,2));
    console.log(await staking.getRegisteredUsersSample(0,1,3));
    
  })
});

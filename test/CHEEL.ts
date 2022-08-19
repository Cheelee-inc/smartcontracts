import { expect } from "chai";
import { Signer, BigNumber } from "ethers";
import { ethers } from "hardhat";
import { CHEEL } from "../typechain";
import { deployCHEEL } from "../utils/deployContracts"

describe("Test", function () {
  let cheel: CHEEL
  let owner: Signer
  let user: Signer

  let maxValue = BigNumber.from("7000000000000000000000000000")

  beforeEach(async ()=>{
    [owner, user] = await ethers.getSigners()

    cheel = await deployCHEEL()
  })

  it("mint and burn works", async() => {
    expect(await cheel.balanceOf(await user.getAddress())).to.be.equal("0")
    await cheel.mint(await user.getAddress(), "1000000000000000000000000000")
    expect(await cheel.balanceOf(await user.getAddress())).to.be.equal("1000000000000000000000000000")
    await cheel.burn(await user.getAddress(), "1000000000000000000000000000")
    expect(await cheel.balanceOf(await user.getAddress())).to.be.equal("0")

    await expect(cheel.connect(user).mint(await user.getAddress(), 1000)).to.be.reverted
  })
})
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { deployLEE } from "../utils/deployContracts"

describe("CHEEL", function () {
  let lee: any
  let owner: SignerWithAddress
  let gnosis: SignerWithAddress
  let receiver: SignerWithAddress
  let badguy: SignerWithAddress

  before(async()=>{
    [owner, receiver, badguy] = await ethers.getSigners()

    lee = await deployLEE()

    gnosis = await ethers.getImpersonatedSigner(await lee.GNOSIS())
    await owner.sendTransaction({to: gnosis.address,value: ethers.utils.parseEther("1")})
  })

  it("Cheel Mint and Burn work", async() => {
    await expect(lee.connect(badguy).mint(receiver.address, 1000)).to.be.revertedWith("Ownable: caller is not the owner")
    await expect(lee.connect(owner).mint(receiver.address, 1000)).to.be.revertedWith("Ownable: caller is not the owner")
    expect(await lee.connect(gnosis).mint(receiver.address, 1000)).to.be.ok
    expect(await lee.totalSupply()).to.be.equal(1000)

    await lee.connect(receiver).transfer(gnosis.address, 1000)
    expect(await lee.connect(gnosis).burn(1000)).to.be.ok
    expect(await lee.totalSupply()).to.be.equal(0)
  })

})

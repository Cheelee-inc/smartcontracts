import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { CHEEL } from "../typechain";
import { deployCHEEL } from "../utils/deployContracts"

describe("CHEEL", function () {
  let cheel: CHEEL
  let owner = SignerWithAddress
  let gnosis = SignerWithAddress
  let receiver = SignerWithAddress
  let badguy = SignerWithAddress

  before(async()=>{
    [owner, receiver, badguy] = await ethers.getSigners()
    
    cheel = await deployCHEEL()

    gnosis = await ethers.getImpersonatedSigner(await cheel.GNOSIS())
    
    await owner.sendTransaction({to: gnosis.address,value: ethers.utils.parseEther("1")})
  })

  it("Cheel Mint and Burn work", async() => {
    await expect(cheel.connect(badguy).mint(receiver.address, 1000)).to.be.revertedWith("Ownable: caller is not the owner")
    await expect(cheel.connect(owner).mint(receiver.address, 1000)).to.be.revertedWith("Ownable: caller is not the owner")
    expect(await cheel.connect(gnosis).mint(receiver.address, 1000)).to.be.ok
    expect(await cheel.totalSupply()).to.be.equal(1000)

    await cheel.connect(receiver).transfer(gnosis.address, 1000)
    expect(await cheel.connect(gnosis).burn(1000)).to.be.ok
    expect(await cheel.totalSupply()).to.be.equal(0)
  })

})
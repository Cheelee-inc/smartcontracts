import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { MultiVesting, MultiVestingV2 } from "../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {currentTimestamp} from "../utils/helpers"

describe("MultiVesting upgradeability", function () {
  let multiVesting: MultiVesting
  let multiVestingV2: MultiVestingV2
  let owner: SignerWithAddress
  let receiver: SignerWithAddress

  beforeEach(async ()=>{
    [owner, receiver] = await ethers.getSigners()

    let MultiVesting = await ethers.getContractFactory("MultiVesting");
    let MultiVestingV2 = await ethers.getContractFactory("MultiVestingV2");

    multiVesting = await upgrades.deployProxy(MultiVesting, [await owner.getAddress(), true, true, 100, 200], {initializer: "initialize"})
    await multiVesting.deployed()
    multiVestingV2 = await upgrades.upgradeProxy(multiVesting.address, MultiVestingV2)
  })

  it("Overridden functions work", async()=>{   
    let gnosisMultiVesting = await ethers.getImpersonatedSigner(await multiVesting.GNOSIS())
    await owner.sendTransaction({to: gnosisMultiVesting.address,value: ethers.utils.parseEther("0.3")})

    await expect(multiVestingV2.connect(gnosisMultiVesting).vest(await owner.getAddress(), await currentTimestamp()-1, 1000, 1000, 100)).to.be.revertedWith("FORBIDDEN")
  })
});

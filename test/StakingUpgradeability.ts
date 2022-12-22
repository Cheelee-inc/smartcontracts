import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { Staking, StakingV2 } from "../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {currentTimestamp} from "../utils/helpers"

describe("MultiVesting upgradeability", function () {
  let staking: Staking
  let stakingv2: StakingV2
  let owner: SignerWithAddress
  let receiver: SignerWithAddress

  beforeEach(async ()=>{
    [owner, receiver] = await ethers.getSigners()

    let Staking = await ethers.getContractFactory("Staking");
    let StakingV2 = await ethers.getContractFactory("StakingV2");

    staking = await upgrades.deployProxy(Staking, [await owner.getAddress()], {initializer: "initialize"})
    await staking.deployed()
    stakingv2 = await upgrades.upgradeProxy(staking.address, StakingV2)
  })

  it("New function added works", async()=>{   
    let gnosisMultiVesting = await ethers.getImpersonatedSigner(await staking.GNOSIS())
    await owner.sendTransaction({to: gnosisMultiVesting.address,value: ethers.utils.parseEther("0.3")})

    await stakingv2.connect(gnosisMultiVesting).withdraw(111)
    expect(await stakingv2.flag()).to.be.equal(true)
  })
});

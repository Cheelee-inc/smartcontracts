import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { CHEEL, CHEELV2 } from "../typechain";
import { deployCHEEL } from "../utils/deployContracts"

describe("CHEEL upgradeability", function () {
  let cheel: CHEEL
  let cheelV2: CHEELV2
  let owner: SignerWithAddress
  let receiver: SignerWithAddress

  beforeEach(async ()=>{
    [owner, receiver] = await ethers.getSigners()

    let CHEEL = await ethers.getContractFactory("CHEEL");
    let CHEELV2 = await ethers.getContractFactory("CHEELV2");

    cheel = await upgrades.deployProxy(CHEEL, [], {initializer: "initialize"})
    cheelV2 = await upgrades.upgradeProxy(cheel.address, CHEELV2)
  })

  it("New function added works", async()=>{   
    let gnosisCheel = await ethers.getImpersonatedSigner(await cheel.GNOSIS())
    await owner.sendTransaction({to: gnosisCheel.address,value: ethers.utils.parseEther("0.3")})

    await cheelV2.connect(gnosisCheel).mint(receiver.address, 1000)
    await cheelV2.connect(gnosisCheel).setFlag();
    await expect(cheelV2.connect(gnosisCheel).mint(receiver.address, 1000)).to.be.revertedWith("FORBIDDEN")
  })
});

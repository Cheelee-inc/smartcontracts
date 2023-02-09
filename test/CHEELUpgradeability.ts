import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  expectRevert,
  // @ts-ignore
} from "@openzeppelin/test-helpers";
import {contract, ethers, upgrades} from "hardhat";
import { CHEELV2 } from "../typechain";
import {deployCHEEL} from "../utils/deployContracts"
import {CHEELConfig} from "../config/ContractsConfig";
import {parseEther} from "ethers/lib/utils";
import {Contract} from "ethers";

contract(`${CHEELConfig.contractName}V2 Upgrade`, () => {
  let cheel: Contract;
  let cheelV2: Contract;
  let gnosis: SignerWithAddress;
  let etherHolder: SignerWithAddress;
  let deployer: SignerWithAddress;
  let receiver: SignerWithAddress;

  before(async () => {
    // Deploy CHEEL
    cheel = await deployCHEEL();

    // Creating GNOSIS
    [etherHolder, deployer, receiver] = await ethers.getSigners();
    gnosis = await ethers.getImpersonatedSigner(CHEELConfig.multiSigAddress)
    await etherHolder.sendTransaction({
      to: CHEELConfig.multiSigAddress,
      value: ethers.utils.parseEther("1")
    })
  });

  it('Upgrade to version V2', async function () {
    let CHEELV2 = await ethers.getContractFactory("CHEELV2");

    cheelV2 = await upgrades.upgradeProxy(cheel.address, CHEELV2)
  });

  it("New function added works", async()=>{
    await cheelV2.connect(gnosis).mint(receiver.address, 1000);
    await cheelV2.connect(gnosis).setFlag();
    await expectRevert(
      cheelV2.connect(gnosis).mint(
        receiver.address,
        parseEther("1000")
      ),
      "FORBIDDEN"
    );
  })
});

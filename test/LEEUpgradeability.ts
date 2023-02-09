import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  expectRevert,
  // @ts-ignore
} from "@openzeppelin/test-helpers";
import {contract, ethers, upgrades} from "hardhat";
import {deployLEE} from "../utils/deployContracts"
import {Contract} from "ethers";
import {LEEConfig} from "../config/ContractsConfig";
import {parseEther} from "ethers/lib/utils";

contract(`${LEEConfig.contractName}V2 Upgrade`, () => {
  let lee: Contract;
  let leeV2: Contract;
  let gnosis: SignerWithAddress;
  let etherHolder: SignerWithAddress;
  let deployer: SignerWithAddress;
  let receiver: SignerWithAddress;

  before(async () => {
    // Deploy LEE
    lee = await deployLEE();

    // Creating GNOSIS
    [etherHolder, deployer, receiver] = await ethers.getSigners();
    gnosis = await ethers.getImpersonatedSigner(LEEConfig.multiSigAddress)
    await etherHolder.sendTransaction({
      to: LEEConfig.multiSigAddress,
      value: ethers.utils.parseEther("1")
    })
  });

  it('Upgrade to version V2', async function () {
    let LEEV2 = await ethers.getContractFactory("LEEV2");

    leeV2 = await upgrades.upgradeProxy(lee.address, LEEV2)
  });

  it("New function added works", async()=>{
    await leeV2.connect(gnosis).mint(receiver.address, 1000);
    await leeV2.connect(gnosis).setFlag();
    await expectRevert(
      leeV2.connect(gnosis).mint(
        receiver.address,
        parseEther("1000")
      ),
      "FORBIDDEN"
    );
  })
});

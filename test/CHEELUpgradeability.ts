import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  expectRevert,
  constants,
  // @ts-ignore
} from "@openzeppelin/test-helpers";
import {contract, ethers, upgrades} from "hardhat";
import {CHEELConfig, CommonBlacklistConfig} from "../config/ContractsConfig";
import {parseEther} from "ethers/lib/utils";
import {Contract} from "ethers";
import {deployCommonBlacklist} from "../utils/deployContracts";
import {assert, expect} from "chai";

contract(`OLD${CHEELConfig.contractName} Upgrade`, () => {
  let oldCheel: Contract;
  let cheel: Contract;
  let commonBlacklist: Contract;
  let gnosis: SignerWithAddress;
  let blacklistGnosis: SignerWithAddress;
  let etherHolder: SignerWithAddress;
  let deployer: SignerWithAddress;
  let receiver: SignerWithAddress;
  let badguy: SignerWithAddress;
  let moderator: SignerWithAddress;
  let BLACKLIST_OPERATOR_ROLE: string;

  before(async () => {
    // Deploy OLDCHEEL
    const OLDCHEEL = await ethers.getContractFactory("OLDCHEEL");
    oldCheel = await upgrades.deployProxy(OLDCHEEL, [], { initializer: "initialize" });
    await oldCheel.deployed();

    // Deploy Common Blacklist
    commonBlacklist = await deployCommonBlacklist();

    // Creating GNOSIS
    [etherHolder, deployer, receiver, badguy, moderator] = await ethers.getSigners();
    gnosis = await ethers.getImpersonatedSigner(CHEELConfig.multiSigAddress)
    blacklistGnosis = await ethers.getImpersonatedSigner(CommonBlacklistConfig.multiSigAddress)
    await etherHolder.sendTransaction({
      to: CHEELConfig.multiSigAddress,
      value: ethers.utils.parseEther("1")
    })
    await etherHolder.sendTransaction({
      to: CommonBlacklistConfig.multiSigAddress,
      value: ethers.utils.parseEther("1")
    })

    BLACKLIST_OPERATOR_ROLE = await commonBlacklist.BLACKLIST_OPERATOR_ROLE();
  });

  it("Mint tokens", async function () {

    await oldCheel.connect(gnosis).mint(
      deployer.address,
      parseEther("1000000")
    );

    await oldCheel.connect(gnosis).mint(
      badguy.address,
      parseEther("1000000")
    );
  });

  it('Upgrade to new CHEEL version', async function () {
    const CHEEL = await ethers.getContractFactory(CHEELConfig.contractName);

    cheel = await upgrades.upgradeProxy(oldCheel.address, CHEEL)
  });

  // Uncommit for testing working blacklist after upgrade
  // it("Grant BLACKLIST_OPERATOR_ROLE for moderator", async function () {
  //   expect((await cheel.commonBlacklist()).toUpperCase()).to.equal(commonBlacklist.address.toUpperCase());
  //
  //   await commonBlacklist.connect(blacklistGnosis).grantRole(
  //     BLACKLIST_OPERATOR_ROLE,
  //     moderator.address
  //   );
  // });
  //
  // it("Adding badguy for common blacklist", async function () {
  //   await commonBlacklist.connect(moderator).addUsersToBlacklist(
  //     [badguy.address]
  //   );
  //
  //   assert.equal(await commonBlacklist.userIsBlacklisted(badguy.address, constants.ZERO_ADDRESS, constants.ZERO_ADDRESS), true);
  // });
  //
  // it("New function added works", async function () {
  //   await expectRevert(
  //     cheel.connect(badguy).transfer(
  //       deployer.address,
  //       parseEther("1000000")
  //     ),
  //     "CHEEL: Blocked by global blacklist"
  //   );
  //
  //   await expectRevert(
  //     cheel.connect(gnosis).transferFrom(
  //       badguy.address,
  //       deployer.address,
  //       parseEther("1000000")
  //     ),
  //     "ERC20: insufficient allowance"
  //   );
  // });

  it("Balancies is correct", async function () {
    assert.equal(
      String(await cheel.balanceOf(deployer.address)),
      parseEther("1000000").toString()
    );

    assert.equal(
      String(await cheel.balanceOf(badguy.address)),
      parseEther("1000000").toString()
    );
  });
});

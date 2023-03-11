import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  expectRevert,
  constants,
  // @ts-ignore
} from "@openzeppelin/test-helpers";
import {contract, ethers, upgrades} from "hardhat";
import {LEEConfig, CommonBlacklistConfig} from "../config/ContractsConfig";
import {parseEther} from "ethers/lib/utils";
import {Contract} from "ethers";
import {deployCommonBlacklist} from "../utils/deployContracts";
import {assert, expect} from "chai";

contract(`OLD${LEEConfig.contractName} Upgrade`, () => {
  let oldLee: Contract;
  let lee: Contract;
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
    // Deploy OLDLEE
    const OLDLEE = await ethers.getContractFactory("OLDLEE");
    oldLee = await upgrades.deployProxy(OLDLEE, [], { initializer: "initialize" });
    await oldLee.deployed();

    // Deploy Common Blacklist
    commonBlacklist = await deployCommonBlacklist();

    // Creating GNOSIS
    [etherHolder, deployer, receiver, badguy, moderator] = await ethers.getSigners();
    gnosis = await ethers.getImpersonatedSigner(LEEConfig.multiSigAddress)
    blacklistGnosis = await ethers.getImpersonatedSigner(CommonBlacklistConfig.multiSigAddress)
    await etherHolder.sendTransaction({
      to: LEEConfig.multiSigAddress,
      value: ethers.utils.parseEther("1")
    })
    await etherHolder.sendTransaction({
      to: CommonBlacklistConfig.multiSigAddress,
      value: ethers.utils.parseEther("1")
    })

    BLACKLIST_OPERATOR_ROLE = await commonBlacklist.BLACKLIST_OPERATOR_ROLE();
  });

  it("Mint tokens", async function () {

    await oldLee.connect(gnosis).mint(
      deployer.address,
      parseEther("1000000")
    );

    await oldLee.connect(gnosis).mint(
      badguy.address,
      parseEther("1000000")
    );
  });

  it('Upgrade to new CHEEL version', async function () {
    const LEE = await ethers.getContractFactory(LEEConfig.contractName);

    lee = await upgrades.upgradeProxy(oldLee.address, LEE)
  });

  // Uncommit for testing working blacklist after upgrade
  // it("Grant BLACKLIST_OPERATOR_ROLE for moderator", async function () {
  //   await commonBlacklist.connect(blacklistGnosis).grantRole(
  //     BLACKLIST_OPERATOR_ROLE,
  //     moderator.address
  //   );
  // });
  //
  // it("Adding badguy for common blacklist", async function () {
  //   expect((await lee.commonBlacklist()).toUpperCase()).to.equal(commonBlacklist.address.toUpperCase());
  //
  //   await commonBlacklist.connect(moderator).addUsersToBlacklist(
  //     [badguy.address]
  //   );
  //
  //   assert.equal(await commonBlacklist.userIsBlacklisted(badguy.address, constants.ZERO_ADDRESS, constants.ZERO_ADDRESS), true);
  // });
  //
  //
  // it("New function added works", async function () {
  //   await expectRevert(
  //     lee.connect(badguy).transfer(
  //       deployer.address,
  //       parseEther("1000000")
  //     ),
  //     "LEE: Blocked by global blacklist"
  //   );
  //
  //   await expectRevert(
  //     lee.connect(gnosis).transferFrom(
  //       badguy.address,
  //       deployer.address,
  //       parseEther("1000000")
  //     ),
  //     "ERC20: insufficient allowance"
  //   );
  //
  //   assert.equal(
  //     String(await lee.balanceOf(deployer.address)),
  //     parseEther("1000000").toString()
  //   );
  //
  //   assert.equal(
  //     String(await lee.balanceOf(badguy.address)),
  //     parseEther("1000000").toString()
  //   );
  // });

  it("Balancies is correct", async function () {
    assert.equal(
      String(await lee.balanceOf(deployer.address)),
      parseEther("1000000").toString()
    );

    assert.equal(
      String(await lee.balanceOf(badguy.address)),
      parseEther("1000000").toString()
    );
  });
});

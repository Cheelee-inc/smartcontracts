import {assert, expect} from "chai";
import {
  expectEvent,
  expectRevert,
  // @ts-ignore
} from "@openzeppelin/test-helpers";
import { parseEther } from "ethers/lib/utils";
import {artifacts, contract, ethers} from "hardhat";
import {CHEELConfig, CommonBlacklistConfig} from '../config/ContractsConfig';
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";

const CHEEL = artifacts.require("./CHEEL.sol");
const CommonBlacklist = artifacts.require("./CommonBlacklist.sol");


contract(CHEELConfig.contractName, ([deployer, receiver, badguy, moderator, varybadguy]) => {
  let commonBlacklist: any;
  let cheel: any;
  let gnosis: SignerWithAddress;
  let blacklistGnosis: SignerWithAddress;
  let etherHolder: any;
  let BLACKLIST_OPERATOR_ROLE: any;
  let result: any;

  before(async () => {
    // Deploy Common Blacklist
    commonBlacklist = await CommonBlacklist.new({ from: deployer });

    // Initialize CommonBlacklist
    await commonBlacklist.initialize(
      CommonBlacklistConfig.multiSigAddress,
      { from: deployer }
    );

    // Deploy CHEEL
    cheel = await CHEEL.new({ from: deployer });

    // Initialize CHEEL
    await cheel.initialize(
      CHEELConfig.tokenName,
      CHEELConfig.tokenSymbol,
      CHEELConfig.maxAmount,
      commonBlacklist.address,
      CHEELConfig.multiSigAddress,
      { from: deployer }
    );

    // Creating GNOSIS
    [etherHolder] = await ethers.getSigners();
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
  });

  describe("Normal cases:", async () => {
    it("Check initial data", async function () {
      expect(await cheel.name()).to.equal(CHEELConfig.tokenName);
      expect(await cheel.symbol()).to.equal(CHEELConfig.tokenSymbol);
      const maxAmount = parseEther(`${CHEELConfig.maxAmount}`).toString();
      expect((await cheel.MAX_AMOUNT()).toString()).to.equal(maxAmount);
      expect((await cheel.totalSupply()).toString()).to.equal('0');
      expect((await cheel.commonBlacklist()).toUpperCase()).to.equal(commonBlacklist.address.toUpperCase());
      expect((await cheel.GNOSIS()).toUpperCase()).to.equal(CHEELConfig.multiSigAddress.toUpperCase());
      expect((await cheel.owner()).toUpperCase()).to.equal(CHEELConfig.multiSigAddress.toUpperCase());
    });

    it("Mint and approve all contracts", async function () {

      await cheel.mint(
        gnosis.address,
        parseEther("1000000"),
        { from: gnosis.address }
      );

      await cheel.mint(
        deployer,
        parseEther("1000000"),
        { from: gnosis.address }
      );

      await cheel.mint(
        receiver,
        parseEther("2000000"),
        { from: gnosis.address }
      );

      await cheel.mint(
        badguy,
        parseEther("3000000"),
        { from: gnosis.address }
      );

      await cheel.mint(
        varybadguy,
        parseEther("3000000"),
        { from: gnosis.address }
      );

      assert.equal(
        String(await cheel.totalSupply()),
        parseEther("10000000").toString()
      );

      assert.equal(
        String(await cheel.balanceOf(gnosis.address)),
        parseEther("1000000").toString()
      );

      assert.equal(
        String(await cheel.balanceOf(deployer)),
        parseEther("1000000").toString()
      );

      assert.equal(
        String(await cheel.balanceOf(receiver)),
        parseEther("2000000").toString()
      );

      assert.equal(
        String(await cheel.balanceOf(badguy)),
        parseEther("3000000").toString()
      );

      assert.equal(
        String(await cheel.balanceOf(badguy)),
        parseEther("3000000").toString()
      );

      BLACKLIST_OPERATOR_ROLE = await cheel.BLACKLIST_OPERATOR_ROLE();
    });

    it("Burn tokens", async function () {
      await cheel.burn(
        parseEther("1000000"),
        { from: gnosis.address }
      );

      assert.equal(
        String(await cheel.balanceOf(gnosis.address)),
        parseEther("0").toString()
      );

      assert.equal(
        String(await cheel.totalSupply()),
        parseEther("9000000").toString()
      );
    });

    it("Transactions", async function () {
      await cheel.transfer(
        deployer,
        parseEther("1000000"),
        { from: badguy }
      );

      assert.equal(
        String(await cheel.balanceOf(deployer)),
        parseEther("2000000").toString()
      );

      assert.equal(
        String(await cheel.balanceOf(badguy)),
        parseEther("2000000").toString()
      );
    });

    it("Delegate", async function () {
      await cheel.delegate(
        deployer,
        { from: badguy }
      );

      assert.equal(
        String(await cheel.balanceOf(deployer)),
        parseEther("2000000").toString()
      );

      assert.equal(
        String(await cheel.balanceOf(badguy)),
        parseEther("2000000").toString()
      );
    });
  });

  describe("Internal Blacklist", async () => {
    it("Grant BLACKLIST_OPERATOR_ROLE for moderator", async function () {
      result = await cheel.grantRole(
        BLACKLIST_OPERATOR_ROLE,
        moderator,
        { from: gnosis.address }
      );

      expectEvent(result, "RoleGranted", {
        role: BLACKLIST_OPERATOR_ROLE,
        account: moderator,
        sender: gnosis.address,
      });

      assert.equal(await cheel.hasRole(BLACKLIST_OPERATOR_ROLE, moderator), true);
    });

    it("Adding badguy for internal blacklist", async function () {
      await cheel.addUsersToBlacklist(
        [badguy],
        { from: moderator }
      );

      assert.equal(await cheel.userInBlacklist(badguy), true);
      assert.equal(await cheel.userInBlacklist(deployer), false);
    });

    it("Blocking transactions for users in internal blacklist", async function () {
      await expectRevert(
        cheel.transfer(
          deployer,
          parseEther("1000000"),
          { from: badguy }
        ),
        "Sender in internal blacklist"
      );

      await expectRevert(
        cheel.transferFrom(
          badguy,
          deployer,
          parseEther("1000000"),
          { from: gnosis.address }
        ),
        "ERC20: insufficient allowance"
      );

      assert.equal(
        String(await cheel.balanceOf(deployer)),
        parseEther("2000000").toString()
      );

      assert.equal(
        String(await cheel.balanceOf(badguy)),
        parseEther("2000000").toString()
      );
    });

    it("Removing badguy from internal blacklist", async function () {
      await cheel.removeUsersFromBlacklist(
        [badguy],
        { from: moderator }
      );

      assert.equal(await cheel.userInBlacklist(badguy), false);
    });

    it("UnBlocking transactions for users in internal blacklist and blocking again", async function () {
      result = await cheel.transfer(
        deployer,
        parseEther("1000000"),
        { from: badguy }
      );

      expectEvent(result, "Transfer", {
        from: badguy,
        to: deployer,
        value: parseEther("1000000").toString(),
      });

      await expectRevert(
        cheel.transferFrom(
          badguy,
          deployer,
          parseEther("1000000"),
          { from: gnosis.address }
        ),
        "ERC20: insufficient allowance"
      );

      assert.equal(
        String(await cheel.balanceOf(deployer)),
        parseEther("3000000").toString()
      );

      assert.equal(
        String(await cheel.balanceOf(badguy)),
        parseEther("1000000").toString()
      );

      await cheel.addUsersToBlacklist(
        [badguy],
        { from: moderator }
      );
    });
  });

  describe("Common Blacklist", async () => {
    it("Grant BLACKLIST_OPERATOR_ROLE for moderator", async function () {
      result = await commonBlacklist.grantRole(
        BLACKLIST_OPERATOR_ROLE,
        moderator,
        {from: blacklistGnosis.address}
      );

      expectEvent(result, "RoleGranted", {
        role: BLACKLIST_OPERATOR_ROLE,
        account: moderator,
        sender: blacklistGnosis.address,
      });

      assert.equal(await commonBlacklist.hasRole(BLACKLIST_OPERATOR_ROLE, moderator), true);
    });

    it("Adding varybadguy for common blacklist", async function () {
      await commonBlacklist.addUsersToBlacklist(
        [varybadguy],
        { from: moderator }
      );

      assert.equal(await commonBlacklist.userIsBlacklisted(badguy), false);
      assert.equal(await commonBlacklist.userIsBlacklisted(varybadguy), true);
      assert.equal(await commonBlacklist.userIsBlacklisted(deployer), false);
      assert.equal(await cheel.userInBlacklist(varybadguy), false);
    });

    it("Blocking transactions for users in common blacklist", async function () {
      await expectRevert(
        cheel.transfer(
          deployer,
          parseEther("1000000"),
          { from: varybadguy }
        ),
        "Sender in common blacklist"
      );

      await expectRevert(
        cheel.transferFrom(
          varybadguy,
          deployer,
          parseEther("1000000"),
          { from: gnosis.address }
        ),
        "ERC20: insufficient allowance"
      );

      assert.equal(
        String(await cheel.balanceOf(deployer)),
        parseEther("3000000").toString()
      );

      assert.equal(
        String(await cheel.balanceOf(varybadguy)),
        parseEther("3000000").toString()
      );
    });

    it("Removing varybadguy from common blacklist", async function () {
      await commonBlacklist.removeUsersFromBlacklist(
        [varybadguy],
        { from: moderator }
      );

      assert.equal(await commonBlacklist.userIsBlacklisted(varybadguy), false);
    });

    it("UnBlocking transactions for users in common blacklist and blocking again", async function () {
      result = await cheel.transfer(
        deployer,
        parseEther("1000000"),
        { from: varybadguy }
      );

      expectEvent(result, "Transfer", {
        from: varybadguy,
        to: deployer,
        value: parseEther("1000000").toString(),
      });

      await expectRevert(
        cheel.transferFrom(
          varybadguy,
          deployer,
          parseEther("1000000"),
          { from: gnosis.address }
        ),
        "ERC20: insufficient allowance"
      );

      assert.equal(
        String(await cheel.balanceOf(deployer)),
        parseEther("4000000").toString()
      );

      assert.equal(
        String(await cheel.balanceOf(varybadguy)),
        parseEther("2000000").toString()
      );

      await cheel.addUsersToBlacklist(
        [varybadguy],
        { from: moderator }
      );
    });
  });
  describe("Restrictions:", async () => {
    it("Mint from users", async function () {
      await expectRevert(
        cheel.mint(
          receiver,
          parseEther("1000000"),
          { from: deployer }
        ),
        "Ownable: caller is not the owner"
      );

      assert.equal(
        String(await cheel.balanceOf(deployer)),
        parseEther("4000000").toString()
      );

      assert.equal(
        String(await cheel.balanceOf(receiver)),
        parseEther("2000000").toString()
      );

      assert.equal(
        String(await cheel.totalSupply()),
        parseEther("9000000").toString()
      );
    });

    it("Burn from users", async function () {
      await expectRevert(
        cheel.burn(
          parseEther("1000000"),
          { from: deployer }
        ),
        "Ownable: caller is not the owner"
      );

      assert.equal(
        String(await cheel.balanceOf(deployer)),
        parseEther("4000000").toString()
      );

      assert.equal(
        String(await cheel.totalSupply()),
        parseEther("9000000").toString()
      );
    });

    it("Minting over max amount from owner", async function () {
      await expectRevert(
        cheel.mint(
          gnosis.address,
          parseEther("1000000001"),
          { from: gnosis.address }
        ),
        "Can't mint more than max amount"
      );

      assert.equal(
        String(await cheel.balanceOf(deployer)),
        parseEther("4000000").toString()
      );

      assert.equal(
        String(await cheel.totalSupply()),
        parseEther("9000000").toString()
      );
    });
  });
});

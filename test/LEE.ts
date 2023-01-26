import {assert, expect} from "chai";
import {
  expectRevert,
  // @ts-ignore
} from "@openzeppelin/test-helpers";
import { parseEther } from "ethers/lib/utils";
import {contract, ethers} from "hardhat";
import {LEEConfig, CommonBlacklistConfig} from '../config/ContractsConfig';
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {Contract} from "ethers";
import {deployCommonBlacklist, deployLEE} from "../utils/deployContracts";

contract(LEEConfig.contractName, () => {
  let commonBlacklist: Contract;
  let lee: Contract;
  let gnosis: SignerWithAddress;
  let blacklistGnosis: SignerWithAddress;
  let etherHolder: SignerWithAddress;
  let deployer: SignerWithAddress;
  let receiver: SignerWithAddress;
  let badguy: SignerWithAddress;
  let moderator: SignerWithAddress;
  let varybadguy: SignerWithAddress;
  let BLACKLIST_OPERATOR_ROLE: string;
  let result: any;
  let resultWaited: any;

  before(async () => {
    // Deploy Common Blacklist
    commonBlacklist = await deployCommonBlacklist();

    // Deploy LEE
    lee = await deployLEE();

    // Creating GNOSIS
    [etherHolder, deployer, receiver, badguy, moderator, varybadguy] = await ethers.getSigners();
    gnosis = await ethers.getImpersonatedSigner(LEEConfig.multiSigAddress);
    blacklistGnosis = await ethers.getImpersonatedSigner(CommonBlacklistConfig.multiSigAddress);
    await etherHolder.sendTransaction({
      to: LEEConfig.multiSigAddress,
      value: ethers.utils.parseEther("1")
    });
    await etherHolder.sendTransaction({
      to: CommonBlacklistConfig.multiSigAddress,
      value: ethers.utils.parseEther("1")
    });

    BLACKLIST_OPERATOR_ROLE = await commonBlacklist.BLACKLIST_OPERATOR_ROLE();
  });

  describe("Normal cases:", async () => {
    it("Setting Blacklist for LEE", async function () {
      await expectRevert(
        lee.connect(deployer).updateGlobalBlacklist(commonBlacklist.address),
        "Ownable: caller is not the owner"
      );

      result = await lee.connect(gnosis).updateGlobalBlacklist(commonBlacklist.address);
      resultWaited = await result.wait();

      expect(resultWaited.events[0].args.blacklist).to.equal(commonBlacklist.address);
    });

    it("Check initial data", async function () {
      expect(await lee.name()).to.equal(LEEConfig.tokenName);
      expect(await lee.symbol()).to.equal(LEEConfig.tokenSymbol);
      const maxAmount = parseEther(`${LEEConfig.maxAmount}`).toString();
      expect((await lee.MAX_AMOUNT()).toString()).to.equal(maxAmount);
      expect((await lee.totalSupply()).toString()).to.equal('0');
      expect((await lee.commonBlacklist()).toUpperCase()).to.equal(commonBlacklist.address.toUpperCase());
      expect((await lee.GNOSIS()).toUpperCase()).to.equal(LEEConfig.multiSigAddress.toUpperCase());
      expect((await lee.owner()).toUpperCase()).to.equal(LEEConfig.multiSigAddress.toUpperCase());
    });

    it("Mint and approve all contracts", async function () {

      await lee.connect(gnosis).mint(
        gnosis.address,
        parseEther("1000000")
      );

      await lee.connect(gnosis).mint(
        deployer.address,
        parseEther("1000000")
      );

      await lee.connect(gnosis).mint(
        receiver.address,
        parseEther("2000000")
      );

      await lee.connect(gnosis).mint(
        badguy.address,
        parseEther("3000000")
      );

      await lee.connect(gnosis).mint(
        varybadguy.address,
        parseEther("3000000")
      );

      assert.equal(
        String(await lee.totalSupply()),
        parseEther("10000000").toString()
      );

      assert.equal(
        String(await lee.balanceOf(gnosis.address)),
        parseEther("1000000").toString()
      );

      assert.equal(
        String(await lee.balanceOf(deployer.address)),
        parseEther("1000000").toString()
      );

      assert.equal(
        String(await lee.balanceOf(receiver.address)),
        parseEther("2000000").toString()
      );

      assert.equal(
        String(await lee.balanceOf(badguy.address)),
        parseEther("3000000").toString()
      );

      assert.equal(
        String(await lee.balanceOf(badguy.address)),
        parseEther("3000000").toString()
      );
    });

    it("Burn tokens", async function () {
      await lee.connect(gnosis).burn(
        parseEther("1000000")
      );

      assert.equal(
        String(await lee.balanceOf(gnosis.address)),
        parseEther("0").toString()
      );

      assert.equal(
        String(await lee.totalSupply()),
        parseEther("9000000").toString()
      );
    });

    it("Transactions", async function () {
      await lee.connect(badguy).transfer(
        deployer.address,
        parseEther("1000000")
      );

      assert.equal(
        String(await lee.balanceOf(deployer.address)),
        parseEther("2000000").toString()
      );

      assert.equal(
        String(await lee.balanceOf(badguy.address)),
        parseEther("2000000").toString()
      );
    });
  });

  describe("Global Blacklist", async () => {
    it("Grant BLACKLIST_OPERATOR_ROLE for moderator", async function () {
      result = await commonBlacklist.connect(blacklistGnosis).grantRole(
        BLACKLIST_OPERATOR_ROLE,
        moderator.address
      );
      resultWaited = await result.wait();

      expect(resultWaited.events[0].args.role).to.equal(BLACKLIST_OPERATOR_ROLE);
      expect(resultWaited.events[0].args.account).to.equal(moderator.address);
      assert.equal(await commonBlacklist.hasRole(BLACKLIST_OPERATOR_ROLE, moderator.address), true);
    });

    it("Adding varybadguy for common blacklist", async function () {
      await commonBlacklist.connect(moderator).addUsersToBlacklist(
        [varybadguy.address]
      );

      assert.equal(await commonBlacklist.userIsBlacklisted(badguy.address), false);
      assert.equal(await commonBlacklist.userIsBlacklisted(varybadguy.address), true);
      assert.equal(await commonBlacklist.userIsBlacklisted(deployer.address), false);
    });

    it("Blocking transactions for users in common blacklist", async function () {
      await expectRevert(
        lee.connect(varybadguy).transfer(
          deployer.address,
          parseEther("1000000")
        ),
        "LEE: Spender in global blacklist"
      );

      await expectRevert(
        lee.connect(gnosis).transferFrom(
          varybadguy.address,
          deployer.address,
          parseEther("1000000")
        ),
        "ERC20: insufficient allowance"
      );

      assert.equal(
        String(await lee.balanceOf(deployer.address)),
        parseEther("2000000").toString()
      );

      assert.equal(
        String(await lee.balanceOf(varybadguy.address)),
        parseEther("3000000").toString()
      );
    });

    it("Removing varybadguy from common blacklist", async function () {
      await commonBlacklist.connect(moderator).removeUsersFromBlacklist(
        [varybadguy.address]
      );

      assert.equal(await commonBlacklist.userIsBlacklisted(varybadguy.address), false);
    });

    it("UnBlocking transactions for users in common blacklist and blocking again", async function () {
      result = await lee.connect(varybadguy).transfer(
        deployer.address,
        parseEther("1000000")
      );
      resultWaited = await result.wait();

      expect(resultWaited.events[0].args.from).to.equal(varybadguy.address);
      expect(resultWaited.events[0].args.to).to.equal(deployer.address);
      expect(resultWaited.events[0].args.value).to.equal(parseEther("1000000").toString());

      await expectRevert(
        lee.connect(gnosis).transferFrom(
          varybadguy.address,
          deployer.address,
          parseEther("1000000")
        ),
        "ERC20: insufficient allowance"
      );

      assert.equal(
        String(await lee.balanceOf(deployer.address)),
        parseEther("3000000").toString()
      );

      assert.equal(
        String(await lee.balanceOf(varybadguy.address)),
        parseEther("2000000").toString()
      );

      await commonBlacklist.connect(moderator).addUsersToBlacklist(
        [varybadguy.address]
      );
    });
  });
  describe("Restrictions:", async () => {
    it("Mint from users", async function () {
      await expectRevert(
        lee.connect(deployer).mint(
          receiver.address,
          parseEther("1000000")
        ),
        "Ownable: caller is not the owner"
      );

      assert.equal(
        String(await lee.balanceOf(deployer.address)),
        parseEther("3000000").toString()
      );

      assert.equal(
        String(await lee.balanceOf(receiver.address)),
        parseEther("2000000").toString()
      );

      assert.equal(
        String(await lee.totalSupply()),
        parseEther("9000000").toString()
      );
    });

    it("Burn from users", async function () {
      await expectRevert(
        lee.connect(deployer).burn(
          parseEther("1000000")
        ),
        "Ownable: caller is not the owner"
      );

      assert.equal(
        String(await lee.balanceOf(deployer.address)),
        parseEther("3000000").toString()
      );

      assert.equal(
        String(await lee.totalSupply()),
        parseEther("9000000").toString()
      );
    });

    it("Minting over max amount from owner", async function () {
      await expectRevert(
        lee.connect(gnosis).mint(
          gnosis.address,
          parseEther("7000000001")
        ),
        "Can't mint more than max amount"
      );

      assert.equal(
        String(await lee.balanceOf(deployer.address)),
        parseEther("3000000").toString()
      );

      assert.equal(
        String(await lee.totalSupply()),
        parseEther("9000000").toString()
      );
    });
  });
});

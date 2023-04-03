import {assert, expect} from "chai";
import {
  expectRevert,
  constants
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
    it("Setting blacklist", async function () {
      await lee.connect(gnosis).setBlacklist(commonBlacklist.address);
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

      assert.equal(await commonBlacklist.userIsBlacklisted(badguy.address, constants.ZERO_ADDRESS, constants.ZERO_ADDRESS), false);
      assert.equal(await commonBlacklist.userIsBlacklisted(varybadguy.address, constants.ZERO_ADDRESS, constants.ZERO_ADDRESS), true);
      assert.equal(await commonBlacklist.userIsBlacklisted(deployer.address, constants.ZERO_ADDRESS, constants.ZERO_ADDRESS), false);
    });

    it("Blocking transactions for users in common blacklist", async function () {
      await expectRevert(
        lee.connect(varybadguy).transfer(
          deployer.address,
          parseEther("1000000")
        ),
        "LEE: Blocked by global blacklist"
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

      assert.equal(await commonBlacklist.userIsBlacklisted(varybadguy.address, constants.ZERO_ADDRESS, constants.ZERO_ADDRESS), false);
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

  describe("Internal Blacklist", async () => {
    it("Adding badguy for internal blacklist", async function () {
      await commonBlacklist.connect(moderator).addUsersToInternalBlacklist(
        lee.address,
        [badguy.address]
      );

      assert.equal(await commonBlacklist.userIsInternalBlacklisted(lee.address, badguy.address, constants.ZERO_ADDRESS, constants.ZERO_ADDRESS), true);
      assert.equal(await commonBlacklist.userIsInternalBlacklisted(lee.address, deployer.address, constants.ZERO_ADDRESS, constants.ZERO_ADDRESS), false);
      assert.equal(await commonBlacklist.userIsInternalBlacklisted(lee.address, varybadguy.address, constants.ZERO_ADDRESS, constants.ZERO_ADDRESS), false);
      assert.equal(await commonBlacklist.userIsBlacklisted(varybadguy.address, constants.ZERO_ADDRESS, constants.ZERO_ADDRESS), true);
    });

    it("Blocking transactions for users in internal blacklist", async function () {
      await expectRevert(
        lee.connect(badguy).transfer(
          deployer.address,
          parseEther("1000000")
        ),
        "LEE: Blocked by internal blacklist"
      );

      await expectRevert(
        lee.connect(deployer).transfer(
          badguy.address,
          parseEther("1000000")
        ),
        "LEE: Blocked by internal blacklist"
      );

      await expectRevert(
        lee.connect(badguy).transferFrom(
          badguy.address,
          deployer.address,
          parseEther("1000000")
        ),
        "ERC20: insufficient allowance"
      );

      await expectRevert(
        lee.connect(gnosis).transferFrom(
          badguy.address,
          deployer.address,
          parseEther("1000000")
        ),
        "ERC20: insufficient allowance"
      );

      assert.equal(
        String(await lee.balanceOf(deployer.address)),
        String(await lee.balanceOf(deployer.address)),
        parseEther("2000000").toString()
      );

      assert.equal(
        String(await lee.balanceOf(badguy.address)),
        String(await lee.balanceOf(badguy.address)),
        parseEther("2000000").toString()
      );
    });

    it("Removing badguy from internal blacklist", async function () {
      await commonBlacklist.connect(moderator).removeUsersFromInternalBlacklist(
        lee.address,
        [badguy.address]
      );

      assert.equal(await commonBlacklist.userIsInternalBlacklisted(lee.address, badguy.address, constants.ZERO_ADDRESS, constants.ZERO_ADDRESS), false);
    });

    it("UnBlocking transactions for users in internal blacklist and blocking again", async function () {
      result = await lee.connect(badguy).transfer(
        deployer.address,
        parseEther("1000000")
      );

      resultWaited = await result.wait();

      expect(resultWaited.events[0].args.from).to.equal(badguy.address);
      expect(resultWaited.events[0].args.to).to.equal(deployer.address);
      expect(resultWaited.events[0].args.value).to.equal(parseEther("1000000").toString());

      await expectRevert(
        lee.connect(gnosis).transferFrom(
          badguy.address,
          deployer.address,
          parseEther("1000000")
        ),
        "ERC20: insufficient allowance"
      );

      assert.equal(
        String(await lee.balanceOf(deployer.address)),
        parseEther("4000000").toString()
      );

      assert.equal(
        String(await lee.balanceOf(badguy.address)),
        parseEther("1000000").toString()
      );

      await commonBlacklist.connect(moderator).addUsersToInternalBlacklist(
        lee.address,
        [badguy.address]
      );
    });
  });

  describe("Getting information about the presence of users from the list in the blacklist", async () => {
    it("Only internal blacklisted user", async function () {
      result = await commonBlacklist.connect(moderator).usersFromListIsBlacklisted(
        lee.address,
        [deployer.address, receiver.address, badguy.address]
      );

      assert.equal(
        result.toString(),
        [badguy.address].toString()
      );
    });

    it("Internal and global blacklisted user", async function () {
      result = await commonBlacklist.connect(moderator).usersFromListIsBlacklisted(
        lee.address,
        [deployer.address, receiver.address, badguy.address, varybadguy.address]
      );

      assert.equal(
        result.toString(),
        [badguy.address, varybadguy.address].toString()
      );
    });

    it("internal user is global blacklisted", async function () {
      result = await commonBlacklist.connect(moderator).usersFromListIsBlacklisted(
        constants.ZERO_ADDRESS,
        [deployer.address, receiver.address, badguy.address, varybadguy.address]
      );

      assert.equal(
        result.toString(),
        [varybadguy.address].toString()
      );
    });
  });

  describe("Token Rate Limit", async () => {
    it("Adding Token limit", async function () {
      result = await commonBlacklist.connect(moderator).setTokenLimits(
        lee.address,
        parseEther("1000000"),
        parseEther("1500000"),
        parseEther("1000000"),
        parseEther("1500000")
      );

      resultWaited = await result.wait();

      expect(resultWaited.events[0].args.token).to.equal(lee.address);
      expect(resultWaited.events[0].args.inComeDayLimit).to.equal(parseEther("1000000").toString());
      expect(resultWaited.events[0].args.inComeMonthLimit).to.equal(parseEther("1500000").toString());
      expect(resultWaited.events[0].args.outComeDayLimit).to.equal(parseEther("1000000").toString());
      expect(resultWaited.events[0].args.outComeMonthLimit).to.equal(parseEther("1500000").toString());

      result = await commonBlacklist.connect(moderator).changeDisablingTokenLimits(
        lee.address,
        true,
        true,
        true,
        true
      );

      resultWaited = await result.wait();

      expect(resultWaited.events[0].args.token).to.equal(lee.address);
      expect(resultWaited.events[0].args.hasInComeDayLimit).to.equal(true);
      expect(resultWaited.events[0].args.hasInComeMonthLimit).to.equal(true);
      expect(resultWaited.events[0].args.hasOutComeDayLimit).to.equal(true);
      expect(resultWaited.events[0].args.hasOutComeMonthLimit).to.equal(true);

      assert.equal(
        String(await commonBlacklist.getTokenLimits(lee.address)),
        `${parseEther("1000000").toString()},${parseEther("1500000").toString()},${parseEther("1000000").toString()},${parseEther("1500000").toString()}`,
      );
    });

    it("Testing Day and Month limits", async function () {

      // First transaction
      result = await lee.connect(deployer).transfer(
        receiver.address,
        parseEther("500000")
      );

      resultWaited = await result.wait();

      expect(resultWaited.events[0].args.from).to.equal(deployer.address);
      expect(resultWaited.events[0].args.to).to.equal(receiver.address);
      expect(resultWaited.events[0].args.value).to.equal(parseEther("500000").toString());

      assert.equal(
        String(await commonBlacklist.getUserTokenTransfers(lee.address, deployer.address)),
        `0,0,${parseEther("500000").toString()},${parseEther("500000").toString()}`
      );

      // Second transaction
      result = await lee.connect(deployer).transfer(
        receiver.address,
        parseEther("500000")
      );

      resultWaited = await result.wait();

      expect(resultWaited.events[0].args.from).to.equal(deployer.address);
      expect(resultWaited.events[0].args.to).to.equal(receiver.address);
      expect(resultWaited.events[0].args.value).to.equal(parseEther("500000").toString());

      assert.equal(
        String(await commonBlacklist.getUserTokenTransfers(lee.address, deployer.address)),
        `0,0,${parseEther("1000000").toString()},${parseEther("1000000").toString()}`
      );

      await expectRevert(
        lee.connect(deployer).transfer(
          receiver.address,
          parseEther("1")
        ),
        "Spender has reached the day limit"
      );

      // Getting Remaining limit
      assert.equal(
        String(await commonBlacklist.getUserRemainingLimit(lee.address, deployer.address)),
        `${parseEther("1000000").toString()},${parseEther("1500000").toString()},0,${parseEther("500000").toString()}`
      );

      // disable day limits
      await commonBlacklist.connect(moderator).changeDisablingTokenLimits(
        lee.address,
        true,
        true,
        false,
        true
      );

      await expectRevert(
        lee.connect(deployer).transfer(
          receiver.address,
          parseEther("1")
        ),
        "Recipient has reached the day limit"
      );

      await commonBlacklist.connect(moderator).changeDisablingTokenLimits(
        lee.address,
        false,
        true,
        false,
        true
      );

      await lee.connect(deployer).transfer(
        receiver.address,
        parseEther("1")
      );

      // Compare limits
      assert.equal(
        String(await commonBlacklist.getUserTokenTransfers(lee.address, deployer.address)),
        `0,0,${parseEther("1000000").toString()},${parseEther("1000001").toString()}`
      );

      // Getting Remaining limit
      assert.equal(
        String(await commonBlacklist.getUserRemainingLimit(lee.address, deployer.address)),
        `${parseEther("1000000").toString()},${parseEther("1500000").toString()},0,${parseEther("499999").toString()}`
      );

      // enable day limits
      await commonBlacklist.connect(moderator).changeDisablingTokenLimits(
        lee.address,
        true,
        true,
        true,
        true
      );

      await expectRevert(
        lee.connect(deployer).transfer(
          receiver.address,
          parseEther("1")
        ),
        "Spender has reached the day limit"
      );

      // Next day
      await ethers.provider.send('evm_increaseTime', [24 * 60 * 60]);

      // Next Day transaction
      result = await lee.connect(deployer).transfer(
        receiver.address,
        parseEther("499999")
      );

      resultWaited = await result.wait();

      expect(resultWaited.events[0].args.from).to.equal(deployer.address);
      expect(resultWaited.events[0].args.to).to.equal(receiver.address);
      expect(resultWaited.events[0].args.value).to.equal(parseEther("499999").toString());

      assert.equal(
        String(await commonBlacklist.getUserTokenTransfers(lee.address, deployer.address)),
        `0,0,${parseEther("499999").toString()},${parseEther("1500000").toString()}`
      );

      // Getting Remaining limit
      assert.equal(
        String(await commonBlacklist.getUserRemainingLimit(lee.address, deployer.address)),
        `${parseEther("1000000").toString()},${parseEther("1500000").toString()},${parseEther("500001").toString()},0`
      );

      await expectRevert(
        lee.connect(deployer).transfer(
          receiver.address,
          parseEther("1")
        ),
        "Spender has reached the month limit"
      );

      assert.equal(
        String(await lee.balanceOf(deployer.address)),
        String(await lee.balanceOf(deployer.address)),
        parseEther("2000000").toString()
      );

      assert.equal(
        String(await lee.balanceOf(badguy.address)),
        String(await lee.balanceOf(badguy.address)),
        parseEther("2000000").toString()
      );
    });

    it("Increase limits", async function () {
      result = await commonBlacklist.connect(moderator).setTokenLimits(
        lee.address,
        parseEther("1000000"),
        parseEther("3000000"),
        parseEther("500000"),
        parseEther("3000000")
      );

      resultWaited = await result.wait();

      expect(resultWaited.events[0].args.token).to.equal(lee.address);
      expect(resultWaited.events[0].args.inComeDayLimit).to.equal(parseEther("1000000").toString());
      expect(resultWaited.events[0].args.inComeMonthLimit).to.equal(parseEther("3000000").toString());
      expect(resultWaited.events[0].args.outComeDayLimit).to.equal(parseEther("500000").toString());
      expect(resultWaited.events[0].args.outComeMonthLimit).to.equal(parseEther("3000000").toString());

      assert.equal(
        String(await commonBlacklist.getTokenLimits(lee.address)),
        `${parseEther("1000000").toString()},${parseEther("3000000").toString()},${parseEther("500000").toString()},${parseEther("3000000").toString()}`,
      );
    });

    it("Testing Day and Month limits", async function () {
      // Getting Remaining limit
      assert.equal(
        String(await commonBlacklist.getUserRemainingLimit(lee.address, deployer.address)),
        `${parseEther("1000000").toString()},${parseEther("3000000").toString()},${parseEther("1").toString()},${parseEther("1500000").toString()}`
      );

      assert.equal(
        String(await commonBlacklist.getUserRemainingLimit(lee.address, receiver.address)),
        `${parseEther("500001").toString()},${parseEther("1500000").toString()},${parseEther("500000").toString()},${parseEther("3000000").toString()}`
      );

      await expectRevert(
        lee.connect(deployer).transfer(
          receiver.address,
          parseEther("2")
        ),
        "Spender has reached the day limit"
      );

      await commonBlacklist.connect(moderator).setTokenLimits(
        lee.address,
        parseEther("500000"),
        parseEther("3000000"),
        parseEther("1000000"),
        parseEther("3000000")
      );

      // Getting Remaining limit
      assert.equal(
        String(await commonBlacklist.getUserRemainingLimit(lee.address, deployer.address)),
        `${parseEther("500000").toString()},${parseEther("3000000").toString()},${parseEther("500001").toString()},${parseEther("1500000").toString()}`
      );

      assert.equal(
        String(await commonBlacklist.getUserRemainingLimit(lee.address, receiver.address)),
        `${parseEther("1").toString()},${parseEther("1500000").toString()},${parseEther("1000000").toString()},${parseEther("3000000").toString()}`
      );

      await expectRevert(
        lee.connect(deployer).transfer(
          receiver.address,
          parseEther("2")
        ),
        "Recipient has reached the day limit"
      );

      await commonBlacklist.connect(moderator).setTokenLimits(
        lee.address,
        parseEther("1000000"),
        parseEther("3000000"),
        parseEther("1000000"),
        parseEther("3000000")
      );

      // First transaction
      result = await lee.connect(deployer).transfer(
        receiver.address,
        parseEther("500000")
      );

      resultWaited = await result.wait();

      expect(resultWaited.events[0].args.from).to.equal(deployer.address);
      expect(resultWaited.events[0].args.to).to.equal(receiver.address);
      expect(resultWaited.events[0].args.value).to.equal(parseEther("500000").toString());

      assert.equal(
        String(await commonBlacklist.getUserTokenTransfers(lee.address, deployer.address)),
        `0,0,${parseEther("999999").toString()},${parseEther("2000000").toString()}`
      );

      await expectRevert(
        lee.connect(deployer).transfer(
          receiver.address,
          parseEther("2")
        ),
        "Spender has reached the day limit"
      );

      // Next day
      await ethers.provider.send('evm_increaseTime', [24 * 60 * 60]);

      await expectRevert(
        lee.connect(deployer).transfer(
          receiver.address,
          parseEther("1500000")
        ),
        "Spender has reached the day limit"
      );

      // Next Day transaction
      result = await lee.connect(deployer).transfer(
        receiver.address,
        parseEther("1000000")
      );

      resultWaited = await result.wait();

      expect(resultWaited.events[0].args.from).to.equal(deployer.address);
      expect(resultWaited.events[0].args.to).to.equal(receiver.address);
      expect(resultWaited.events[0].args.value).to.equal(parseEther("1000000").toString());

      await expectRevert(
        lee.connect(deployer).transfer(
          receiver.address,
          parseEther("1500000")
        ),
        "Spender has reached the day limit"
      );

      assert.equal(
        String(await commonBlacklist.getUserTokenTransfers(lee.address, deployer.address)),
        `0,0,${parseEther("1000000").toString()},${parseEther("3000000").toString()}`
      );

      await expectRevert(
        lee.connect(deployer).transfer(
          receiver.address,
          parseEther("1000000")
        ),
        "Spender has reached the day limit"
      );

      // disable day limits
      await commonBlacklist.connect(moderator).changeDisablingTokenLimits(
        lee.address,
        false,
        true,
        false,
        true
      );

      // Getting Remaining limit
      // assert.equal(
      //   String(await commonBlacklist.getUserRemainingLimit(lee.address, deployer.address)),
      //   `${parseEther("1000000").toString()},${parseEther("3000000").toString()},0,0`
      // );
      //
      // assert.equal(
      //   String(await commonBlacklist.getUserRemainingLimit(lee.address, receiver.address)),
      //   `0,0,${parseEther("1000000").toString()},${parseEther("3000000").toString()}`
      // );
      //
      // await expectRevert(
      //   lee.connect(deployer).transfer(
      //     receiver.address,
      //     parseEther("1000000")
      //   ),
      //   "Spender has reached the month limit"
      // );

      await commonBlacklist.connect(moderator).changeDisablingTokenLimits(
        lee.address,
        false,
        true,
        false,
        false
      );

      await expectRevert(
        lee.connect(deployer).transfer(
          receiver.address,
          parseEther("1000000")
        ),
        "Recipient has reached the month limit"
      );

      assert.equal(
        String(await lee.balanceOf(deployer.address)),
        String(await lee.balanceOf(deployer.address)),
        parseEther("2000000").toString()
      );

      assert.equal(
        String(await lee.balanceOf(badguy.address)),
        String(await lee.balanceOf(badguy.address)),
        parseEther("2000000").toString()
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
        parseEther("1000000").toString()
      );

      assert.equal(
        String(await lee.balanceOf(receiver.address)),
        parseEther("5000000").toString()
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
        parseEther("1000000").toString()
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
        parseEther("1000000").toString()
      );

      assert.equal(
        String(await lee.totalSupply()),
        parseEther("9000000").toString()
      );
    });
  });
});

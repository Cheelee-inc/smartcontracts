import {assert, expect} from "chai";
import {
  expectRevert,
  constants,
  // @ts-ignore
} from "@openzeppelin/test-helpers";
import { parseEther } from "ethers/lib/utils";
import {contract, ethers} from "hardhat";
import {CHEELConfig, CommonBlacklistConfig} from '../config/ContractsConfig';
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {deployCHEEL, deployCommonBlacklist} from "../utils/deployContracts";
import {Contract} from "ethers";

contract(CHEELConfig.contractName, () => {
  let commonBlacklist: Contract;
  let cheel: Contract;
  let gnosis: SignerWithAddress;
  let blacklistGnosis: SignerWithAddress;
  let etherHolder: SignerWithAddress;
  let deployer: SignerWithAddress;
  let receiver: SignerWithAddress;
  let badguy: SignerWithAddress;
  let moderator: SignerWithAddress;
  let varybadguy: SignerWithAddress;
  let clearLimitsUser: SignerWithAddress;
  let exclusionContract: SignerWithAddress;
  let BLACKLIST_OPERATOR_ROLE: string;
  let result: any;
  let resultWaited: any;

  before(async () => {
    // Deploy Common Blacklist
    commonBlacklist = await deployCommonBlacklist();

    // Deploy CHEEL
    cheel = await deployCHEEL();

    // Creating GNOSIS
    [etherHolder, deployer, receiver, badguy, moderator, varybadguy, clearLimitsUser, exclusionContract] = await ethers.getSigners();
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

  describe("Normal cases:", async () => {
    it("Setting blacklist", async function () {
      await cheel.connect(gnosis).setBlacklist(commonBlacklist.address);
    });

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

      await cheel.connect(gnosis).mint(
        gnosis.address,
        parseEther("1000000")
      );

      await cheel.connect(gnosis).mint(
        deployer.address,
        parseEther("1000000")
      );

      await cheel.connect(gnosis).mint(
        receiver.address,
        parseEther("2000000")
      );

      await cheel.connect(gnosis).mint(
        badguy.address,
        parseEther("3000000")
      );

      await cheel.connect(gnosis).mint(
        varybadguy.address,
        parseEther("3000000")
      );

      await cheel.connect(gnosis).mint(
        exclusionContract.address,
        parseEther("3000000")
      );

      await cheel.connect(gnosis).mint(
        clearLimitsUser.address,
        parseEther("3000000")
      );

      assert.equal(
        String(await cheel.totalSupply()),
        parseEther("16000000").toString()
      );

      assert.equal(
        String(await cheel.balanceOf(gnosis.address)),
        parseEther("1000000").toString()
      );

      assert.equal(
        String(await cheel.balanceOf(deployer.address)),
        parseEther("1000000").toString()
      );

      assert.equal(
        String(await cheel.balanceOf(receiver.address)),
        parseEther("2000000").toString()
      );

      assert.equal(
        String(await cheel.balanceOf(badguy.address)),
        parseEther("3000000").toString()
      );

      assert.equal(
        String(await cheel.balanceOf(badguy.address)),
        parseEther("3000000").toString()
      );

      assert.equal(
        String(await cheel.balanceOf(exclusionContract.address)),
        parseEther("3000000").toString()
      );

      assert.equal(
        String(await cheel.balanceOf(clearLimitsUser.address)),
        parseEther("3000000").toString()
      );
    });

    it("Burn tokens", async function () {
      await cheel.connect(gnosis).burn(
        parseEther("1000000")
      );

      assert.equal(
        String(await cheel.balanceOf(gnosis.address)),
        parseEther("0").toString()
      );

      assert.equal(
        String(await cheel.totalSupply()),
        parseEther("15000000").toString()
      );
    });

    it("Transactions", async function () {
      await cheel.connect(badguy).transfer(
        deployer.address,
        parseEther("1000000")
      );

      assert.equal(
        String(await cheel.balanceOf(deployer.address)),
        parseEther("2000000").toString()
      );

      assert.equal(
        String(await cheel.balanceOf(badguy.address)),
        parseEther("2000000").toString()
      );
    });

    it("Delegate", async function () {
      await cheel.connect(badguy).delegate(
        deployer.address
      );

      assert.equal(
        String(await cheel.balanceOf(deployer.address)),
        parseEther("2000000").toString()
      );

      assert.equal(
        String(await cheel.balanceOf(badguy.address)),
        parseEther("2000000").toString()
      );
    });
  });

  describe("Global Blacklist", async () => {


    it("Adding varybadguy for common blacklist", async function () {
      await commonBlacklist.connect(blacklistGnosis).addUsersToBlacklist(
        [varybadguy.address]
      );

      assert.equal(await commonBlacklist.userIsBlacklisted(badguy.address, constants.ZERO_ADDRESS, constants.ZERO_ADDRESS), false);
      assert.equal(await commonBlacklist.userIsBlacklisted(varybadguy.address, constants.ZERO_ADDRESS, constants.ZERO_ADDRESS), true);
      assert.equal(await commonBlacklist.userIsBlacklisted(deployer.address, constants.ZERO_ADDRESS, constants.ZERO_ADDRESS), false);
    });

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

    it("Blocking transactions for users in common blacklist", async function () {
      await expectRevert(
        cheel.connect(varybadguy).transfer(
          deployer.address,
          parseEther("1000000")
        ),
        "CHEEL: Blocked by global blacklist"
      );

      await expectRevert(
        cheel.connect(gnosis).transferFrom(
          varybadguy.address,
          deployer.address,
          parseEther("1000000")
        ),
        "ERC20: insufficient allowance"
      );

      assert.equal(
        String(await cheel.balanceOf(deployer.address)),
        parseEther("2000000").toString()
      );

      assert.equal(
        String(await cheel.balanceOf(varybadguy.address)),
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
      result = await cheel.connect(varybadguy).transfer(
        deployer.address,
        parseEther("1000000")
      );
      resultWaited = await result.wait();

      expect(resultWaited.events[0].args.from).to.equal(varybadguy.address);
      expect(resultWaited.events[0].args.to).to.equal(deployer.address);
      expect(resultWaited.events[0].args.value).to.equal(parseEther("1000000").toString());

      await expectRevert(
        cheel.connect(gnosis).transferFrom(
          varybadguy.address,
          deployer.address,
          parseEther("1000000")
        ),
        "ERC20: insufficient allowance"
      );

      assert.equal(
        String(await cheel.balanceOf(deployer.address)),
        parseEther("3000000").toString()
      );

      assert.equal(
        String(await cheel.balanceOf(varybadguy.address)),
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
        cheel.address,
        [badguy.address]
      );

      assert.equal(await commonBlacklist.userIsInternalBlacklisted(cheel.address, badguy.address, constants.ZERO_ADDRESS, constants.ZERO_ADDRESS), true);
      assert.equal(await commonBlacklist.userIsInternalBlacklisted(cheel.address, deployer.address, constants.ZERO_ADDRESS, constants.ZERO_ADDRESS), false);
      assert.equal(await commonBlacklist.userIsInternalBlacklisted(cheel.address, varybadguy.address, constants.ZERO_ADDRESS, constants.ZERO_ADDRESS), false);
      assert.equal(await commonBlacklist.userIsBlacklisted(varybadguy.address, constants.ZERO_ADDRESS, constants.ZERO_ADDRESS), true);
    });

    it("Blocking transactions for users in internal blacklist", async function () {
      await expectRevert(
        cheel.connect(badguy).transfer(
          deployer.address,
          parseEther("1000000")
        ),
        "CHEEL: Blocked by internal blacklist"
      );

      await expectRevert(
        cheel.connect(deployer).transfer(
          badguy.address,
          parseEther("1000000")
        ),
        "CHEEL: Blocked by internal blacklist"
      );

      await expectRevert(
        cheel.connect(badguy).transferFrom(
          badguy.address,
          deployer.address,
          parseEther("1000000")
        ),
        "ERC20: insufficient allowance"
      );

      await expectRevert(
        cheel.connect(gnosis).transferFrom(
          badguy.address,
          deployer.address,
          parseEther("1000000")
        ),
        "ERC20: insufficient allowance"
      );

      assert.equal(
        String(await cheel.balanceOf(deployer.address)),
        String(await cheel.balanceOf(deployer.address)),
        parseEther("2000000").toString()
      );

      assert.equal(
        String(await cheel.balanceOf(badguy.address)),
        String(await cheel.balanceOf(badguy.address)),
        parseEther("2000000").toString()
      );
    });

    it("Removing badguy from internal blacklist", async function () {
      await commonBlacklist.connect(moderator).removeUsersFromInternalBlacklist(
        cheel.address,
        [badguy.address]
      );

      assert.equal(await commonBlacklist.userIsInternalBlacklisted(cheel.address, badguy.address, constants.ZERO_ADDRESS, constants.ZERO_ADDRESS), false);
    });

    it("UnBlocking transactions for users in internal blacklist and blocking again", async function () {
      result = await cheel.connect(badguy).transfer(
        deployer.address,
        parseEther("1000000")
      );

      resultWaited = await result.wait();

      expect(resultWaited.events[0].args.from).to.equal(badguy.address);
      expect(resultWaited.events[0].args.to).to.equal(deployer.address);
      expect(resultWaited.events[0].args.value).to.equal(parseEther("1000000").toString());

      await expectRevert(
        cheel.connect(gnosis).transferFrom(
          badguy.address,
          deployer.address,
          parseEther("1000000")
        ),
        "ERC20: insufficient allowance"
      );

      assert.equal(
        String(await cheel.balanceOf(deployer.address)),
        parseEther("4000000").toString()
      );

      assert.equal(
        String(await cheel.balanceOf(badguy.address)),
        parseEther("1000000").toString()
      );

      await commonBlacklist.connect(moderator).addUsersToInternalBlacklist(
        cheel.address,
        [badguy.address]
      );
    });
  });

  describe("Getting information about the presence of users from the list in the blacklist", async () => {
    it("Only internal blacklisted user", async function () {
      result = await commonBlacklist.connect(moderator).usersFromListIsBlacklisted(
        cheel.address,
        [deployer.address, receiver.address, badguy.address]
      );

      assert.equal(
        result.toString(),
        [badguy.address].toString()
      );
    });

    it("Internal and global blacklisted user", async function () {
      result = await commonBlacklist.connect(moderator).usersFromListIsBlacklisted(
        cheel.address,
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
        cheel.address,
        parseEther("1000000"),
        parseEther("1500000"),
        parseEther("1000000"),
        parseEther("1500000")
      );

      resultWaited = await result.wait();

      expect(resultWaited.events[0].args.token).to.equal(cheel.address);
      expect(resultWaited.events[0].args.dailyIncomeLimit).to.equal(parseEther("1000000").toString());
      expect(resultWaited.events[0].args.monthlyIncomeLimit).to.equal(parseEther("1500000").toString());
      expect(resultWaited.events[0].args.dailyOutcomeLimit).to.equal(parseEther("1000000").toString());
      expect(resultWaited.events[0].args.monthlyOutcomeLimit).to.equal(parseEther("1500000").toString());

      result = await commonBlacklist.connect(moderator).changeDisablingTokenLimits(
        cheel.address,
        true,
        true,
        true,
        true
      );

      resultWaited = await result.wait();

      expect(resultWaited.events[0].args.token).to.equal(cheel.address);
      expect(resultWaited.events[0].args.hasDailyIncomeLimit).to.equal(true);
      expect(resultWaited.events[0].args.hasMonthlyIncomeLimit).to.equal(true);
      expect(resultWaited.events[0].args.hasDailyOutcomeLimit).to.equal(true);
      expect(resultWaited.events[0].args.hasMonthlyOutcomeLimit).to.equal(true);

      assert.equal(
        String(await commonBlacklist.getTokenLimits(cheel.address)),
        `${parseEther("1000000").toString()},${parseEther("1500000").toString()},${parseEther("1000000").toString()},${parseEther("1500000").toString()}`,
      );
    });

    it("Testing Day and Month limits", async function () {

      // First transaction
      result = await cheel.connect(deployer).transfer(
        receiver.address,
        parseEther("500000")
      );

      resultWaited = await result.wait();

      expect(resultWaited.events[0].args.from).to.equal(deployer.address);
      expect(resultWaited.events[0].args.to).to.equal(receiver.address);
      expect(resultWaited.events[0].args.value).to.equal(parseEther("500000").toString());

      assert.equal(
        String(await commonBlacklist.getUserTokenTransfers(cheel.address, deployer.address)),
        `0,0,${parseEther("500000").toString()},${parseEther("500000").toString()}`
      );

      // Second transaction
      result = await cheel.connect(deployer).transfer(
        receiver.address,
        parseEther("500000")
      );

      resultWaited = await result.wait();

      expect(resultWaited.events[0].args.from).to.equal(deployer.address);
      expect(resultWaited.events[0].args.to).to.equal(receiver.address);
      expect(resultWaited.events[0].args.value).to.equal(parseEther("500000").toString());

      assert.equal(
        String(await commonBlacklist.getUserTokenTransfers(cheel.address, deployer.address)),
        `0,0,${parseEther("1000000").toString()},${parseEther("1000000").toString()}`
      );

      await expectRevert(
        cheel.connect(deployer).transfer(
          receiver.address,
          parseEther("1")
        ),
        "Spender has reached the day limit"
      );

      // Getting Current Day
      const date = new Date();
      const year = date.toISOString().slice(0, 4);
      const month = date.toISOString().slice(5, 7);
      const day = date.toISOString().slice(8, 10);

      assert.equal(
        String(await commonBlacklist.getCurrentDay()),
        `${year}${month}${day}`
      );

      // Getting Current Month
      assert.equal(
        String(await commonBlacklist.getCurrentMonth()),
        `${year}${month}`
      );

      // Getting Remaining limit
      assert.equal(
        String(await commonBlacklist.getUserRemainingLimit(cheel.address, deployer.address)),
        `${parseEther("1000000").toString()},${parseEther("1500000").toString()},0,${parseEther("500000").toString()}`
      );

      // disable day limits
      await commonBlacklist.connect(moderator).changeDisablingTokenLimits(
        cheel.address,
        true,
        true,
        false,
        true
      );

      await expectRevert(
        cheel.connect(deployer).transfer(
          receiver.address,
          parseEther("1")
        ),
        "Recipient has reached the day limit"
      );

      await commonBlacklist.connect(moderator).changeDisablingTokenLimits(
        cheel.address,
        false,
        true,
        false,
        true
      );

      await cheel.connect(deployer).transfer(
        receiver.address,
        parseEther("1")
      );

      // Compare limits
      assert.equal(
        String(await commonBlacklist.getUserTokenTransfers(cheel.address, deployer.address)),
        `0,0,${parseEther("1000000").toString()},${parseEther("1000001").toString()}`
      );

      // Getting Remaining limit
      assert.equal(
        String(await commonBlacklist.getUserRemainingLimit(cheel.address, deployer.address)),
        `${parseEther("1000000").toString()},${parseEther("1500000").toString()},0,${parseEther("499999").toString()}`
      );

      // enable day limits
      await commonBlacklist.connect(moderator).changeDisablingTokenLimits(
        cheel.address,
        true,
        true,
        true,
        true
      );

      await expectRevert(
        cheel.connect(deployer).transfer(
          receiver.address,
          parseEther("1")
        ),
        "Spender has reached the day limit"
      );

      // Next day
      await ethers.provider.send('evm_increaseTime', [24 * 60 * 60]);

      // Next Day transaction
      result = await cheel.connect(deployer).transfer(
        receiver.address,
        parseEther("499999")
      );

      resultWaited = await result.wait();

      expect(resultWaited.events[0].args.from).to.equal(deployer.address);
      expect(resultWaited.events[0].args.to).to.equal(receiver.address);
      expect(resultWaited.events[0].args.value).to.equal(parseEther("499999").toString());

      assert.equal(
        String(await commonBlacklist.getUserTokenTransfers(cheel.address, deployer.address)),
        `0,0,${parseEther("499999").toString()},${parseEther("1500000").toString()}`
      );

      // Getting Remaining limit
      assert.equal(
        String(await commonBlacklist.getUserRemainingLimit(cheel.address, deployer.address)),
        `${parseEther("1000000").toString()},${parseEther("1500000").toString()},${parseEther("500001").toString()},0`
      );

      await expectRevert(
        cheel.connect(deployer).transfer(
          receiver.address,
          parseEther("1")
        ),
        "Spender has reached the month limit"
      );

      assert.equal(
        String(await cheel.balanceOf(deployer.address)),
        String(await cheel.balanceOf(deployer.address)),
        parseEther("2000000").toString()
      );

      assert.equal(
        String(await cheel.balanceOf(badguy.address)),
        String(await cheel.balanceOf(badguy.address)),
        parseEther("2000000").toString()
      );
    });

    it("Increase limits", async function () {
      result = await commonBlacklist.connect(moderator).setTokenLimits(
        cheel.address,
        parseEther("1000000"),
        parseEther("3000000"),
        parseEther("500000"),
        parseEther("3000000")
      );

      resultWaited = await result.wait();

      expect(resultWaited.events[0].args.token).to.equal(cheel.address);
      expect(resultWaited.events[0].args.dailyIncomeLimit).to.equal(parseEther("1000000").toString());
      expect(resultWaited.events[0].args.monthlyIncomeLimit).to.equal(parseEther("3000000").toString());
      expect(resultWaited.events[0].args.dailyOutcomeLimit).to.equal(parseEther("500000").toString());
      expect(resultWaited.events[0].args.monthlyOutcomeLimit).to.equal(parseEther("3000000").toString());

      assert.equal(
        String(await commonBlacklist.getTokenLimits(cheel.address)),
        `${parseEther("1000000").toString()},${parseEther("3000000").toString()},${parseEther("500000").toString()},${parseEther("3000000").toString()}`,
      );
    });

    it("Testing Day and Month limits", async function () {
      // Getting Remaining limit
      assert.equal(
        String(await commonBlacklist.getUserRemainingLimit(cheel.address, deployer.address)),
        `${parseEther("1000000").toString()},${parseEther("3000000").toString()},${parseEther("1").toString()},${parseEther("1500000").toString()}`
      );

      assert.equal(
        String(await commonBlacklist.getUserRemainingLimit(cheel.address, receiver.address)),
        `${parseEther("500001").toString()},${parseEther("1500000").toString()},${parseEther("500000").toString()},${parseEther("3000000").toString()}`
      );

      await expectRevert(
        cheel.connect(deployer).transfer(
          receiver.address,
          parseEther("2")
        ),
        "Spender has reached the day limit"
      );

      await commonBlacklist.connect(moderator).setTokenLimits(
        cheel.address,
        parseEther("500000"),
        parseEther("3000000"),
        parseEther("1000000"),
        parseEther("3000000")
      );

      // Getting Remaining limit
      assert.equal(
        String(await commonBlacklist.getUserRemainingLimit(cheel.address, deployer.address)),
        `${parseEther("500000").toString()},${parseEther("3000000").toString()},${parseEther("500001").toString()},${parseEther("1500000").toString()}`
      );

      assert.equal(
        String(await commonBlacklist.getUserRemainingLimit(cheel.address, receiver.address)),
        `${parseEther("1").toString()},${parseEther("1500000").toString()},${parseEther("1000000").toString()},${parseEther("3000000").toString()}`
      );

      await expectRevert(
        cheel.connect(deployer).transfer(
          receiver.address,
          parseEther("2")
        ),
        "Recipient has reached the day limit"
      );

      await commonBlacklist.connect(moderator).setTokenLimits(
        cheel.address,
        parseEther("1000000"),
        parseEther("3000000"),
        parseEther("1000000"),
        parseEther("3000000")
      );

      // First transaction
      result = await cheel.connect(deployer).transfer(
        receiver.address,
        parseEther("500000")
      );

      resultWaited = await result.wait();

      expect(resultWaited.events[0].args.from).to.equal(deployer.address);
      expect(resultWaited.events[0].args.to).to.equal(receiver.address);
      expect(resultWaited.events[0].args.value).to.equal(parseEther("500000").toString());

      assert.equal(
        String(await commonBlacklist.getUserTokenTransfers(cheel.address, deployer.address)),
          `0,0,${parseEther("999999").toString()},${parseEther("2000000").toString()}`
      );

      await expectRevert(
        cheel.connect(deployer).transfer(
          receiver.address,
          parseEther("2")
        ),
        "Spender has reached the day limit"
      );

      // Next day
      await ethers.provider.send('evm_increaseTime', [24 * 60 * 60]);

      await expectRevert(
        cheel.connect(deployer).transfer(
          receiver.address,
          parseEther("1500000")
        ),
        "Spender has reached the day limit"
      );

      // Next Day transaction
      result = await cheel.connect(deployer).transfer(
        receiver.address,
        parseEther("1000000")
      );

      resultWaited = await result.wait();

      expect(resultWaited.events[0].args.from).to.equal(deployer.address);
      expect(resultWaited.events[0].args.to).to.equal(receiver.address);
      expect(resultWaited.events[0].args.value).to.equal(parseEther("1000000").toString());

      await expectRevert(
        cheel.connect(deployer).transfer(
          receiver.address,
          parseEther("1500000")
        ),
        "Spender has reached the day limit"
      );

      assert.equal(
        String(await commonBlacklist.getUserTokenTransfers(cheel.address, deployer.address)),
          `0,0,${parseEther("1000000").toString()},${parseEther("3000000").toString()}`
      );

      await expectRevert(
        cheel.connect(deployer).transfer(
          receiver.address,
          parseEther("1000000")
        ),
        "Spender has reached the day limit"
      );

      // disable day limits
      await commonBlacklist.connect(moderator).changeDisablingTokenLimits(
        cheel.address,
        false,
        true,
        false,
        true
      );

      // Getting Remaining limit
      assert.equal(
        String(await commonBlacklist.getUserRemainingLimit(cheel.address, deployer.address)),
        `${parseEther("1000000").toString()},${parseEther("3000000").toString()},0,0`
      );

      assert.equal(
        String(await commonBlacklist.getUserRemainingLimit(cheel.address, receiver.address)),
        `0,0,${parseEther("1000000").toString()},${parseEther("3000000").toString()}`
      );

      await expectRevert(
        cheel.connect(deployer).transfer(
          receiver.address,
          parseEther("1000000")
        ),
        "Spender has reached the month limit"
      );

      await commonBlacklist.connect(moderator).changeDisablingTokenLimits(
        cheel.address,
        false,
        true,
        false,
        false
      );

      await expectRevert(
        cheel.connect(deployer).transfer(
          receiver.address,
          parseEther("1000000")
        ),
        "Recipient has reached the month limit"
      );

      assert.equal(
        String(await cheel.balanceOf(deployer.address)),
        String(await cheel.balanceOf(deployer.address)),
        parseEther("2000000").toString()
      );

      assert.equal(
        String(await cheel.balanceOf(badguy.address)),
        String(await cheel.balanceOf(badguy.address)),
        parseEther("2000000").toString()
      );
    });

    it("Testing Exclusion list", async function () {
      await commonBlacklist.connect(moderator).changeDisablingTokenLimits(
        cheel.address,
        true,
        true,
        true,
        true
      );

      // Getting Remaining limit
      assert.equal(
        String(await commonBlacklist.getUserRemainingLimit(cheel.address, exclusionContract.address)),
        `${parseEther("1000000").toString()},${parseEther("3000000").toString()},${parseEther("1000000").toString()},${parseEther("3000000").toString()}`
      );

      assert.equal(
        String(await commonBlacklist.getUserRemainingLimit(cheel.address, receiver.address)),
        `0,0,${parseEther("1000000").toString()},${parseEther("3000000").toString()}`
      );

      await expectRevert(
        cheel.connect(exclusionContract).transfer(
          receiver.address,
          parseEther("1500000")
        ),
        "Spender has reached the day limit"
      );

      await commonBlacklist.connect(moderator).addContractToExclusionList(exclusionContract.address);

      await expectRevert(
        cheel.connect(clearLimitsUser).transfer(
          receiver.address,
          parseEther("1")
        ),
        "Recipient has reached the day limit"
      );

      // Excluded contract outcome transaction
      result = await cheel.connect(exclusionContract).transfer(
        receiver.address,
        parseEther("1500000")
      );

      // Getting Remaining limit
      assert.equal(
        String(await commonBlacklist.getUserRemainingLimit(cheel.address, exclusionContract.address)),
        `${parseEther("1000000").toString()},${parseEther("3000000").toString()},${parseEther("1000000").toString()},${parseEther("3000000").toString()}`
      );

      assert.equal(
        String(await commonBlacklist.getUserRemainingLimit(cheel.address, receiver.address)),
        `0,0,${parseEther("1000000").toString()},${parseEther("3000000").toString()}`
      );

      await commonBlacklist.connect(moderator).removeContractFromExclusionList(exclusionContract.address);

      await expectRevert(
        cheel.connect(exclusionContract).transfer(
          receiver.address,
          parseEther("1500000")
        ),
        "Spender has reached the day limit"
      );
    });
  });

  describe("Restrictions:", async () => {
    it("Mint from users", async function () {
      await expectRevert(
        cheel.connect(deployer).mint(
          receiver.address,
          parseEther("1000000")
        ),
        "Ownable: caller is not the owner"
      );

      assert.equal(
        String(await cheel.balanceOf(deployer.address)),
        parseEther("1000000").toString()
      );

      assert.equal(
        String(await cheel.balanceOf(receiver.address)),
        parseEther("6500000").toString()
      );

      assert.equal(
        String(await cheel.totalSupply()),
        parseEther("15000000").toString()
      );
    });

    it("Burn from users", async function () {
      await expectRevert(
        cheel.connect(deployer).burn(
          parseEther("1000000")
        ),
        "Ownable: caller is not the owner"
      );

      assert.equal(
        String(await cheel.balanceOf(deployer.address)),
        parseEther("1000000").toString()
      );

      assert.equal(
        String(await cheel.totalSupply()),
        parseEther("15000000").toString()
      );
    });

    it("Minting over max amount from owner", async function () {
      await expectRevert(
        cheel.connect(gnosis).mint(
          gnosis.address,
          parseEther("1000000001")
        ),
        "Can't mint more than max amount"
      );

      assert.equal(
        String(await cheel.balanceOf(deployer.address)),
        parseEther("1000000").toString()
      );

      assert.equal(
        String(await cheel.totalSupply()),
        parseEther("15000000").toString()
      );
    });
  });
});

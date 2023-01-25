import {assert, expect} from "chai";
import {
  expectEvent,
  expectRevert,
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
  let BLACKLIST_OPERATOR_ROLE: string;
  let result: any;
  let resultWaited: any;

  before(async () => {
    // Deploy Common Blacklist
    commonBlacklist = await deployCommonBlacklist();

    // Deploy CHEEL
    cheel = await deployCHEEL();

    // Creating GNOSIS
    [etherHolder, deployer, receiver, badguy, moderator, varybadguy] = await ethers.getSigners();
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
    it("Setting Blacklist for CHEEL", async function () {
      await expectRevert(
        cheel.connect(deployer).updateGlobalBlacklist(commonBlacklist.address),
        "Ownable: caller is not the owner"
      );

      result = await cheel.connect(gnosis).updateGlobalBlacklist(commonBlacklist.address);
      resultWaited = await result.wait();

      expect(resultWaited.events[0].args.blacklist).to.equal(commonBlacklist.address);
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

      assert.equal(
        String(await cheel.totalSupply()),
        parseEther("10000000").toString()
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
        parseEther("9000000").toString()
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
        cheel.connect(varybadguy).transfer(
          deployer.address,
          parseEther("1000000")
        ),
        "CHEEL: Spender in global blacklist"
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

      assert.equal(await commonBlacklist.userIsBlacklisted(varybadguy.address), false);
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
        parseEther("3000000").toString()
      );

      assert.equal(
        String(await cheel.balanceOf(receiver.address)),
        parseEther("2000000").toString()
      );

      assert.equal(
        String(await cheel.totalSupply()),
        parseEther("9000000").toString()
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
        parseEther("3000000").toString()
      );

      assert.equal(
        String(await cheel.totalSupply()),
        parseEther("9000000").toString()
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
        parseEther("3000000").toString()
      );

      assert.equal(
        String(await cheel.totalSupply()),
        parseEther("9000000").toString()
      );
    });
  });
});

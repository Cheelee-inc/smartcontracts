import {assert, expect} from "chai";
import {
  expectEvent,
  expectRevert,
  // @ts-ignore
} from "@openzeppelin/test-helpers";
import { parseEther } from "ethers/lib/utils";
import {artifacts, contract, ethers} from "hardhat";
import {
  CHEELConfig,
  CommonBlacklistConfig,
  LEEConfig,
  NFTCasesConfig,
  NFTGlassesConfig, NFTSaleConfig, TreasuryConfig
} from '../config/ContractsConfig';
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {currentTimestamp} from "../utils/helpers";
import * as Sale from "./SaleEIP712";
import * as Redeem from "./RedeemEIP712";
import * as TrNftSig from "./TreasuryNftEIP712";
import * as TrTokenSig from "./TreasuryTokenEIP712";

const CHEEL = artifacts.require("./CHEEL.sol");
const LEE = artifacts.require("./CHEEL.sol");
const NFT = artifacts.require("./NFT.sol");
const NFTSale = artifacts.require("./NFTSale.sol");
const Treasury = artifacts.require("./Treasury.sol");
const CommonBlacklist = artifacts.require("./CommonBlacklist.sol");
const MockERC20 = artifacts.require("./test/MockERC20.sol");

contract(NFTGlassesConfig.contractName, ([deployer, receiver, badguy, moderator, varybadguy, tester, testmultisig]) => {
  let commonBlacklist: any;
  let cheel: any;
  let lee: any;
  let nftGlasses: any;
  let nftCases: any;
  let nftSaleGlasses: any;
  let nftSaleCases: any;
  let treasury: any;
  let usdt: any;
  let nftGlassesGnosis: SignerWithAddress;
  let nftCasesGnosis: SignerWithAddress;
  let cheelGnosis: SignerWithAddress;
  let blacklistGnosis: SignerWithAddress;
  let nftSaleGnosis: SignerWithAddress;
  let treasuryGnosis: SignerWithAddress;
  let etherHolder: any;
  let BLACKLIST_OPERATOR_ROLE: any;
  let result: any;
  const price = parseEther("1");
  const testBaseURI = "ipfs://ipfs/";

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

    // Deploy LEE
    lee = await LEE.new({ from: deployer });

    // Initialize LEE
    await lee.initialize(
      LEEConfig.tokenName,
      LEEConfig.tokenSymbol,
      LEEConfig.maxAmount,
      commonBlacklist.address,
      LEEConfig.multiSigAddress,
      { from: deployer }
    );

    // Deploy NFT Glasses
    nftGlasses = await NFT.new({ from: deployer });

    // Initialize NFT Glasses
    await nftGlasses.initialize(
      NFTGlassesConfig.nftName,
      NFTGlassesConfig.nftSymbol,
      commonBlacklist.address,
      NFTGlassesConfig.multiSigAddress,
      { from: deployer }
    );

    // Deploy NFT Cases
    nftCases = await NFT.new({ from: deployer });

    // Initialize NFT Cases
    await nftCases.initialize(
      NFTCasesConfig.nftName,
      NFTCasesConfig.nftSymbol,
      commonBlacklist.address,
      NFTCasesConfig.multiSigAddress,
      { from: deployer }
    );

    // Deploy NFT SALE for Glasses
    nftSaleGlasses = await NFTSale.new(
      nftGlasses.address,
      deployer,
      price,
      1000,
      1000,
      { from: deployer }
    );

    // Deploy NFT SALE for Cases
    nftSaleCases = await NFTSale.new(
      nftCases.address,
      deployer,
      price,
      1000,
      1000,
      { from: deployer }
    );

    // Deploy USDT
    usdt = await MockERC20.new('Tether token', 'USDT', 10000, { from: deployer });

    // Deploy Treasury
    treasury = await Treasury.new({ from: deployer });

    // Initialize Treasury
    await treasury.initialize(
      nftCases.address,
      nftGlasses.address,
      deployer,
      lee.address,
      cheel.address,
      usdt.address,
      { from: deployer }
    );

    // Creating GNOSIS
    [etherHolder] = await ethers.getSigners()
    nftGlassesGnosis = await ethers.getImpersonatedSigner(NFTGlassesConfig.multiSigAddress)
    nftCasesGnosis = await ethers.getImpersonatedSigner(NFTGlassesConfig.multiSigAddress)
    cheelGnosis = await ethers.getImpersonatedSigner(CHEELConfig.multiSigAddress)
    blacklistGnosis = await ethers.getImpersonatedSigner(CommonBlacklistConfig.multiSigAddress)
    nftSaleGnosis = await ethers.getImpersonatedSigner(NFTSaleConfig.multiSigAddress)
    treasuryGnosis = await ethers.getImpersonatedSigner(TreasuryConfig.multiSigAddress)
    await etherHolder.sendTransaction({
      to: NFTGlassesConfig.multiSigAddress,
      value: ethers.utils.parseEther("1")
    })
    await etherHolder.sendTransaction({
      to: NFTCasesConfig.multiSigAddress,
      value: ethers.utils.parseEther("1")
    })
    await etherHolder.sendTransaction({
      to: CHEELConfig.multiSigAddress,
      value: ethers.utils.parseEther("1")
    })
    await etherHolder.sendTransaction({
      to: CommonBlacklistConfig.multiSigAddress,
      value: ethers.utils.parseEther("1")
    })
    await etherHolder.sendTransaction({
      to: NFTSaleConfig.multiSigAddress,
      value: ethers.utils.parseEther("1")
    })
    await etherHolder.sendTransaction({
      to: TreasuryConfig.multiSigAddress,
      value: ethers.utils.parseEther("1")
    })

    BLACKLIST_OPERATOR_ROLE = await cheel.BLACKLIST_OPERATOR_ROLE();
  });

  describe("Normal cases:", async () => {
    it("Setting nft BASE URI", async function () {
      await nftGlasses.setUri(
        testBaseURI,
        { from: nftGlassesGnosis.address }
      );

      await nftCases.setUri(
        testBaseURI,
        { from: nftCasesGnosis.address }
      );
    });

    it("Setting nft sale and treasury contracts", async function () {
      await nftGlasses.setNftSaleAndTreasury(
        nftSaleGlasses.address,
        treasury.address,
        { from: nftGlassesGnosis.address }
      );

      await nftCases.setNftSaleAndTreasury(
        nftSaleCases.address,
        treasury.address,
        { from: nftCasesGnosis.address }
      );
    });

    it("Check NFT Glosses initial data", async function () {
      expect(await nftGlasses.name()).to.equal(NFTGlassesConfig.nftName);
      expect(await nftGlasses.symbol()).to.equal(NFTGlassesConfig.nftSymbol);
      expect((await nftGlasses.totalSupply()).toString()).to.equal('0');
      expect((await nftGlasses.commonBlacklist()).toUpperCase()).to.equal(commonBlacklist.address.toUpperCase());
      expect((await nftGlasses.GNOSIS()).toUpperCase()).to.equal(NFTGlassesConfig.multiSigAddress.toUpperCase());
      expect((await nftGlasses.owner()).toUpperCase()).to.equal(NFTGlassesConfig.multiSigAddress.toUpperCase());
      expect((await nftGlasses.nftSale()).toUpperCase()).to.equal(nftSaleGlasses.address.toUpperCase());
      expect((await nftGlasses.treasury()).toUpperCase()).to.equal(treasury.address.toUpperCase());
    });

    it("Check NFT Cases initial data", async function () {
      expect(await nftCases.name()).to.equal(NFTCasesConfig.nftName);
      expect(await nftCases.symbol()).to.equal(NFTCasesConfig.nftSymbol);
      expect((await nftCases.totalSupply()).toString()).to.equal('0');
      expect((await nftCases.commonBlacklist()).toUpperCase()).to.equal(commonBlacklist.address.toUpperCase());
      expect((await nftCases.GNOSIS()).toUpperCase()).to.equal(NFTCasesConfig.multiSigAddress.toUpperCase());
      expect((await nftCases.owner()).toUpperCase()).to.equal(NFTCasesConfig.multiSigAddress.toUpperCase());
      expect((await nftCases.nftSale()).toUpperCase()).to.equal(nftSaleCases.address.toUpperCase());
    });

    it("Deployer distributes tokens to accounts", async () => {
      // transfer USDT to accounts
      await usdt.transfer(receiver, 1000, { from: deployer });
      await usdt.transfer(badguy, 1000, { from: deployer });
      await usdt.transfer(moderator, 1000, { from: deployer });
      await usdt.transfer(varybadguy, 1000, { from: deployer });
      await usdt.transfer(treasury.address, 1000, { from: deployer });
    });
  });

  describe("Tokens can be claimed:", async () => {
    it("Only nft owner can mint nft", async function () {
      result = await nftGlasses.safeMint(
        nftGlassesGnosis.address,
        0,
        { from: nftGlassesGnosis.address }
      );

      expectEvent(result, "Transfer", {
        to: nftGlassesGnosis.address,
        tokenId: "0",
      });

      await expectRevert(
        nftGlasses.safeMint(
          deployer,
          1,
          { from: deployer }
        ),
        "Ownable: caller is not the owner"
      );

      assert.equal(
        await nftGlasses.ownerOf(0),
        nftGlassesGnosis.address
      );

      assert.equal(
        await nftGlasses.balanceOf(nftGlassesGnosis.address),
        "1"
      );

      assert.equal(
        await nftGlasses.tokenURI(0),
        `${testBaseURI}0`
      );

      assert.equal(
        (await nftGlasses.tokensOwnedByUser(nftGlassesGnosis.address)).length,
        "1"
      );
    });

    it("purchase nft", async function () {
      const domain = Sale.eip712Domain(nftSaleGlasses.address, (await ethers.provider.getNetwork()).chainId)
      const timestamp = await currentTimestamp() + 1000
      const signatureSigner = await ethers.getImpersonatedSigner(deployer)
      const signature = await signatureSigner._signTypedData(domain, Sale.Pass, {id: 1, address_to: deployer, ttl_timestamp: timestamp})
      const signature2 = await signatureSigner._signTypedData(domain, Sale.Pass, {id: 2, address_to: receiver, ttl_timestamp: timestamp})

      await nftSaleGlasses.purchase(
        1,
        timestamp,
        signature,
        {
          from: deployer,
          value: price
        }
      );

      assert.equal(
        String(await nftGlasses.balanceOf(deployer)),
        "1"
      );

      await expectRevert(
        nftSaleGlasses.purchase(
          1,
          timestamp,
          signature,
          {
            from: deployer,
            value: price
          }
        ),
        "Can buy only once"
      );

      await expectRevert(
        nftSaleGlasses.purchase(
          2,
          timestamp,
          signature2,
          {
            from: receiver,
            value: parseEther("0.1")
          }
        ),
        "Price not correct"
      );

      await expectRevert(
        nftSaleGlasses.purchase(
          2,
          timestamp,
          signature2,
          {
            from: receiver,
            value: parseEther("2")
          }
        ),
        "Price not correct"
      );

      await expectRevert(
        nftSaleGlasses.purchase(
          2,
          timestamp + 1,
          signature2,
          {
            from: receiver,
            value: price
          }
        ),
        "Bad signature"
      );

      await nftSaleGlasses.purchase(
        2,
        timestamp,
        signature2,
        {
          from: receiver,
          value: price
        }
      );

      assert.equal(
        String(await nftGlasses.balanceOf(receiver)),
        "1"
      );
    });

    it("adding badguy for Internal Blacklist for glasses nft", async function () {
      const domain = Sale.eip712Domain(nftSaleGlasses.address, (await ethers.provider.getNetwork()).chainId)
      const timestamp = await currentTimestamp() + 1000
      const signatureSigner = await ethers.getImpersonatedSigner(deployer)
      const signature = await signatureSigner._signTypedData(domain, Sale.Pass, {id: 3, address_to: badguy, ttl_timestamp: timestamp})

      result = await nftGlasses.grantRole(
        BLACKLIST_OPERATOR_ROLE,
        moderator,
        { from: nftGlassesGnosis.address }
      );

      expectEvent(result, "RoleGranted", {
        role: BLACKLIST_OPERATOR_ROLE,
        account: moderator,
        sender: nftGlassesGnosis.address,
      });

      assert.equal(await nftGlasses.hasRole(BLACKLIST_OPERATOR_ROLE, moderator), true);

      await nftGlasses.addUsersToBlacklist(
        [badguy],
        { from: moderator }
      );

      assert.equal(await nftGlasses.userInBlacklist(badguy), true);
      assert.equal(await nftGlasses.userInBlacklist(deployer), false);

      await expectRevert(
        nftSaleGlasses.purchase(
          3,
          timestamp,
          signature,
          {
            from: badguy,
            value: price
          }
        ),
        "NFT: Recipient in internal blacklist"
      );

      await nftGlasses.removeUsersFromBlacklist(
        [badguy],
        { from: moderator }
      );

      assert.equal(await nftGlasses.userInBlacklist(badguy), false);

      await nftSaleGlasses.purchase(
        3,
        timestamp,
        signature,
        {
          from: badguy,
          value: price
        }
      );

      assert.equal(
        String(await nftGlasses.balanceOf(badguy)),
        "1"
      );

      await nftGlasses.addUsersToBlacklist(
        [badguy],
        { from: moderator }
      );
    });

    it("adding varybadguy for Common Blacklist", async function () {
      const domain = Sale.eip712Domain(nftSaleGlasses.address, (await ethers.provider.getNetwork()).chainId)
      const timestamp = await currentTimestamp() + 1000
      const signatureSigner = await ethers.getImpersonatedSigner(deployer)
      const signature = await signatureSigner._signTypedData(domain, Sale.Pass, {id: 4, address_to: varybadguy, ttl_timestamp: timestamp})

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

      await commonBlacklist.addUsersToBlacklist(
        [varybadguy],
        { from: moderator }
      );

      assert.equal(await commonBlacklist.userIsBlacklisted(badguy), false);
      assert.equal(await commonBlacklist.userIsBlacklisted(varybadguy), true);
      assert.equal(await commonBlacklist.userIsBlacklisted(deployer), false);
      assert.equal(await cheel.userInBlacklist(varybadguy), false);

      await expectRevert(
        nftSaleGlasses.purchase(
          4,
          timestamp,
          signature,
          {
            from: varybadguy,
            value: price
          }
        ),
        "NFT: Recipient in common blacklist"
      );

      await commonBlacklist.removeUsersFromBlacklist(
        [varybadguy],
        { from: moderator }
      );

      assert.equal(await nftGlasses.userInBlacklist(varybadguy), false);

      await nftSaleGlasses.purchase(
        4,
        timestamp,
        signature,
        {
          from: varybadguy,
          value: price
        }
      );

      assert.equal(
        String(await nftGlasses.balanceOf(varybadguy)),
        "1"
      );

      await commonBlacklist.addUsersToBlacklist(
        [varybadguy],
        { from: moderator }
      );
    });

    it("setting out of stock", async function () {
      const domain = Sale.eip712Domain(nftSaleGlasses.address, (await ethers.provider.getNetwork()).chainId)
      const timestamp = await currentTimestamp() + 1000
      const signatureSigner = await ethers.getImpersonatedSigner(deployer)
      const signature3 = await signatureSigner._signTypedData(domain, Sale.Pass, {id: 5, address_to: moderator, ttl_timestamp: timestamp})

      await expectRevert(
        nftSaleGlasses.setPurchaseSupply(
          0,
          { from: deployer }
        ),
        "Ownable: caller is not the owner"
      );

      await nftSaleGlasses.setPurchaseSupply(
        0,
        { from: nftSaleGnosis.address }
      );

      await expectRevert(
        nftSaleGlasses.purchase(
          5,
          timestamp,
          signature3,
          {
            from: moderator,
            value: price
          }
        ),
        "Out of stock"
      );

      await nftSaleGlasses.setPurchaseSupply(
        1000,
        { from: nftSaleGnosis.address }
      );

      await nftSaleGlasses.purchase(
        5,
        timestamp,
        signature3,
        {
          from: moderator,
          value: price
        }
      );

      assert.equal(
        String(await nftGlasses.balanceOf(moderator)),
        "1"
      );
    });

    it("setting new price", async function () {
      const domain = Sale.eip712Domain(nftSaleGlasses.address, (await ethers.provider.getNetwork()).chainId)
      const timestamp = await currentTimestamp() + 1000
      const signatureSigner = await ethers.getImpersonatedSigner(deployer)
      const signature4 = await signatureSigner._signTypedData(domain, Sale.Pass, {id: 6, address_to: tester, ttl_timestamp: timestamp})

      await expectRevert(
        nftSaleGlasses.setPrice(
          parseEther("2"),
          { from: deployer }
        ),
        "Ownable: caller is not the owner"
      );

      await nftSaleGlasses.setPrice(
        parseEther("2"),
        { from: nftSaleGnosis.address }
      );

      await expectRevert(
        nftSaleGlasses.purchase(
          6,
          timestamp,
          signature4,
          {
            from: tester,
            value: price
          }
        ),
        "Price not correct"
      );

      await nftSaleGlasses.purchase(
        6,
        timestamp,
        signature4,
        {
          from: tester,
          value: parseEther("2")
        }
      );

      assert.equal(
        String(await nftGlasses.balanceOf(tester)),
        "1"
      );

      await nftSaleGlasses.setPrice(
        price,
        { from: nftSaleGnosis.address }
      );
    });
  });

  describe("Redeem testing", async () => {
    it("Testing Redeem", async function () {
      const domain = Redeem.eip712Domain(nftSaleGlasses.address, (await ethers.provider.getNetwork()).chainId)
      const timestamp = await currentTimestamp() + 1000
      const signatureSigner = await ethers.getImpersonatedSigner(deployer)
      const signature = await signatureSigner._signTypedData(domain, Redeem.Pass, {id: 7, address_to: deployer, ttl_timestamp: timestamp})
      const signature2 = await signatureSigner._signTypedData(domain, Redeem.Pass, {id: 8, address_to: badguy, ttl_timestamp: timestamp})
      const signature3 = await signatureSigner._signTypedData(domain, Redeem.Pass, {id: 9, address_to: varybadguy, ttl_timestamp: timestamp})

      await nftSaleGlasses.redeem(
        7,
        timestamp,
        signature,
        { from: deployer }
      );

      assert.equal(
        String(await nftGlasses.balanceOf(deployer)),
        "2"
      );

      await expectRevert(
        nftSaleGlasses.redeem(
          8,
          timestamp,
          signature2,
          { from: badguy }
        ),
        "NFT: Recipient in internal blacklist"
      );

      await expectRevert(
        nftSaleGlasses.redeem(
          9,
          timestamp,
          signature3,
          { from: varybadguy }
        ),
        "NFT: Recipient in common blacklist"
      );
    });

    it("Testing out of stock", async function () {
      const domain = Redeem.eip712Domain(nftSaleGlasses.address, (await ethers.provider.getNetwork()).chainId)
      const timestamp = await currentTimestamp() + 1000
      const signatureSigner = await ethers.getImpersonatedSigner(deployer)
      const signature2 = await signatureSigner._signTypedData(domain, Redeem.Pass, {id: 8, address_to: receiver, ttl_timestamp: timestamp})

      await expectRevert(
        nftSaleGlasses.setRedeemSupply(
          0,
          { from: deployer }
        ),
        "Ownable: caller is not the owner"
      );

      await nftSaleGlasses.setRedeemSupply(
        0,
        { from: nftSaleGnosis.address }
      );

      await expectRevert(
        nftSaleGlasses.redeem(
          8,
          timestamp,
          signature2,
          { from: receiver }
        ),
        "Out of stock"
      );

      await nftSaleGlasses.setRedeemSupply(
        1000,
        { from: nftSaleGnosis.address }
      );

      await nftSaleGlasses.redeem(
        8,
        timestamp,
        signature2,
        { from: receiver }
      );

      assert.equal(
        String(await nftGlasses.balanceOf(receiver)),
        "2"
      );
    });

    it("Testing pausing", async function () {
      const domain = Redeem.eip712Domain(nftSaleGlasses.address, (await ethers.provider.getNetwork()).chainId)
      const timestamp = await currentTimestamp() + 1000
      const signatureSigner = await ethers.getImpersonatedSigner(deployer)
      const signature3 = await signatureSigner._signTypedData(domain, Redeem.Pass, {id: 9, address_to: moderator, ttl_timestamp: timestamp})

      await expectRevert(
        nftSaleGlasses.pauseRedeem(
          { from: deployer }
        ),
        "Ownable: caller is not the owner"
      );

      await nftSaleGlasses.pauseRedeem(
        { from: nftSaleGnosis.address }
      );

      await expectRevert(
        nftSaleGlasses.redeem(
          9,
          timestamp,
          signature3,
          { from: moderator }
        ),
        "Redeeming paused"
      );

      await nftSaleGlasses.pauseRedeem(
        { from: nftSaleGnosis.address }
      );

      await nftSaleGlasses.redeem(
        9,
        timestamp,
        signature3,
        { from: moderator }
      );

      assert.equal(
        String(await nftGlasses.balanceOf(moderator)),
        "2"
      );
    });

    it("Testing withdrow", async function () {
      await expectRevert(
        nftSaleGlasses.withdraw(
          { from: deployer }
        ),
        "Ownable: caller is not the owner"
      );

      result = await nftSaleGlasses.withdraw(
        { from: nftSaleGnosis.address }
      );

      expectEvent(result, "Withdraw", {
        amount: parseEther("7").toString(),
      });

    });
  });

  describe("Treasury", async () => {
    it("mint nft from treasury", async function () {
      const domain = TrNftSig.eip712Domain(treasury.address, (await ethers.provider.getNetwork()).chainId)
      const timestamp = await currentTimestamp() + 1000
      const signatureSigner = await ethers.getImpersonatedSigner(deployer)
      const signature = await signatureSigner._signTypedData(domain, TrNftSig.Pass, {nonce: 8, id: 10, address_to: deployer, ttl: timestamp, option: 1})
      const signature2 = await signatureSigner._signTypedData(domain, TrNftSig.Pass, {nonce: 9, id: 11, address_to: badguy, ttl: timestamp, option: 1})
      const signature3 = await signatureSigner._signTypedData(domain, TrNftSig.Pass, {nonce: 10, id: 12, address_to: varybadguy, ttl: timestamp, option: 1})

      result = await treasury.withdrawNFT(
        8,
        10,
        deployer,
        timestamp,
        1,
        signature,
        { from: deployer }
      );

      expectEvent(result, "WithdrawedNFT", {
        user: deployer,
        id: "10",
        option: "1",
      });

      assert.equal(
        String(await nftGlasses.balanceOf(deployer)),
        "3"
      );

      await expectRevert(
        treasury.withdrawNFT(
          9,
          11,
          badguy,
          timestamp,
          1,
          signature2,
          { from: badguy }
        ),
        "NFT: Recipient in internal blacklist"
      );

      await expectRevert(
        treasury.withdrawNFT(
          10,
          12,
          varybadguy,
          timestamp,
          1,
          signature3,
          { from: varybadguy }
        ),
        "NFT: Recipient in common blacklist"
      );
    });

    it("send nft to treasury", async function () {
      await nftGlasses.transferFrom(
        deployer,
        treasury.address,
        10,
        { from: deployer }
      );

      assert.equal(
        String(await nftGlasses.balanceOf(deployer)),
        "2"
      );

      await expectRevert(
        nftGlasses.transferFrom(
          badguy,
          treasury.address,
          3,
          { from: badguy }
        ),
        "NFT: Sender in internal blacklist"
      );

      await expectRevert(
        nftGlasses.transferFrom(
          varybadguy,
          treasury.address,
          4,
          { from: varybadguy }
        ),
        "NFT: Sender in common blacklist"
      );
    });

    it("withdraw nft from treasury", async function () {
      const domain = TrNftSig.eip712Domain(treasury.address, (await ethers.provider.getNetwork()).chainId)
      const timestamp = await currentTimestamp() + 1000
      const signatureSigner = await ethers.getImpersonatedSigner(deployer)
      const signature = await signatureSigner._signTypedData(domain, TrNftSig.Pass, {nonce: 9, id: 10, address_to: deployer, ttl: timestamp, option: 1})

      result = await treasury.withdrawNFT(
        9,
        10,
        deployer,
        timestamp,
        1,
        signature,
        { from: deployer }
      );

      expectEvent(result, "WithdrawedNFT", {
        user: deployer,
        id: "10",
        option: "1",
      });

      assert.equal(
        String(await nftGlasses.balanceOf(deployer)),
        "3"
      );
    });

    it("day limits included", async function () {
      const domain = TrNftSig.eip712Domain(treasury.address, (await ethers.provider.getNetwork()).chainId)
      const timestamp = await currentTimestamp() + 1000
      const signatureSigner = await ethers.getImpersonatedSigner(deployer)
      const signature = await signatureSigner._signTypedData(domain, TrNftSig.Pass, {nonce: 10, id: 10, address_to: deployer, ttl: timestamp, option: 1})

      result = await treasury.setNftLimit(
        1,
        2,
        { from: treasuryGnosis.address }
      );

      expectEvent(result, "SetNftLimit", {
        index: "1",
        newLimit: "2",
      });

      await nftGlasses.transferFrom(
        deployer,
        treasury.address,
        10,
        { from: deployer }
      );

      await expectRevert(
        treasury.withdrawNFT(
          10,
          10,
          deployer,
          timestamp,
          1,
          signature,
          { from: deployer }
        ),
        "Too many transfers"
      );

      result = await treasury.setNftLimit(
        1,
        3,
        { from: treasuryGnosis.address }
      );

      expectEvent(result, "SetNftLimit", {
        index: "1",
        newLimit: "3",
      });

      result = await treasury.withdrawNFT(
        10,
        10,
        deployer,
        timestamp,
        1,
        signature,
        { from: deployer }
      );

      expectEvent(result, "WithdrawedNFT", {
        user: deployer,
        id: "10",
        option: "1",
      });
    });

    it("getting actual transfers per day", async function () {
      const currentDay = await treasury.getCurrentDay();

      result = await treasury.nftTransfersPerDay(
        deployer,
        currentDay,
        1,
        { from: treasuryGnosis.address }
      );

      assert.equal(
        String(result),
        "3"
      );
    });

    it("Testing disabling NFT", async function () {
      const domain = TrNftSig.eip712Domain(treasury.address, (await ethers.provider.getNetwork()).chainId)
      const timestamp = await currentTimestamp() + 1000
      const signatureSigner = await ethers.getImpersonatedSigner(deployer)
      const signature = await signatureSigner._signTypedData(domain, TrNftSig.Pass, {nonce: 11, id: 10, address_to: deployer, ttl: timestamp, option: 1})

      await nftGlasses.transferFrom(
        deployer,
        treasury.address,
        10,
        { from: deployer }
      );

      result = await treasury.disableNFT(
        1,
        { from: treasuryGnosis.address }
      );

      expectEvent(result, "DisableNFT", {
        index: "1",
      });

      await expectRevert(
        treasury.withdrawNFT(
          11,
          10,
          deployer,
          timestamp,
          1,
          signature,
          { from: deployer }
        ),
        "Option disabled"
      );
    });

    it("Adding new NFT", async function () {
      const domain = TrNftSig.eip712Domain(treasury.address, (await ethers.provider.getNetwork()).chainId)
      const timestamp = await currentTimestamp() + 1000
      const signatureSigner = await ethers.getImpersonatedSigner(deployer)
      const signature = await signatureSigner._signTypedData(domain, TrNftSig.Pass, {nonce: 11, id: 11, address_to: deployer, ttl: timestamp, option: 2})
      const signature2 = await signatureSigner._signTypedData(domain, TrNftSig.Pass, {nonce: 12, id: 12, address_to: deployer, ttl: timestamp, option: 2})
      const signature3 = await signatureSigner._signTypedData(domain, TrNftSig.Pass, {nonce: 12, id: 12, address_to: deployer, ttl: timestamp, option: 2})

      const newNftTest = await NFT.new({ from: deployer });

      await newNftTest.initialize(
        "NFT Test NFT",
        "NTN",
        commonBlacklist.address,
        testmultisig,
        { from: deployer }
      );

      const newNftSaleTest = await NFTSale.new(
        newNftTest.address,
        deployer,
        price,
        1000,
        1000,
        { from: deployer }
      );

      result = await newNftTest.setNftSaleAndTreasury(
        newNftSaleTest.address,
        treasury.address,
        { from: testmultisig }
      );

      expectEvent(result, "SetSaleAndTreasury", {
        sale: newNftSaleTest.address,
        treasury: treasury.address,
      });

      result = await treasury.addNFT(
        newNftTest.address,
        2,
        { from: treasuryGnosis.address }
      );

      expectEvent(result, "AddNFT", {
        addr: newNftTest.address,
        limit: "2",
      });

      result = await treasury.withdrawNFT(
        11,
        11,
        deployer,
        timestamp,
        2,
        signature,
        { from: deployer }
      );

      expectEvent(result, "WithdrawedNFT", {
        user: deployer,
        id: "11",
        option: "2",
      });

      await newNftTest.transferFrom(
        deployer,
        treasury.address,
        11,
        { from: deployer }
      );

      result = await treasury.withdrawNFT(
        12,
        12,
        deployer,
        timestamp,
        2,
        signature2,
        { from: deployer }
      );

      expectEvent(result, "WithdrawedNFT", {
        user: deployer,
        id: "12",
        option: "2",
      });

      await newNftTest.transferFrom(
        deployer,
        treasury.address,
        12,
        { from: deployer }
      );

      await expectRevert(
        treasury.withdrawNFT(
          12,
          12,
          deployer,
          timestamp,
          2,
          signature3,
          { from: deployer }
        ),
        "Too many transfers"
      );
    });
  });

  describe("Tokens testing", async () => {
    it("mint and withdraw cheel tokens from treasury", async function () {
      const domain = TrTokenSig.eip712Domain(treasury.address, (await ethers.provider.getNetwork()).chainId)
      const timestamp = await currentTimestamp() + 1000
      const signatureSigner = await ethers.getImpersonatedSigner(deployer)
      const signature = await signatureSigner._signTypedData(domain, TrTokenSig.Pass, {nonce: 1, amount: 10000, address_to: deployer, ttl: timestamp, option: 1})

      await cheel.mint(
        treasury.address,
        parseEther("100000"),
        { from: cheelGnosis.address }
      );

      result = await treasury.withdraw(
        1,
        10000,
        deployer,
        timestamp,
        1,
        signature,
        { from: deployer }
      );

      expectEvent(result, "Withdrawed", {
        user: deployer,
        amount: "10000",
        option: "1",
      });
    });

    it("Internal Blacklist for tokens", async function () {
      const domain = TrTokenSig.eip712Domain(treasury.address, (await ethers.provider.getNetwork()).chainId)
      const timestamp = await currentTimestamp() + 1000
      const signatureSigner = await ethers.getImpersonatedSigner(deployer)
      const signature = await signatureSigner._signTypedData(domain, TrTokenSig.Pass, {nonce: 100, amount: 10000, address_to: badguy, ttl: timestamp, option: 1})

      result = await cheel.grantRole(
        BLACKLIST_OPERATOR_ROLE,
        moderator,
        { from: cheelGnosis.address }
      );

      expectEvent(result, "RoleGranted", {
        role: BLACKLIST_OPERATOR_ROLE,
        account: moderator,
        sender: cheelGnosis.address,
      });

      assert.equal(await cheel.hasRole(BLACKLIST_OPERATOR_ROLE, moderator), true);

      await cheel.addUsersToBlacklist(
        [badguy],
        { from: moderator }
      );

      assert.equal(await cheel.userInBlacklist(badguy), true);
      assert.equal(await cheel.userInBlacklist(deployer), false);

      await expectRevert(
        cheel.transferFrom(
          badguy,
          deployer,
          parseEther("1000000"),
          { from: cheelGnosis.address }
        ),
        "ERC20: insufficient allowance"
      );

      await expectRevert(
        cheel.mint(
          badguy,
          parseEther("1000"),
          { from: cheelGnosis.address }
        ),
        "Recipient in internal blacklist"
      );

      await expectRevert(
        treasury.withdraw(
          100,
          10000,
          badguy,
          timestamp,
          1,
          signature,
          { from: badguy }
        ),
        "Recipient in internal blacklist"
      );
    });

    it("Common Blacklist", async function () {
      const domain = TrTokenSig.eip712Domain(treasury.address, (await ethers.provider.getNetwork()).chainId)
      const timestamp = await currentTimestamp() + 1000
      const signatureSigner = await ethers.getImpersonatedSigner(deployer)
      const signature = await signatureSigner._signTypedData(domain, TrTokenSig.Pass, {nonce: 101, amount: 10000, address_to: varybadguy, ttl: timestamp, option: 1})

      await expectRevert(
        cheel.transferFrom(
          varybadguy,
          deployer,
          parseEther("1000000"),
          { from: cheelGnosis.address }
        ),
        "ERC20: insufficient allowance"
      );

      await expectRevert(
        cheel.mint(
          varybadguy,
          parseEther("1000"),
          { from: cheelGnosis.address }
        ),
        "Recipient in common blacklist"
      );

      await expectRevert(
        treasury.withdraw(
          101,
          10000,
          varybadguy,
          timestamp,
          1,
          signature,
          { from: varybadguy }
        ),
        "Recipient in common blacklist"
      );
    });

    it("adding new token", async function () {
      const domain = TrTokenSig.eip712Domain(treasury.address, (await ethers.provider.getNetwork()).chainId)
      const timestamp = await currentTimestamp() + 1000
      const signatureSigner = await ethers.getImpersonatedSigner(deployer)
      const signature = await signatureSigner._signTypedData(domain, TrTokenSig.Pass, {nonce: 3, amount: 10000, address_to: deployer, ttl: timestamp, option: 3})
      const signature2 = await signatureSigner._signTypedData(domain, TrTokenSig.Pass, {nonce: 4, amount: 1000000000000000, address_to: deployer, ttl: timestamp, option: 3})

      const newTokenTest = await CHEEL.new({ from: deployer });

      await newTokenTest.initialize(
        "NFT Test Token",
        "NTT",
        100000,
        commonBlacklist.address,
        testmultisig,
        { from: deployer }
      );

      result = await treasury.addToken(
        newTokenTest.address,
        100000,
        { from: treasuryGnosis.address }
      );

      expectEvent(result, "AddToken", {
        addr: newTokenTest.address,
        limit: "100000",
      });

      await newTokenTest.mint(
        treasury.address,
        parseEther("100000"),
        { from: testmultisig }
      );

      result = await treasury.withdraw(
        3,
        10000,
        deployer,
        timestamp,
        3,
        signature,
        { from: deployer }
      );

      expectEvent(result, "Withdrawed", {
        user: deployer,
        amount: "10000",
        option: "3",
      });

      await expectRevert(
        treasury.withdraw(
          4,
          1000000000000000,
          deployer,
          timestamp,
          3,
          signature2,
          { from: deployer }
        ),
        "Amount greater than allowed"
      );
    });

    it("USDT withdraw", async function () {
      result = await treasury.withdrawToken(
        usdt.address,
        100,
        { from: treasuryGnosis.address }
      );

      expectEvent(result, "WithdrawToken", {
        token: usdt.address,
        amount: "100",
      });

      await expectRevert(
        treasury.withdrawToken(
          usdt.address,
          100,
          { from: deployer }
        ),
        "Ownable: caller is not the owner"
      );
    });
  });
});

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
  NFTGlassesConfig
} from '../config/ContractsConfig';
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {currentTimestamp} from "../utils/helpers";
import * as Sale from "./SaleEIP712";

const CHEEL = artifacts.require("./CHEEL.sol");
const LEE = artifacts.require("./CHEEL.sol");
const NFT = artifacts.require("./NFT.sol");
const NFTSale = artifacts.require("./NFTSale.sol");
const Treasury = artifacts.require("./Treasury.sol");
const CommonBlacklist = artifacts.require("./CommonBlacklist.sol");
const MockERC20 = artifacts.require("./test/MockERC20.sol");


contract(NFTGlassesConfig.contractName, ([deployer, receiver, badguy, moderator, varybadguy]) => {
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
  let blacklistGnosis: SignerWithAddress;
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
      nftGlasses.address,
      nftCases.address,
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
    blacklistGnosis = await ethers.getImpersonatedSigner(CommonBlacklistConfig.multiSigAddress)
    await etherHolder.sendTransaction({
      to: NFTGlassesConfig.multiSigAddress,
      value: ethers.utils.parseEther("1")
    })
    await etherHolder.sendTransaction({
      to: NFTCasesConfig.multiSigAddress,
      value: ethers.utils.parseEther("1")
    })
    await etherHolder.sendTransaction({
      to: CommonBlacklistConfig.multiSigAddress,
      value: ethers.utils.parseEther("1")
    })
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
        String(await nftGlasses.balanceOf(nftGlassesGnosis.address)),
        ("1").toString()
      );
    });

    it("purchase nft", async function () {
      const domain = Sale.eip712Domain(nftSaleGlasses.address, (await ethers.provider.getNetwork()).chainId)
      const timestamp = await currentTimestamp() + 1000
      const signature = await nftGlassesGnosis._signTypedData(domain, Sale.Pass, {id: 1, address_to: deployer, ttl_timestamp: timestamp})

      result = await nftSaleGlasses.purchase(
        1,
        timestamp,
        signature,
        {
          from: deployer,
          value: price
        }
      );

      expectEvent(result, "ReceiveNFT", {
        receiver: deployer,
        tokenId: "0",
      });

    });
  });
});

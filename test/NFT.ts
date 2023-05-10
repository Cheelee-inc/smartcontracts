import {assert, expect} from "chai";
import {
  expectRevert,
  constants,
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
import {Contract} from "ethers";
import {
  deployCHEEL,
  deployCommonBlacklist,
  deployLEE,
  deployNFT,
  deployNFTSale,
  deployTreasury
} from "../utils/deployContracts";

const MockERC20 = artifacts.require("./test/MockERC20.sol");

contract(NFTGlassesConfig.contractName, () => {
  let commonBlacklist: Contract;
  let cheel: Contract;
  let lee: Contract;
  let nftGlasses: Contract;
  let nftCases: Contract;
  let nftSaleGlasses: Contract;
  let nftSaleCases: Contract;
  let treasury: Contract;
  let usdt: Contract;
  let nftGlassesGnosis: SignerWithAddress;
  let nftCasesGnosis: SignerWithAddress;
  let cheelGnosis: SignerWithAddress;
  let leeGnosis: SignerWithAddress;
  let blacklistGnosis: SignerWithAddress;
  let nftSaleGnosis: SignerWithAddress;
  let treasuryGnosis: SignerWithAddress;
  let etherHolder: SignerWithAddress;
  let deployer: SignerWithAddress;
  let receiver: SignerWithAddress;
  let badguy: SignerWithAddress;
  let moderator: SignerWithAddress;
  let verybadguy: SignerWithAddress;
  let tester: SignerWithAddress;
  let BLACKLIST_OPERATOR_ROLE: string;
  let result: any;
  let resultWaited: any;
  const price = parseEther("1");
  const testBaseURI = "ipfs://ipfs/";

  before(async () => {
    // Create users
    [etherHolder, deployer, receiver, badguy, moderator, verybadguy, tester] = await ethers.getSigners()

    // Deploy Common Blacklist
    commonBlacklist = await deployCommonBlacklist();

    // Deploy CHEEL
    cheel = await deployCHEEL();

    // Deploy LEE
    lee = await deployLEE();

    // Deploy NFT Glasses
    nftGlasses = await deployNFT(NFTGlassesConfig.nftName, NFTGlassesConfig.nftSymbol);

    // Deploy NFT Cases
    nftCases = await deployNFT(NFTCasesConfig.nftName, NFTCasesConfig.nftSymbol);

    // Deploy NFT SALE for Glasses
    nftSaleGlasses = await deployNFTSale(
      nftGlasses.address,
      deployer.address,
      price,
      1000,
      1000,
    );

    // Deploy NFT SALE for Cases
    nftSaleCases = await deployNFTSale(
      nftCases.address,
      deployer.address,
      price,
      1000,
      1000,
    );

    // Deploy USDT
    usdt = await MockERC20.new('Tether token', 'USDT', 10000, { from: deployer.address });

    // Deploy Treasury
    treasury = await deployTreasury(
      nftCases.address,
      nftGlasses.address,
      deployer.address,
      lee.address,
      cheel.address,
      usdt.address,
    );

    // Creating GNOSIS
    nftGlassesGnosis = await ethers.getImpersonatedSigner(NFTGlassesConfig.multiSigAddress)
    nftCasesGnosis = await ethers.getImpersonatedSigner(NFTGlassesConfig.multiSigAddress)
    cheelGnosis = await ethers.getImpersonatedSigner(CHEELConfig.multiSigAddress)
    leeGnosis = await ethers.getImpersonatedSigner(LEEConfig.multiSigAddress)
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
      to: LEEConfig.multiSigAddress,
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

    BLACKLIST_OPERATOR_ROLE = await commonBlacklist.BLACKLIST_OPERATOR_ROLE();
  });

  describe("Normal cases:", async () => {
    it("Setting blacklist", async function () {
      await nftGlasses.connect(nftGlassesGnosis).setBlacklist(commonBlacklist.address);
      await nftCases.connect(nftCasesGnosis).setBlacklist(commonBlacklist.address);
      await cheel.connect(cheelGnosis).setBlacklist(commonBlacklist.address);
      await lee.connect(leeGnosis).setBlacklist(commonBlacklist.address);
    });

    it("Setting nft BASE URI", async function () {
      await nftGlasses.connect(nftGlassesGnosis).setUri(
        testBaseURI
      );

      await nftCases.connect(nftCasesGnosis).setUri(
        testBaseURI
      );
    });

    it("Setting nft sale and treasury contracts", async function () {
      await nftGlasses.connect(nftGlassesGnosis).setNftSaleAndTreasury(
        nftSaleGlasses.address,
        treasury.address
      );

      await nftCases.connect(nftCasesGnosis).setNftSaleAndTreasury(
        nftSaleCases.address,
        treasury.address
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
      await usdt.transfer(receiver.address, 1000, { from: deployer.address });
      await usdt.transfer(badguy.address, 1000, { from: deployer.address });
      await usdt.transfer(moderator.address, 1000, { from: deployer.address });
      await usdt.transfer(verybadguy.address, 1000, { from: deployer.address });
      await usdt.transfer(treasury.address, 1000, { from: deployer.address });
    });
  });

  describe("Tokens can be claimed:", async () => {
    it("Only nft owner can mint nft", async function () {
      result = await nftGlasses.connect(nftGlassesGnosis).safeMint(
        nftGlassesGnosis.address,
        0
      );
      resultWaited = await result.wait();

      expect(resultWaited.events[0].args.to).to.equal(nftGlassesGnosis.address);
      expect(resultWaited.events[0].args.tokenId).to.equal("0");

      await expectRevert(
        nftGlasses.connect(deployer).safeMint(
          deployer.address,
          1
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
      const signatureSigner = await ethers.getImpersonatedSigner(deployer.address)
      const signature = await signatureSigner._signTypedData(domain, Sale.Pass, {id: 1, address_to: deployer.address, ttl_timestamp: timestamp})
      const signature2 = await signatureSigner._signTypedData(domain, Sale.Pass, {id: 2, address_to: receiver.address, ttl_timestamp: timestamp})

      await nftSaleGlasses.connect(deployer).purchase(
        1,
        timestamp,
        signature,
        {
          value: price
        }
      );

      assert.equal(
        String(await nftGlasses.balanceOf(deployer.address)),
        "1"
      );

      await expectRevert(
        nftSaleGlasses.connect(deployer).purchase(
          1,
          timestamp,
          signature,
          {
            value: price
          }
        ),
        "Can buy only once"
      );

      await expectRevert(
        nftSaleGlasses.connect(receiver).purchase(
          2,
          timestamp,
          signature2,
          {
            value: parseEther("0.1")
          }
        ),
        "Price not correct"
      );

      await expectRevert(
        nftSaleGlasses.connect(receiver).purchase(
          2,
          timestamp,
          signature2,
          {
            value: parseEther("2")
          }
        ),
        "Price not correct"
      );

      await expectRevert(
        nftSaleGlasses.connect(receiver).purchase(
          2,
          timestamp + 1,
          signature2,
          {
            value: price
          }
        ),
        "Bad signature"
      );

      await nftSaleGlasses.connect(receiver).purchase(
        2,
        timestamp,
        signature2,
        {
          value: price
        }
      );

      assert.equal(
        String(await nftGlasses.balanceOf(receiver.address)),
        "1"
      );
    });

    it("granting role for moderator in blacklist contract", async function () {
      result = await commonBlacklist.connect(blacklistGnosis).grantRole(
        BLACKLIST_OPERATOR_ROLE,
        moderator.address
      );
      resultWaited = await result.wait();

      expect(resultWaited.events[0].args.role).to.equal(BLACKLIST_OPERATOR_ROLE);
      expect(resultWaited.events[0].args.account).to.equal(moderator.address);

      assert.equal(await commonBlacklist.hasRole(BLACKLIST_OPERATOR_ROLE, moderator.address), true);

    });

    it("adding verybadguy for Global Blacklist", async function () {
      const domain = Sale.eip712Domain(nftSaleGlasses.address, (await ethers.provider.getNetwork()).chainId)
      const timestamp = await currentTimestamp() + 1000
      const signatureSigner = await ethers.getImpersonatedSigner(deployer.address)
      const signature = await signatureSigner._signTypedData(domain, Sale.Pass, {id: 4, address_to: verybadguy.address, ttl_timestamp: timestamp})

      await commonBlacklist.connect(moderator).addUsersToBlacklist(
        [verybadguy.address]
      );

      assert.equal(await commonBlacklist.userIsBlacklisted(badguy.address, constants.ZERO_ADDRESS, constants.ZERO_ADDRESS), false);
      assert.equal(await commonBlacklist.userIsBlacklisted(verybadguy.address, constants.ZERO_ADDRESS, constants.ZERO_ADDRESS), true);
      assert.equal(await commonBlacklist.userIsBlacklisted(deployer.address, constants.ZERO_ADDRESS, constants.ZERO_ADDRESS), false);

      await expectRevert(
        nftSaleGlasses.connect(verybadguy).purchase(
          4,
          timestamp,
          signature,
          {
            value: price
          }
        ),
        "NFT: Blocked by global blacklist"
      );

      await commonBlacklist.connect(moderator).removeUsersFromBlacklist(
        [verybadguy.address]
      );

      await nftSaleGlasses.connect(verybadguy).purchase(
        4,
        timestamp,
        signature,
        {
          value: price
        }
      );

      assert.equal(
        String(await nftGlasses.balanceOf(verybadguy.address)),
        "1"
      );

      await commonBlacklist.connect(moderator).addUsersToBlacklist(
        [verybadguy.address]
      );
    });

    it("adding badguy for Internal Blacklist for glasses nft", async function () {
      const domain = Sale.eip712Domain(nftSaleGlasses.address, (await ethers.provider.getNetwork()).chainId)
      const timestamp = await currentTimestamp() + 1000
      const signatureSigner = await ethers.getImpersonatedSigner(deployer.address)
      const signature = await signatureSigner._signTypedData(domain, Sale.Pass, {id: 5, address_to: badguy.address, ttl_timestamp: timestamp})

      await commonBlacklist.connect(moderator).addUsersToInternalBlacklist(
        nftGlasses.address,
        [badguy.address]
      );

      assert.equal(await commonBlacklist.userIsInternalBlacklisted(nftGlasses.address, badguy.address, constants.ZERO_ADDRESS, constants.ZERO_ADDRESS), true);
      assert.equal(await commonBlacklist.userIsInternalBlacklisted(nftGlasses.address, deployer.address, constants.ZERO_ADDRESS, constants.ZERO_ADDRESS), false);

      await expectRevert(
        nftSaleGlasses.connect(badguy).purchase(
          5,
          timestamp,
          signature,
          {
            value: price
          }
        ),
        "NFT: Blocked by internal blacklist"
      );

      await commonBlacklist.connect(moderator).removeUsersFromInternalBlacklist(
        nftGlasses.address,
        [badguy.address]
      );

      assert.equal(await commonBlacklist.userIsInternalBlacklisted(nftGlasses.address, badguy.address, constants.ZERO_ADDRESS, constants.ZERO_ADDRESS), false);

      await nftSaleGlasses.connect(badguy).purchase(
        5,
        timestamp,
        signature,
        {
          value: price
        }
      );

      assert.equal(
        String(await nftGlasses.balanceOf(badguy.address)),
        String(await nftGlasses.balanceOf(receiver.address)),
        "1"
      );

      await commonBlacklist.connect(moderator).addUsersToInternalBlacklist(
        nftGlasses.address,
        [badguy.address]
      );
    });

    it("setting out of stock", async function () {
      const domain = Sale.eip712Domain(nftSaleGlasses.address, (await ethers.provider.getNetwork()).chainId)
      const timestamp = await currentTimestamp() + 1000
      const signatureSigner = await ethers.getImpersonatedSigner(deployer.address)
      const signature3 = await signatureSigner._signTypedData(domain, Sale.Pass, {id: 6, address_to: moderator.address, ttl_timestamp: timestamp})

      await expectRevert(
        nftSaleGlasses.connect(deployer).setPurchaseSupply(
          0
        ),
        "Ownable: caller is not the owner"
      );

      await nftSaleGlasses.connect(nftSaleGnosis).setPurchaseSupply(
        0
      );

      await expectRevert(
        nftSaleGlasses.connect(moderator).purchase(
          6,
          timestamp,
          signature3,
          {
            value: price
          }
        ),
        "Out of stock"
      );

      await nftSaleGlasses.connect(nftSaleGnosis).setPurchaseSupply(
        1000
      );

      await nftSaleGlasses.connect(moderator).purchase(
        6,
        timestamp,
        signature3,
        {
          value: price
        }
      );

      assert.equal(
        String(await nftGlasses.balanceOf(moderator.address)),
        "1"
      );
    });

    it("setting new price", async function () {
      const domain = Sale.eip712Domain(nftSaleGlasses.address, (await ethers.provider.getNetwork()).chainId)
      const timestamp = await currentTimestamp() + 1000
      const signatureSigner = await ethers.getImpersonatedSigner(deployer.address)
      const signature4 = await signatureSigner._signTypedData(domain, Sale.Pass, {id: 7, address_to: tester.address, ttl_timestamp: timestamp})

      await expectRevert(
        nftSaleGlasses.connect(deployer).setPrice(
          parseEther("2")
        ),
        "Ownable: caller is not the owner"
      );

      await nftSaleGlasses.connect(nftSaleGnosis).setPrice(
        parseEther("2")
      );

      await expectRevert(
        nftSaleGlasses.connect(tester).purchase(
          7,
          timestamp,
          signature4,
          {
            value: price
          }
        ),
        "Price not correct"
      );

      await nftSaleGlasses.connect(tester).purchase(
        7,
        timestamp,
        signature4,
        {
          value: parseEther("2")
        }
      );

      assert.equal(
        String(await nftGlasses.balanceOf(tester.address)),
        "1"
      );

      await nftSaleGlasses.connect(nftSaleGnosis).setPrice(
        price
      );
    });
  });

  describe("Redeem testing", async () => {
    it("Testing Redeem", async function () {
      const domain = Redeem.eip712Domain(nftSaleGlasses.address, (await ethers.provider.getNetwork()).chainId)
      const timestamp = await currentTimestamp() + 1000
      const signatureSigner = await ethers.getImpersonatedSigner(deployer.address)
      const signature = await signatureSigner._signTypedData(domain, Redeem.Pass, {id: 8, address_to: deployer.address, ttl_timestamp: timestamp})
      const signature2 = await signatureSigner._signTypedData(domain, Redeem.Pass, {id: 9, address_to: badguy.address, ttl_timestamp: timestamp})
      const signature3 = await signatureSigner._signTypedData(domain, Redeem.Pass, {id: 10, address_to: verybadguy.address, ttl_timestamp: timestamp})

      await nftSaleGlasses.connect(deployer).redeem(
        8,
        timestamp,
        signature
      );

      assert.equal(
        String(await nftGlasses.balanceOf(deployer.address)),
        "2"
      );

      await expectRevert(
        nftSaleGlasses.connect(badguy).redeem(
          9,
          timestamp,
          signature2
        ),
        "NFT: Blocked by internal blacklist"
      );

      await expectRevert(
        nftSaleGlasses.connect(verybadguy).redeem(
          10,
          timestamp,
          signature3
        ),
        "NFT: Blocked by global blacklist"
      );
    });

    it("Testing out of stock", async function () {
      const domain = Redeem.eip712Domain(nftSaleGlasses.address, (await ethers.provider.getNetwork()).chainId)
      const timestamp = await currentTimestamp() + 1000
      const signatureSigner = await ethers.getImpersonatedSigner(deployer.address)
      const signature2 = await signatureSigner._signTypedData(domain, Redeem.Pass, {id: 9, address_to: receiver.address, ttl_timestamp: timestamp})

      await expectRevert(
        nftSaleGlasses.connect(deployer).setRedeemSupply(
          0
        ),
        "Ownable: caller is not the owner"
      );

      await nftSaleGlasses.connect(nftSaleGnosis).setRedeemSupply(
        0
      );

      await expectRevert(
        nftSaleGlasses.connect(receiver).redeem(
          9,
          timestamp,
          signature2
        ),
        "Out of stock"
      );

      await nftSaleGlasses.connect(nftSaleGnosis).setRedeemSupply(
        1000
      );

      await nftSaleGlasses.connect(receiver).redeem(
        9,
        timestamp,
        signature2
      );

      assert.equal(
        String(await nftGlasses.balanceOf(receiver.address)),
        "2"
      );
    });

    it("Testing pausing", async function () {
      const domain = Redeem.eip712Domain(nftSaleGlasses.address, (await ethers.provider.getNetwork()).chainId)
      const timestamp = await currentTimestamp() + 1000
      const signatureSigner = await ethers.getImpersonatedSigner(deployer.address)
      const signature3 = await signatureSigner._signTypedData(domain, Redeem.Pass, {id: 10, address_to: moderator.address, ttl_timestamp: timestamp})

      await expectRevert(
        nftSaleGlasses.connect(deployer).pauseRedeem(),
        "Ownable: caller is not the owner"
      );

      await nftSaleGlasses.connect(nftSaleGnosis).pauseRedeem();

      await expectRevert(
        nftSaleGlasses.connect(moderator).redeem(
          10,
          timestamp,
          signature3
        ),
        "Redeeming paused"
      );

      await nftSaleGlasses.connect(nftSaleGnosis).pauseRedeem();

      await nftSaleGlasses.connect(moderator).redeem(
        10,
        timestamp,
        signature3
      );

      assert.equal(
        String(await nftGlasses.balanceOf(moderator.address)),
        "2"
      );
    });

    it("Testing withdrow", async function () {
      await expectRevert(
        nftSaleGlasses.connect(deployer).withdraw(),
        "Ownable: caller is not the owner"
      );

      result = await nftSaleGlasses.connect(nftSaleGnosis).withdraw();
      resultWaited = await result.wait();

      expect(resultWaited.events[0].args.amount).to.equal(parseEther("7").toString());
    });
  });

  describe("Treasury", async () => {
    it("mint nft from treasury", async function () {
      const domain = TrNftSig.eip712Domain(treasury.address, (await ethers.provider.getNetwork()).chainId)
      const timestamp = await currentTimestamp() + 1000
      const signatureSigner = await ethers.getImpersonatedSigner(deployer.address)
      const signature = await signatureSigner._signTypedData(domain, TrNftSig.Pass, {nonce: 8, id: 11, address_to: deployer.address, ttl: timestamp, option: 1})
      const signature2 = await signatureSigner._signTypedData(domain, TrNftSig.Pass, {nonce: 9, id: 12, address_to: badguy.address, ttl: timestamp, option: 1})
      const signature3 = await signatureSigner._signTypedData(domain, TrNftSig.Pass, {nonce: 10, id: 13, address_to: verybadguy.address, ttl: timestamp, option: 1})

      result = await treasury.connect(deployer).withdrawNFT(
        8,
        11,
        deployer.address,
        timestamp,
        1,
        signature
      );
      resultWaited = await result.wait();
      expect(resultWaited.events[2].args.user).to.equal(deployer.address);
      expect(resultWaited.events[2].args.id).to.equal("11");
      expect(resultWaited.events[2].args.option).to.equal("1");

      assert.equal(
        String(await nftGlasses.balanceOf(deployer.address)),
        "3"
      );

      await expectRevert(
        treasury.connect(badguy).withdrawNFT(
          9,
          12,
          badguy.address,
          timestamp,
          1,
          signature2
        ),
        "NFT: Blocked by internal blacklist"
      );

      await expectRevert(
        treasury.connect(verybadguy).withdrawNFT(
          10,
          13,
          verybadguy.address,
          timestamp,
          1,
          signature3
        ),
        "NFT: Blocked by global blacklist"
      );
    });

    it("send nft to treasury", async function () {
      await nftGlasses.connect(deployer).transferFrom(
        deployer.address,
        treasury.address,
        11
      );

      assert.equal(
        String(await nftGlasses.balanceOf(deployer.address)),
        "2"
      );

      await expectRevert(
        nftGlasses.connect(verybadguy).transferFrom(
          verybadguy.address,
          treasury.address,
          4
        ),
        "NFT: Blocked by global blacklist"
      );

      await expectRevert(
        nftGlasses.connect(badguy).transferFrom(
          badguy.address,
          treasury.address,
          5
        ),
        "NFT: Blocked by internal blacklist"
      );
    });

    it("withdraw nft from treasury", async function () {
      const domain = TrNftSig.eip712Domain(treasury.address, (await ethers.provider.getNetwork()).chainId)
      const timestamp = await currentTimestamp() + 1000
      const signatureSigner = await ethers.getImpersonatedSigner(deployer.address)
      const signature = await signatureSigner._signTypedData(domain, TrNftSig.Pass, {nonce: 9, id: 11, address_to: deployer.address, ttl: timestamp, option: 1})

      result = await treasury.connect(deployer).withdrawNFT(
        9,
        11,
        deployer.address,
        timestamp,
        1,
        signature
      );
      resultWaited = await result.wait();
      expect(resultWaited.events[3].args.user).to.equal(deployer.address);
      expect(resultWaited.events[3].args.id).to.equal("11");
      expect(resultWaited.events[3].args.option).to.equal("1");

      assert.equal(
        String(await nftGlasses.balanceOf(deployer.address)),
        "3"
      );
    });

    it("day limits included", async function () {
      const domain = TrNftSig.eip712Domain(treasury.address, (await ethers.provider.getNetwork()).chainId)
      const timestamp = await currentTimestamp() + 1000
      const signatureSigner = await ethers.getImpersonatedSigner(deployer.address)
      const signature = await signatureSigner._signTypedData(domain, TrNftSig.Pass, {nonce: 10, id: 11, address_to: deployer.address, ttl: timestamp, option: 1})

      result = await treasury.connect(treasuryGnosis).setNftLimit(
        1,
        2
      );
      resultWaited = await result.wait();

      expect(resultWaited.events[0].args.index).to.equal("1");
      expect(resultWaited.events[0].args.newLimit).to.equal("2");

      await nftGlasses.connect(deployer).transferFrom(
        deployer.address,
        treasury.address,
        11
      );

      await expectRevert(
        treasury.connect(deployer).withdrawNFT(
          10,
          11,
          deployer.address,
          timestamp,
          1,
          signature
        ),
        "Too many transfers"
      );

      result = await treasury.connect(treasuryGnosis).setNftLimit(
        1,
        3
      );
      resultWaited = await result.wait();

      expect(resultWaited.events[0].args.index).to.equal("1");
      expect(resultWaited.events[0].args.newLimit).to.equal("3");

      result = await treasury.connect(deployer).withdrawNFT(
        10,
        11,
        deployer.address,
        timestamp,
        1,
        signature
      );
      resultWaited = await result.wait();

      expect(resultWaited.events[3].args.user).to.equal(deployer.address);
      expect(resultWaited.events[3].args.id).to.equal("11");
      expect(resultWaited.events[3].args.option).to.equal("1");
    });

    it("getting actual transfers per day", async function () {
      const currentDay = await treasury.getCurrentDay();

      result = await treasury.connect(treasuryGnosis).nftTransfersPerDay(
        deployer.address,
        currentDay,
        1
      );

      assert.equal(
        String(result),
        "3"
      );
    });

    it("Adding new NFT", async function () {
      const domain = TrNftSig.eip712Domain(treasury.address, (await ethers.provider.getNetwork()).chainId)
      const timestamp = await currentTimestamp() + 1000
      const signatureSigner = await ethers.getImpersonatedSigner(deployer.address)
      const signature = await signatureSigner._signTypedData(domain, TrNftSig.Pass, {nonce: 11, id: 12, address_to: deployer.address, ttl: timestamp, option: 2})
      const signature2 = await signatureSigner._signTypedData(domain, TrNftSig.Pass, {nonce: 12, id: 13, address_to: deployer.address, ttl: timestamp, option: 2})
      const signature3 = await signatureSigner._signTypedData(domain, TrNftSig.Pass, {nonce: 12, id: 13, address_to: deployer.address, ttl: timestamp, option: 2})

      const newNftTest = await deployNFT("NFT Test NFT", "NTN");

      const newNftSaleTest = await deployNFTSale(
        newNftTest.address,
        deployer.address,
        price,
        1000,
        1000,
      );

      result = await newNftTest.connect(nftGlassesGnosis).setNftSaleAndTreasury(
        newNftSaleTest.address,
        treasury.address
      );
      resultWaited = await result.wait();

      expect(resultWaited.events[0].args.sale).to.equal(newNftSaleTest.address);
      expect(resultWaited.events[0].args.treasury).to.equal(treasury.address);

      result = await treasury.connect(treasuryGnosis).addNFT(
        newNftTest.address,
        2
      );
      resultWaited = await result.wait();

      expect(resultWaited.events[0].args.addr).to.equal(newNftTest.address);
      expect(resultWaited.events[0].args.limit).to.equal("2");

      result = await treasury.connect(deployer).withdrawNFT(
        11,
        12,
        deployer.address,
        timestamp,
        2,
        signature
      );
      resultWaited = await result.wait();

      expect(resultWaited.events[2].args.user).to.equal(deployer.address);
      expect(resultWaited.events[2].args.id).to.equal("12");
      expect(resultWaited.events[2].args.option).to.equal("2");

      await newNftTest.connect(deployer).transferFrom(
        deployer.address,
        treasury.address,
        12
      );

      result = await treasury.connect(deployer).withdrawNFT(
        12,
        13,
        deployer.address,
        timestamp,
        2,
        signature2
      );
      resultWaited = await result.wait();

      expect(resultWaited.events[2].args.user).to.equal(deployer.address);
      expect(resultWaited.events[2].args.id).to.equal("13");
      expect(resultWaited.events[2].args.option).to.equal("2");

      await newNftTest.connect(deployer).transferFrom(
        deployer.address,
        treasury.address,
        13
      );

      await expectRevert(
        treasury.connect(deployer).withdrawNFT(
          12,
          13,
          deployer.address,
          timestamp,
          2,
          signature3
        ),
        "Too many transfers"
      );
    });
  });

  describe("Getting information about the presence of users from the list in the blacklist", async () => {
    it("Only internal blacklisted user", async function () {
      result = await commonBlacklist.connect(receiver).usersFromListIsBlacklisted(
        nftGlasses.address,
        [deployer.address, receiver.address, badguy.address]
      );

      assert.equal(
        result.toString(),
        [badguy.address].toString()
      );
    });

    it("Internal and global blacklisted user", async function () {
      result = await commonBlacklist.connect(verybadguy).usersFromListIsBlacklisted(
        nftGlasses.address,
        [deployer.address, receiver.address, badguy.address, verybadguy.address]
      );

      assert.equal(
        result.toString(),
        [badguy.address, verybadguy.address].toString()
      );
    });

    it("internal user is global blacklisted", async function () {
      result = await commonBlacklist.connect(deployer).usersFromListIsBlacklisted(
        constants.ZERO_ADDRESS,
        [deployer.address, receiver.address, badguy.address, verybadguy.address]
      );

      assert.equal(
        result.toString(),
        [verybadguy.address].toString()
      );
    });
  });

  describe("Tokens disabling", async () => {
    it("Testing disabling NFT", async function () {
      const domain = TrNftSig.eip712Domain(treasury.address, (await ethers.provider.getNetwork()).chainId)
      const timestamp = await currentTimestamp() + 1000
      const signatureSigner = await ethers.getImpersonatedSigner(deployer.address)
      const signature = await signatureSigner._signTypedData(domain, TrNftSig.Pass, {
        nonce: 20,
        id: 11,
        address_to: deployer.address,
        ttl: timestamp,
        option: 1
      })

      await nftGlasses.connect(deployer).transferFrom(
        deployer.address,
        treasury.address,
        11
      );

      result = await treasury.connect(treasuryGnosis).disableNFT(
        1
      );
      resultWaited = await result.wait();

      expect(resultWaited.events[0].args.index).to.equal("1");

      await expectRevert(
        treasury.connect(deployer).withdrawNFT(
          20,
          11,
          deployer.address,
          timestamp,
          1,
          signature
        ),
        "Option disabled"
      );
    });
  });

  describe("Tokens testing", async () => {
    it("mint and withdraw cheel tokens from treasury", async function () {
      const domain = TrTokenSig.eip712Domain(treasury.address, (await ethers.provider.getNetwork()).chainId)
      const timestamp = await currentTimestamp() + 1000
      const signatureSigner = await ethers.getImpersonatedSigner(deployer.address)
      const signature = await signatureSigner._signTypedData(domain, TrTokenSig.Pass, {nonce: 1, amount: 10000, address_to: deployer.address, ttl: timestamp, option: 1})

      await cheel.connect(cheelGnosis).mint(
        treasury.address,
        parseEther("100000")
      );

      result = await treasury.connect(deployer).withdraw(
        1,
        10000,
        deployer.address,
        timestamp,
        1,
        signature
      );
      resultWaited = await result.wait();

      expect(resultWaited.events[1].args.user).to.equal(deployer.address);
      expect(resultWaited.events[1].args.amount).to.equal("10000");
      expect(resultWaited.events[1].args.option).to.equal("1");
    });

    it("General Blacklist", async function () {
      const domain = TrTokenSig.eip712Domain(treasury.address, (await ethers.provider.getNetwork()).chainId)
      const timestamp = await currentTimestamp() + 1000
      const signatureSigner = await ethers.getImpersonatedSigner(deployer.address)
      const signature = await signatureSigner._signTypedData(domain, TrTokenSig.Pass, {nonce: 101, amount: 10000, address_to: verybadguy.address, ttl: timestamp, option: 1})

      await expectRevert(
        cheel.connect(cheelGnosis).transferFrom(
          verybadguy.address,
          deployer.address,
          parseEther("1000000")
        ),
        "ERC20: insufficient allowance"
      );

      await expectRevert(
        cheel.connect(cheelGnosis).mint(
          verybadguy.address,
          parseEther("1000")
        ),
        "CHEEL: Blocked by global blacklist"
      );

      await expectRevert(
        treasury.connect(verybadguy).withdraw(
          101,
          10000,
          verybadguy.address,
          timestamp,
          1,
          signature
        ),
        "CHEEL: Blocked by global blacklist"
      );
    });

    it("adding new token", async function () {
      const domain = TrTokenSig.eip712Domain(treasury.address, (await ethers.provider.getNetwork()).chainId)
      const timestamp = await currentTimestamp() + 1000
      const signatureSigner = await ethers.getImpersonatedSigner(deployer.address)
      const signature = await signatureSigner._signTypedData(domain, TrTokenSig.Pass, {nonce: 3, amount: 10000, address_to: deployer.address, ttl: timestamp, option: 3})
      const signature2 = await signatureSigner._signTypedData(domain, TrTokenSig.Pass, {nonce: 4, amount: 1000000000000000, address_to: deployer.address, ttl: timestamp, option: 3})

      const newTokenTest = await deployCHEEL();

      result = await treasury.connect(treasuryGnosis).addToken(
        newTokenTest.address,
        100000
      );
      resultWaited = await result.wait();

      expect(resultWaited.events[0].args.addr).to.equal(newTokenTest.address);
      expect(resultWaited.events[0].args.limit).to.equal("100000");

      await newTokenTest.connect(cheelGnosis).mint(
        treasury.address,
        parseEther("100000")
      );

      result = await treasury.connect(deployer).withdraw(
        3,
        10000,
        deployer.address,
        timestamp,
        3,
        signature
      );
      resultWaited = await result.wait();

      expect(resultWaited.events[1].args.user).to.equal(deployer.address);
      expect(resultWaited.events[1].args.amount).to.equal("10000");
      expect(resultWaited.events[1].args.option).to.equal("3");

      await expectRevert(
        treasury.connect(deployer).withdraw(
          4,
          1000000000000000,
          deployer.address,
          timestamp,
          3,
          signature2
        ),
        "Amount greater than allowed"
      );
    });

    it("tokens Owned By User", async function () {
      assert.equal(
        String(await nftGlasses.tokensOwnedByUser(deployer.address)),
        "1,8"
      );
    });

    it("USDT withdraw", async function () {
      result = await treasury.connect(treasuryGnosis).withdrawToken(
        usdt.address,
        100
      );
      resultWaited = await result.wait();

      expect(resultWaited.events[1].args.token).to.equal(usdt.address);
      expect(resultWaited.events[1].args.amount).to.equal("100");

      await expectRevert(
        treasury.connect(deployer).withdrawToken(
          usdt.address,
          100
        ),
        "Ownable: caller is not the owner"
      );
    });
  });
});

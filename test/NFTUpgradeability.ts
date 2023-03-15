import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  expectRevert,
  constants,
  // @ts-ignore
} from "@openzeppelin/test-helpers";
import {contract, ethers, upgrades} from "hardhat";
import {deployCommonBlacklist} from "../utils/deployContracts"
import {Contract} from "ethers";
import {CommonBlacklistConfig, NFTGlassesConfig} from "../config/ContractsConfig";
import {assert, expect} from "chai";

contract(`OLD${NFTGlassesConfig.contractName} Upgrade`, () => {
  let oldNft: Contract;
  let nft: Contract;
  let commonBlacklist: Contract;
  let gnosis: SignerWithAddress;
  let blacklistGnosis: SignerWithAddress;
  let etherHolder: SignerWithAddress;
  let deployer: SignerWithAddress;
  let receiver: SignerWithAddress;
  let badguy: SignerWithAddress;
  let moderator: SignerWithAddress;
  let BLACKLIST_OPERATOR_ROLE: string;
  let result: any;
  let resultWaited: any;

  before(async () => {
    // Deploy OLDNFT
    const OLDNFT = await ethers.getContractFactory("OLDNFT");
    oldNft = await upgrades.deployProxy(OLDNFT, ["NFT Test NFT", "NTN"], { initializer: "initialize" });
    await oldNft.deployed();

    // Deploy Common Blacklist
    commonBlacklist = await deployCommonBlacklist();

    // Creating GNOSIS
    [etherHolder, deployer, receiver, badguy, moderator] = await ethers.getSigners();
    gnosis = await ethers.getImpersonatedSigner(NFTGlassesConfig.multiSigAddress)
    blacklistGnosis = await ethers.getImpersonatedSigner(CommonBlacklistConfig.multiSigAddress)
    await etherHolder.sendTransaction({
      to: NFTGlassesConfig.multiSigAddress,
      value: ethers.utils.parseEther("1")
    })
    await etherHolder.sendTransaction({
      to: CommonBlacklistConfig.multiSigAddress,
      value: ethers.utils.parseEther("1")
    })

    BLACKLIST_OPERATOR_ROLE = await commonBlacklist.BLACKLIST_OPERATOR_ROLE();
  });

  it("Mint NFT", async() => {
    result = await oldNft.connect(gnosis).safeMint(
      gnosis.address,
      0
    );
    resultWaited = await result.wait();

    expect(resultWaited.events[0].args.to).to.equal(gnosis.address);
    expect(resultWaited.events[0].args.tokenId).to.equal("0");
  })

  it('Upgrade old NFT', async function () {
    let NFT = await ethers.getContractFactory("NFT");

    nft = await upgrades.upgradeProxy(oldNft.address, NFT)
  });

  it("Setting blacklist", async function () {
    await nft.connect(gnosis).setBlacklist(commonBlacklist.address);
  });

  it("Grant BLACKLIST_OPERATOR_ROLE for moderator", async function () {
    await commonBlacklist.connect(blacklistGnosis).grantRole(
      BLACKLIST_OPERATOR_ROLE,
      moderator.address
    );
  });

  it("Adding badguy for common blacklist", async function () {
    expect((await nft.commonBlacklist()).toUpperCase()).to.equal(commonBlacklist.address.toUpperCase());

    await commonBlacklist.connect(moderator).addUsersToBlacklist(
      [badguy.address]
    );

    assert.equal(await commonBlacklist.userIsBlacklisted(badguy.address, constants.ZERO_ADDRESS, constants.ZERO_ADDRESS), true);
  });

  it("New function added works", async() => {
    await expectRevert(
      nft.connect(gnosis).safeMint(
        badguy.address,
        1
      ),
      "NFT: Blocked by global blacklist"
    );
  })

  it("Balancies is correct", async function () {
    assert.equal(
      String(await nft.balanceOf(gnosis.address)),
      "1"
    );
  });
});

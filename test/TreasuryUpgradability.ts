import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { Signer, BigNumber } from "ethers";
import { ethers, upgrades } from "hardhat";
import { NFT, Treasury, TreasuryV2 } from "../typechain";
import { deployLEE, deployNFT } from "../utils/deployContracts"
import { currentTimestamp } from "../utils/helpers"

describe("Test", function () {
  let treasury: Treasury
  let treasuryV2: TreasuryV2
  let timestamp: number
  let addr: string
  let nft: NFT

  beforeEach(async ()=>{
    nft = await deployNFT("name", "version")

    let Treasury = await ethers.getContractFactory("Treasury");
    let TreasuryV2 = await ethers.getContractFactory("TreasuryV2");
    treasury = await upgrades.deployProxy(Treasury, [nft.address, nft.address, nft.address, nft.address, nft.address, nft.address], {initializer: "initialize"}) as Treasury
    treasuryV2 = await upgrades.upgradeProxy(treasury.address, TreasuryV2)
  })

  it("New function added works", async()=>{   
    await treasuryV2.setValue()
    expect(await treasuryV2.getValue()).to.be.equal(42)
  })

});

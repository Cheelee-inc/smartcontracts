import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { Signer, BigNumber } from "ethers";
import { ethers } from "hardhat";
import { deployLEE, deployNFT, deployNFTSale, deployTreasury } from "../utils/deployContracts"
import { currentTimestamp } from "../utils/helpers"
import { NFTSale, NFT, Treasury } from "../typechain";

import * as Sale from "./SaleEIP712" 
import * as Redeem from "./RedeemEIP712" 
import * as TrSig from "./TreasuryEIP712" 

describe("Test", function () {
  let owner: SignerWithAddress
  let user1: SignerWithAddress
  let user2: SignerWithAddress
  let user3: SignerWithAddress
  let nftSale: NFTSale
  let nft: NFT
  let treasury: Treasury
  let timestamp: number
  let price: BigNumber
  let wrongPrice: BigNumber

  before(async () => {
    [owner, user1, user2, user3] = await ethers.getSigners()

    price = ethers.utils.parseEther("1")
    wrongPrice = ethers.utils.parseEther("0.1")
    timestamp = await currentTimestamp() + 1000
  
    nft = await deployNFT("it", "it")
    nftSale = await deployNFTSale(nft.address, owner.address, price, 1000, 1000)
    treasury = await deployTreasury(nft.address, nft.address, owner.address, owner.address, owner.address, owner.address)
    console.log(1);

    console.log("nft: ", nft.address);
    console.log("nftSale: ", nftSale.address);
    console.log("treasury: ", treasury.address);

    console.log("user1: ", user1.address);
    console.log("user2: ", user2.address);
    
    await nft.setNftSaleAndTreasury(nftSale.address, treasury.address)
  })

  async function getSaleSignature(tokenId: any, to: any, ttl: any) {
    let domain = Sale.eip712Domain(nftSale.address, (await ethers.provider.getNetwork()).chainId)
    return await owner._signTypedData(domain, Sale.Pass, {id: tokenId, address_to: to, ttl_timestamp: ttl})
  }

  async function getRedeemSignature(tokenId: any, to: any, ttl: any) {
    let domain = Redeem.eip712Domain(nftSale.address, (await ethers.provider.getNetwork()).chainId)
    return await owner._signTypedData(domain, Redeem.Pass, {id: tokenId, address_to: to, ttl_timestamp: ttl})
  }

  async function getTreasurySignature(nonce: any, tokenId: any, to: any, ttl: any, option: any) {
    let domain = TrSig.eip712Domain(treasury.address, (await ethers.provider.getNetwork()).chainId)
    return await owner._signTypedData(domain, TrSig.Pass, {nonce: nonce, id: tokenId, address_to: to, ttl: ttl, option: option})
  }

  it("purchase & redeem", async () => {
    let sale1 = await getSaleSignature(123, owner.address, timestamp)
    let sale2 = await getSaleSignature(234, user1.address, timestamp)

    let redeem1 = await getRedeemSignature(456, owner.address, timestamp)
    let redeem2 = await getRedeemSignature(567, user1.address, timestamp)

    await nftSale.purchase(123, timestamp, sale1, {value: price})
    expect(await nft.balanceOf(owner.address)).to.be.equal(1);

    await expect(nftSale.purchase(123,timestamp,sale1,{value: price})).to.be.reverted
    await expect(nftSale.purchase(234,timestamp,sale2,{value: wrongPrice})).to.be.reverted
    await expect(nftSale.purchase(234,timestamp+1,sale2,{value: price})).to.be.reverted
    await expect(nftSale.purchase(234,timestamp,sale1,{value: price})).to.be.reverted
    await expect(nftSale.purchase(234,timestamp,sale2,{value: price})).to.be.reverted

    await nftSale.connect(user1).purchase(234, timestamp, sale2, {value: price})
    expect(await nft.balanceOf(user1.address)).to.be.equal(1);

    await nftSale.redeem(456, timestamp, redeem1)
    await nftSale.connect(user1).redeem(567, timestamp, redeem2)
    expect(await nft.balanceOf(owner.address)).to.be.equal(2);
    expect(await nft.balanceOf(user1.address)).to.be.equal(2);
  })

  it("mint and transfer from and to treasury", async () => {
    let id = 132
    let nonce = 123456

    let sig = await getTreasurySignature(nonce, id, owner.address, timestamp, 1)
    await treasury.withdrawNFT(nonce, id, owner.address, timestamp, 1, sig)
    expect(await nft.balanceOf(owner.address)).to.be.equal(3);

    //send to inner wallet
    await nft.transferFrom(owner.address, treasury.address, id)
    //withdraw from inner wallet
    sig = await getTreasurySignature(++nonce, id, owner.address, timestamp, 1)
    await treasury.withdrawNFT(nonce, id, owner.address, timestamp, 1, sig)
    
    //send to inner wallet
    await nft.transferFrom(owner.address, treasury.address, id)
    //withdraw from inner wallet
    sig = await getTreasurySignature(++nonce, id, owner.address, timestamp, 1)
    await treasury.withdrawNFT(nonce, id, owner.address, timestamp, 1, sig)
    expect(await nft.balanceOf(owner.address)).to.be.equal(3);
  }) 
})
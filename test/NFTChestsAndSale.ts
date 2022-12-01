import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { Signer, BigNumber } from "ethers";
import { ethers } from "hardhat";
import { deployCHEEL, deployLEE, deployNFT, deployNFTSale, deployTreasury } from "../utils/deployContracts"
import { currentTimestamp, increaseTimeDays } from "../utils/helpers"
import { NFTSale, NFT, Treasury, CHEEL } from "../typechain";

import * as Sale from "./SaleEIP712" 
import * as Redeem from "./RedeemEIP712" 
import * as TrNftSig from "./TreasuryNftEIP712" 
import * as TrTokenSig from "./TreasuryTokenEIP712"

describe("Test", function () {
  let owner: SignerWithAddress
  let user1: SignerWithAddress
  let user2: SignerWithAddress
  let nftSale: NFTSale
  let nft: NFT
  let treasury: Treasury
  let timestamp: number
  let price: BigNumber
  let wrongPrice: BigNumber
  let erc20: CHEEL

  before(async () => {
    [owner, user1, user2] = await ethers.getSigners()

    price = ethers.utils.parseEther("1")
    wrongPrice = ethers.utils.parseEther("0.1")
    timestamp = await currentTimestamp() + 1000
  
    nft = await deployNFT("it", "it")
    nftSale = await deployNFTSale(nft.address, owner.address, price, 1000, 1000)
    
    erc20 = await deployCHEEL()

    treasury = await deployTreasury(nft.address, nft.address, owner.address, erc20.address, erc20.address, erc20.address)
    await erc20.connect(await getGnosisWithEther(erc20)).mint(treasury.address, "10000000000")

    console.log("nft: ", nft.address);
    console.log("nftSale: ", nftSale.address);
    console.log("treasury: ", treasury.address);

    console.log("user1: ", user1.address);
    console.log("user2: ", user2.address);
    
    await nft.connect(await getGnosisWithEther(nft)).setNftSaleAndTreasury(nftSale.address, treasury.address)
  })

  it("purchase & redeem", async () => {
    let sale1 = await getSaleSignature(123, owner.address, timestamp)
    let sale2 = await getSaleSignature(234, user1.address, timestamp)
    let sale3 = await getSaleSignature(123454321, user2.address, timestamp)

    let redeem1 = await getRedeemSignature(456, owner.address, timestamp)
    let redeem2 = await getRedeemSignature(567, user1.address, timestamp)

    await expect(nftSale.connect(user1).pausePurchase()).to.be.reverted
    await nftSale.connect(await getGnosisWithEther(nftSale)).pausePurchase()
    await expect(nftSale.purchase(123, timestamp, sale1, {value: price})).to.be.reverted
    await nftSale.connect(await getGnosisWithEther(nftSale)).pausePurchase()
    await nftSale.purchase(123, timestamp, sale1, {value: price})

    expect(await nft.balanceOf(owner.address)).to.be.equal(1);

    await expect(nftSale.purchase(123,timestamp,sale1,{value: price})).to.be.reverted
    await expect(nftSale.purchase(234,timestamp,sale2,{value: wrongPrice})).to.be.reverted
    await expect(nftSale.purchase(234,timestamp+1,sale2,{value: price})).to.be.reverted
    await expect(nftSale.purchase(234,timestamp,sale1,{value: price})).to.be.reverted
    await expect(nftSale.purchase(234,timestamp,sale2,{value: price})).to.be.reverted

    await expect(nftSale.connect(owner).setPurchaseSupply(0)).to.be.reverted
    await nftSale.connect(await getGnosisWithEther(nftSale)).setPurchaseSupply(0)
    await expect(nftSale.connect(user1).purchase(234, timestamp, sale2, {value: price})).to.be.reverted
    await nftSale.connect(await getGnosisWithEther(nftSale)).setPurchaseSupply(1000)
    await nftSale.connect(user1).purchase(234, timestamp, sale2, {value: price})

    expect(await nft.balanceOf(user1.address)).to.be.equal(1);

    await expect(nftSale.connect(owner).setRedeemSupply(0)).to.be.reverted
    await nftSale.connect(await getGnosisWithEther(nftSale)).setRedeemSupply(0)
    await expect(nftSale.redeem(456, timestamp, redeem1)).to.be.reverted
    await nftSale.connect(await getGnosisWithEther(nftSale)).setRedeemSupply(1000)
    await nftSale.redeem(456, timestamp, redeem1)

    await expect(nftSale.connect(owner).pauseRedeem()).to.be.reverted
    await nftSale.connect(await getGnosisWithEther(nftSale)).pauseRedeem()
    await expect(nftSale.connect(user1).redeem(567, timestamp, redeem2)).to.be.reverted
    await nftSale.connect(await getGnosisWithEther(nftSale)).pauseRedeem()
    await nftSale.connect(user1).redeem(567, timestamp, redeem2)

    expect(await nft.balanceOf(owner.address)).to.be.equal(2);
    expect(await nft.balanceOf(user1.address)).to.be.equal(2);

    expect(await nft.balanceOf(user2.address)).to.be.equal(0);
    await nftSale.connect(await getGnosisWithEther(nftSale)).setPrice(ethers.utils.parseEther("2"))
    await nftSale.connect(user2).purchase(123454321, timestamp, sale3, {value: ethers.utils.parseEther("2")})
    expect(await nft.balanceOf(user2.address)).to.be.equal(1);
    await nftSale.connect(await getGnosisWithEther(nftSale)).setPrice(ethers.utils.parseEther("1"))

    await nftSale.connect(await getGnosisWithEther(nftSale)).withdraw()
  })

  it("mint and transfer from and to treasury", async () => {
    let id = 12345
    let nonce = 12345

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

  it("transfers per day work", async() => {
    let id = 12345
    let nonce = 123456
    await treasury.connect(await getGnosisWithEther(treasury)).setNftLimit(1, 3)
    await nft.transferFrom(owner.address, treasury.address, id)
   
    let sig = await getTreasurySignature(nonce, id, owner.address, timestamp, 1)
    
    await expect(treasury.withdrawNFT(nonce, id, owner.address, timestamp, 1, sig)).to.be.revertedWith("Too many transfers")

    await treasury.connect(await getGnosisWithEther(treasury)).setNftLimit(1, 4)
    await treasury.withdrawNFT(nonce++, id, owner.address, timestamp, 1, sig)

    expect(await treasury.connect(await getGnosisWithEther(treasury)).nftTransfersPerDay(owner.address, await treasury.getCurrentDay(), 1)).to.be.equal(4)
    await increaseTimeDays(1)
    expect(await treasury.connect(await getGnosisWithEther(treasury)).nftTransfersPerDay(owner.address, await treasury.getCurrentDay(), 1)).to.be.equal(0)
  })

  it("disable and add token works", async()=>{
    let id = 12345
    let nonce = 22222
    timestamp = await currentTimestamp() + 1000

    await nft.transferFrom(owner.address, treasury.address, id)
    let sig = await getTreasurySignature(nonce, id, owner.address, timestamp, 1)
    await treasury.connect(await getGnosisWithEther(treasury)).disableNFT(1)
    
    await expect(treasury.withdrawNFT(nonce, id, owner.address, timestamp, 1, sig)).to.be.revertedWith("Option disabled")

    let newNFT = await deployNFT("it", "it")
    await newNFT.connect(await getGnosisWithEther(newNFT)).setNftSaleAndTreasury(nftSale.address, treasury.address)
    await treasury.connect(await getGnosisWithEther(treasury)).addNFT(newNFT.address, 2)

    let newSig = await getTreasurySignature(nonce, id, owner.address, timestamp, 2)
    await treasury.withdrawNFT(nonce++, id, owner.address, timestamp, 2, newSig)
    await newNFT.transferFrom(owner.address, treasury.address, id)

    newSig = await getTreasurySignature(nonce, id, owner.address, timestamp, 2)
    await treasury.withdrawNFT(nonce++, id, owner.address, timestamp, 2, newSig)
    await newNFT.transferFrom(owner.address, treasury.address, id)

    newSig = await getTreasurySignature(nonce, id, owner.address, timestamp, 2)
    await expect(treasury.withdrawNFT(nonce, id, owner.address, timestamp, 2, newSig)).to.be.reverted
  })

  it("erc20 works", async()=>{
      let token = await deployCHEEL()
      await treasury.connect(await getGnosisWithEther(treasury)).addToken(token.address, 100000)

      let amount = 10000

      await token.connect(await getGnosisWithEther(token)).mint(treasury.address, 100000)

      let nonce = 321
      timestamp = await currentTimestamp() + 1000

      let sig = await getTreasuryErc20Signature(nonce, amount, owner.address, timestamp, 3)
      await treasury.withdraw(nonce++, amount, owner.address, timestamp, 3, sig)
      sig = await getTreasuryErc20Signature(nonce, amount, owner.address, timestamp, 3)
      await treasury.withdraw(nonce++, amount, owner.address, timestamp, 3, sig)
      sig = await getTreasuryErc20Signature(nonce, amount, owner.address, timestamp, 3)
      await treasury.withdraw(nonce++, amount, owner.address, timestamp, 3, sig)

      sig = await getTreasuryErc20Signature(nonce, amount, owner.address, timestamp, 2)
      await expect(treasury.withdraw(nonce, "10000000000000000000000", owner.address, timestamp, 2, sig)).to.be.revertedWith("Amount greater than allowed")

      console.log(await token.balanceOf(owner.address));
  })

  it("withdraw works", async()=> {
    console.log(await erc20.balanceOf(owner.address));
    await treasury.connect(await getGnosisWithEther(treasury)).withdrawToken(erc20.address, 100)
    console.log(await erc20.balanceOf(owner.address));
  })

  it("mint works", async()=>{
    await nft.connect(await getGnosisWithEther(nft)).safeMint(owner.address, 777)
    expect(await nft.ownerOf(777)).to.be.equal(owner.address)
  })

  it("setURI works", async() => {
    // expect(await nft.tokenURI(777)).to.be.equal("777")
    await nft.connect(await getGnosisWithEther(nft)).setUri("ipfs://test/")
    expect(await nft.tokenURI(777)).to.be.equal("ipfs://test/777")
  })

  it("tokens by owner", async()=>{
    let newNFT = await deployNFT("it", "it")
    await newNFT.connect(await getGnosisWithEther(newNFT)).setNftSaleAndTreasury(nftSale.address, treasury.address)

    await newNFT.connect(await getGnosisWithEther(newNFT)).safeMint(owner.address, 1)
    await newNFT.connect(await getGnosisWithEther(newNFT)).safeMint(owner.address, 2)
    await newNFT.connect(await getGnosisWithEther(newNFT)).safeMint(owner.address, 3)

    expect((await newNFT.tokensOwnedByUser(owner.address)).length).to.be.equal(3)
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
    let domain = TrNftSig.eip712Domain(treasury.address, (await ethers.provider.getNetwork()).chainId)
    return await owner._signTypedData(domain, TrNftSig.Pass, {nonce: nonce, id: tokenId, address_to: to, ttl: ttl, option: option})
  }

  async function getTreasuryErc20Signature(nonce: any, tokenId: any, to: any, ttl: any, option: any) {
    let domain = TrTokenSig.eip712Domain(treasury.address, (await ethers.provider.getNetwork()).chainId)
    return await owner._signTypedData(domain, TrTokenSig.Pass, {nonce: nonce, amount: tokenId, address_to: to, ttl: ttl, option: option})
  }

  async function getGnosisWithEther(from: any): Promise<SignerWithAddress> {
    let gnosis = await ethers.getImpersonatedSigner(await from.GNOSIS())
    await owner.sendTransaction({to: gnosis.address,value: ethers.utils.parseEther("0.1")})
    return gnosis
  }
})
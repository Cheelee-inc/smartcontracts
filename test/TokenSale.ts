import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BigNumber, Signer } from "ethers";
import { ethers } from "hardhat";
import { exit } from "process";
import { CHEEL, Sale, MultiVesting, TokenSale } from "../typechain";
import { deployCHEEL, deployMultiVesting, deployTokenSale, deployUSDT, deployVesting } from "../utils/deployContracts"
import { currentTimestamp, increaseTime } from "../utils/helpers"
import { eip712Domain, Pass } from "./SaleEIP712"

describe("Test", function () {
    let cheel: CHEEL
    let usdt: CHEEL
    let vesting: MultiVesting
    let sale: TokenSale
    let owner: SignerWithAddress
    let signer: SignerWithAddress
  
    before(async()=>{
      [owner, signer] = await ethers.getSigners()
      cheel = await deployCHEEL()
      usdt = await deployUSDT()
      vesting = await deployMultiVesting(cheel.address)
      sale = await deployTokenSale(vesting.address, cheel.address, usdt.address, await signer.getAddress(), await currentTimestamp() + 1000)
      await vesting.setSaleContract(sale.address)

      await sale.setMaxAmount(10000)
    })

    it.only("Create Signature", async() => {
      let ttl = await currentTimestamp() + 60*60*24 * 3
      let ownerAddress = await owner.getAddress()

      let domain = eip712Domain(sale.address, (await ethers.provider.getNetwork()).chainId)
      let signature = await signer._signTypedData(domain, Pass, {id: 123, address_to: ownerAddress, ttl_timestamp: ttl})
    })

    it("Works", async() => {
        await usdt.mint(owner.address, 10000)
        await cheel.mint(sale.address, 10000)
        await usdt.approve(sale.address, 10000)

        let ttl = await currentTimestamp() + 100
        let ownerAddress = await owner.getAddress()

        let domain = eip712Domain(sale.address, (await ethers.provider.getNetwork()).chainId)
        let signature = await signer._signTypedData(domain, Pass, {buyer: ownerAddress, ttlTimestamp: ttl})

        await sale.exchange(1000, ttl, signature)
        
        console.log((await vesting.beneficiary(await owner.getAddress()))['amount'])
    })

    it("withdraw works", async() => {
      expect(await usdt.balanceOf(sale.address)).to.be.equal("1000")
      expect(await cheel.balanceOf(sale.address)).to.be.equal("9000")

      await sale.withdraw(usdt.address)
      await sale.withdraw(cheel.address)

      expect(await usdt.balanceOf(sale.address)).to.be.equal("0")
      expect(await cheel.balanceOf(sale.address)).to.be.equal("0")

      expect(await usdt.balanceOf(await owner.getAddress())).to.be.equal("10000")
      expect(await cheel.balanceOf(await owner.getAddress())).to.be.equal("9000")
      expect(await cheel.balanceOf(vesting.address)).to.be.equal("1000")
    })
})
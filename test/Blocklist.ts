import {expect} from "chai";
import {contract, ethers} from "hardhat";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {deployCHEEL, deployCommonBlacklist} from "../utils/deployContracts";
import {Contract} from "ethers";

contract("Blacklist", () => {
    let commonBlacklist: Contract;
    let cheel: Contract;
    let owner: SignerWithAddress;
    let user: SignerWithAddress;
    let blacklistGnosis: SignerWithAddress;
    let cheelGnosis: SignerWithAddress;

    before(async()=>{
        [owner, user] = await ethers.getSigners();
      
        cheelGnosis = await ethers.getImpersonatedSigner("0x126481E4E79cBc8b4199911342861F7535e76EE7")
        await owner.sendTransaction({
            to: cheelGnosis.address,
            value: ethers.utils.parseEther("1")
          })
        blacklistGnosis = await ethers.getImpersonatedSigner("0x126481E4E79cBc8b4199911342861F7535e76EE7")
        await owner.sendTransaction({
          to: blacklistGnosis.address,
          value: ethers.utils.parseEther("1")
        })
    
    })

    beforeEach(async () => {
        commonBlacklist = await deployCommonBlacklist();
    
        cheel = await deployCHEEL();
    })

    it("No role setup upon deployment", async()=>{
        expect(await commonBlacklist.hasRole(await commonBlacklist.BLACKLIST_OPERATOR_ROLE(), await commonBlacklist.GNOSIS())).to.be.equal(true)
    })

    it("Bug in exclusion logic", async()=>{
        await commonBlacklist.connect(blacklistGnosis).addContractToExclusionList(
            owner.address
        )

        await commonBlacklist.connect(blacklistGnosis).setTokenLimits(cheel.address, 500, 500, 500, 100)
        await commonBlacklist.connect(blacklistGnosis).changeDisablingTokenLimits(cheel.address, true, true, true, true)

        await cheel.connect(cheelGnosis).mint(owner.address, 200)

        await cheel.connect(cheelGnosis).setBlacklist(commonBlacklist.address);

        //shouldn't be reverted with that exception
        await expect(cheel.connect(owner).transfer(user.address, 200)).to.be.revertedWith("Spender has reached the month limit")

        expect(await cheel.balanceOf(user.address)).to.be.equal(200)
    })

    it("Underflow", async() => {
        await cheel.connect(cheelGnosis).setBlacklist(commonBlacklist.address);
        await cheel.connect(cheelGnosis).mint(owner.address, 400)
        
        await commonBlacklist.connect(blacklistGnosis).setTokenLimits(cheel.address, 500, 500, 500, 500)
        await commonBlacklist.connect(blacklistGnosis).changeDisablingTokenLimits(cheel.address, true, true, true, true)
        
        await cheel.connect(owner).transfer(user.address, 400);        
        expect((await commonBlacklist.getUserRemainingLimit(cheel.address, owner.address))['monthOutComeRemaining']).to.be.equal("100");
        await commonBlacklist.connect(blacklistGnosis).setTokenLimits(cheel.address, 300, 300, 300, 300)
        expect((await commonBlacklist.getUserRemainingLimit(cheel.address, owner.address))['monthOutComeRemaining']).to.be.equal("0");
    })
})

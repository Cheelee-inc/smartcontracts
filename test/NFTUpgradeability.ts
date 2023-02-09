import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  expectRevert,
  // @ts-ignore
} from "@openzeppelin/test-helpers";
import {contract, ethers, upgrades} from "hardhat";
import {deployNFT} from "../utils/deployContracts"
import {Contract} from "ethers";
import {NFTGlassesConfig} from "../config/ContractsConfig";
import {expect} from "chai";

contract(`${NFTGlassesConfig.contractName}V2 Upgrade`, () => {
  let nft: Contract;
  let nftV2: Contract;
  let gnosis: SignerWithAddress;
  let etherHolder: SignerWithAddress;
  let deployer: SignerWithAddress;
  let receiver: SignerWithAddress;
  let result: any;
  let resultWaited: any;

  before(async () => {
    // Deploy NFT
    nft = await deployNFT("NFT Test NFT", "NTN");

    // Creating GNOSIS
    [etherHolder, deployer, receiver] = await ethers.getSigners();
    gnosis = await ethers.getImpersonatedSigner(NFTGlassesConfig.multiSigAddress)
    await etherHolder.sendTransaction({
      to: NFTGlassesConfig.multiSigAddress,
      value: ethers.utils.parseEther("1")
    })
  });

  it('Upgrade to version V2', async function () {
    let NFTV2 = await ethers.getContractFactory("NFTV2");

    nftV2 = await upgrades.upgradeProxy(nft.address, NFTV2)
  });

  it("New function added works", async() => {
    result = await nftV2.connect(gnosis).safeMint(
      gnosis.address,
      0
    );
    resultWaited = await result.wait();

    expect(resultWaited.events[0].args.to).to.equal(gnosis.address);
    expect(resultWaited.events[0].args.tokenId).to.equal("0");

    await nftV2.connect(gnosis).setFlag();

    await expectRevert(
      nftV2.connect(gnosis).safeMint(
        gnosis.address,
        1
      ),
      "FORBIDDEN"
    );
  })
});

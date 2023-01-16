import { ethers, upgrades } from "hardhat";
import {CHEELConfig, CommonBlacklistConfig} from "../config/ContractsConfig";

export async function deployCommonBlacklist() {
    const Contract = await ethers.getContractFactory(CommonBlacklistConfig.contractName);
    const contract = await upgrades.deployProxy(Contract, [CommonBlacklistConfig.multiSigAddress], { initializer: "initialize", kind: "uups" })
    await contract.deployed()
    return contract
}

export async function deployLEE() {
    const Contract = await ethers.getContractFactory("LEE");
    const contract = await upgrades.deployProxy(Contract, [], { initializer: "initialize", kind: "uups" })
    await contract.deployed()
    return contract
}

export async function deployCHEEL(commonBlacklist: string) {
    const Contract = await ethers.getContractFactory(CHEELConfig.contractName);
    const contract = await upgrades.deployProxy(Contract, [
        CHEELConfig.tokenName,
        CHEELConfig.tokenSymbol,
        CHEELConfig.maxAmount,
        commonBlacklist,
        CHEELConfig.multiSigAddress,
    ], { initializer: "initialize", kind: "uups" })
    await contract.deployed()
    return contract
}

export async function deployTreasury(chests: any, glasses: any, signer: any, lee: any, cheel: any, usdt: any) {
    const Contract = await ethers.getContractFactory("Treasury");
    const contract = await upgrades.deployProxy(Contract, [chests, glasses, signer, lee, cheel, usdt], {initializer: "initialize", kind: "uups"})
    await contract.deployed()
    return contract
}

export async function deployNFT(name: any, version: any) {
    const Contract = await ethers.getContractFactory("NFT");
    const contract = await upgrades.deployProxy(Contract, [name, version], {initializer: "initialize", kind: "uups"})
    await contract.deployed();
    return contract
}

export async function deployUSDT() {
    const Contract = await ethers.getContractFactory("USDT");
    const contract = await Contract.deploy();
    await contract.deployed();
    return contract
}

export async function deployStaking(token: any) {
    const Contract = await ethers.getContractFactory("Staking");
    const contract = await upgrades.deployProxy(Contract, [token], {initializer: "initialize", kind: "uups"})
    await contract.deployed();
    return contract
}

export async function deployVesting(beneficiaryAddress: any, startTimestamp: any, durationSeconds: any, cliff: any, token: any) {
    const Contract = await ethers.getContractFactory("Vesting");
    const contract = await Contract.deploy(beneficiaryAddress, startTimestamp, durationSeconds, cliff, token);
    await contract.deployed();
    return contract
}

export async function deployMultiVesting(token: any, _changeBeneficiaryAllowed: boolean, _earlyWithdrawAllowed: boolean,
                                        updateMin: number = 100, updateMax: number = 200) {
    const Contract = await ethers.getContractFactory("MultiVesting");
    const contract = await Contract.deploy(token, _changeBeneficiaryAllowed, _earlyWithdrawAllowed, updateMin, updateMax)
    await contract.deployed();
    return contract
}

export async function deployTest(token: any) {
    const Contract = await ethers.getContractFactory("test");
    const contract = await Contract.deploy(token);
    await contract.deployed();
    return contract
}

export async function deployTokenSale(
    vesting: any,
    cheel: any,
    usdt: any,
    signer: any,
    finishTimestamp: number,
) {
    const Contract = await ethers.getContractFactory("TokenSale");
    const contract = await Contract.deploy(vesting, cheel, usdt, signer, finishTimestamp);
    await contract.deployed();
    return contract
}

export async function deployNFTSale(chests: any, signer: any, pricePerToken: any, redeemSupply: number, purchaseSupply: number) {
    const Contract = await ethers.getContractFactory("NFTSale");
    const contract = await Contract.deploy(chests, signer, pricePerToken, redeemSupply, purchaseSupply);
    await contract.deployed();
    return contract
}

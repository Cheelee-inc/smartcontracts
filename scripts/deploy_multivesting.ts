import * as dotenv from "dotenv";
import { ethers, upgrades } from "hardhat";
import { verify } from "./19_verify";
import { CHEELContractType } from '../lib/ContractProvider';
import { CHEEL, MultiVesting } from "../typechain";
import { ContractTransaction } from "ethers";
import { formatEther, parseEther } from "ethers/lib/utils";

const UPDATE_BENEFICIARY_MIN_SECONDS = 1;
const UPDATE_BENEFICIARY_MAX_SECONDS = 3600000;
const UPDATE_BENEFICIARY_ALLOWED = true;
const EMERGENCY_WITHDRAWAL_ALLOWED = false;

const amount = 1000;
const cliff = 1;
const timeSeconds = 30;
const actuallyWaitSeconds = timeSeconds + 30;

dotenv.config();

// BEFORE START: set `GNOSIS` var in CHEEL and MultiVesting  smarts to `owner` address.

// TODO: save deployment info, set automatically
const DO_DEPLOY = true;

async function try_verify(contractName: string, contractAddress: string, args: any[], chainId: number | undefined = undefined) {
    info(`Verification for ${contractName} contract...`);
    try {
        // Except Hardhat
        chainId = chainId !== undefined ? chainId : (await ethers.provider.getNetwork()).chainId;
        if (chainId !== 31337) {
            await verify(contractAddress, args);
        }
        info(`${contractName} contract is verified`);
    } catch {
        info(`${contractName} contract skip verification`);
    }
}

async function deploy_cheel(): Promise<CHEEL> {
    const CHEELContract = await ethers.getContractFactory("CHEEL");

    let cheelProxy;
    if (DO_DEPLOY) {
        cheelProxy = await upgrades.deployProxy(CHEELContract, [], { initializer: 'initialize' }) as CHEELContractType;
        await cheelProxy.deployed();
    } else {
        cheelProxy = CHEELContract.attach("0x86371E0721a386217C33fb0C43C53302a48bafcB");
    }

    const cheelContract = await upgrades.erc1967.getImplementationAddress(cheelProxy.address);
    const cheelAdmin = await upgrades.erc1967.getAdminAddress(cheelProxy.address);

    info('Contract CHEEL deployed to:', cheelContract);
    info('Proxy CHEEL contract deployed to:', cheelProxy.address);
    info('Admin CHEEL contract deployed to:', cheelAdmin);

    await try_verify("CHEEL", cheelContract, []);

    return cheelProxy;
}

async function deploy_vesting(cheelToken: string): Promise<MultiVesting> {
    const MV = await ethers.getContractFactory("MultiVesting");
    let multiVesting;
    if (DO_DEPLOY) {
        multiVesting = await MV.deploy(
            cheelToken, UPDATE_BENEFICIARY_ALLOWED, EMERGENCY_WITHDRAWAL_ALLOWED,
            UPDATE_BENEFICIARY_MIN_SECONDS, UPDATE_BENEFICIARY_MAX_SECONDS
        );
        await multiVesting.deployed();
    } else {
        multiVesting = MV.attach("0x379983155895e55DAc43198698C0fC4060f9754c");
    }

    info("MultiVesting address:", multiVesting.address);

    await try_verify("MultiVesting", multiVesting.address, [
        cheelToken, UPDATE_BENEFICIARY_ALLOWED, EMERGENCY_WITHDRAWAL_ALLOWED,
        UPDATE_BENEFICIARY_MIN_SECONDS, UPDATE_BENEFICIARY_MAX_SECONDS
    ]);

    return multiVesting;
}

async function wait_for(condition: () => Promise<boolean>) {
    while (true) {
        if (await condition()) {
            return;
        } else {
            await delay(2);
        }
    }
}

function info(message?: any, ...optionalParams: any[]) {
    console.log(message, ...optionalParams);
}

async function main() {
    const network = await ethers.provider.getNetwork();
    info("Network name =", network.name);
    info("Network chain id =", network.chainId);

    const address2_pk = process.env.DEV2_PRIVATE_KEY;
    if (address2_pk === undefined) {
        throw "Expected DEV2_PRIVATE_KEY env variable";
    }
    const address2 = new ethers.Wallet(address2_pk, ethers.provider);

    const cheelProxy = await deploy_cheel();
    const multiVesting = await deploy_vesting(cheelProxy.address);

    const [owner] = await ethers.getSigners();
    let nonce = await owner.getTransactionCount();
    const safeWaitTx = async (tx: ContractTransaction | Promise<ContractTransaction>) => {
        const txResolved = await Promise.resolve(tx);
        info(`Waiting TX Hash: ${txResolved.hash}`);
        nonce += 1;
        await txResolved.wait();
    };

    info(`cheelProxy.mint: owner ${await cheelProxy.owner()}, we are on address: ${owner.address}`);
    await safeWaitTx(cheelProxy.mint(multiVesting.address, amount, {nonce}));
    info(`multiVesting.setSeller(${owner.address})`);
    await safeWaitTx(multiVesting.setSeller(owner.address));

    info("vest");
    await wait_for(async () => {
        const tokenBalance = await cheelProxy.balanceOf(multiVesting.address);
        const seller = await multiVesting.seller();
        return tokenBalance.gte(amount) && seller === owner.address;
    });

    // Check vesting sum tokens
    const sumVesting = await multiVesting.sumVesting();
    const tokenBalance = await cheelProxy.balanceOf(multiVesting.address);
    info(`Check: ${sumVesting} + ${amount} <= ${tokenBalance}`);
    
    await safeWaitTx(
        multiVesting.vest(
            owner.address,
            await currentTimestamp() - 1,
            timeSeconds,
            amount,
            cliff,
            {nonce},
        )
    );

    info("updateBeneficiary");
    await wait_for(async () => {
        const tokenBalance = (await multiVesting.beneficiary(owner.address)).amount;
        info("Wait for balance:", tokenBalance.toNumber());
        return tokenBalance.gte(amount);
    });
    await safeWaitTx(
        multiVesting.updateBeneficiary(owner.address, address2.address, {nonce})
    );

    info(`Waiting ${timeSeconds} seconds`);
    // Emulate time for Hardhat
    if (network.chainId === 31337) {
        await increaseTime(actuallyWaitSeconds);
    } else {
        await delay(actuallyWaitSeconds);
    }
    info('Wait: done');

    info("finishUpdateBeneficiary");
    let address2Nonce = await address2.getTransactionCount();

    const gasLimit = await multiVesting
        .connect(address2)
        .estimateGas
        .finishUpdateBeneficiary(owner.address, {nonce: address2Nonce});

    info(`Gas limit: ${gasLimit}`);
    const gasPrice = await ethers.provider.getGasPrice();
    info(`Gas price: ${gasPrice}`);
    const value = gasLimit.mul(gasPrice);
    info(`Value: ${formatEther(value)}`);

    const existingBalance = await address2.getBalance();
    const valueToSend = value.sub(existingBalance);
    if (valueToSend.gt(0)) {
        await safeWaitTx(
            owner.sendTransaction({to: address2.address, value: valueToSend, nonce})
        );
    }

    const lowerGasPrice = gasPrice.mul(3).div(4);
    info(`Lower gas price: ${lowerGasPrice}`);
    const finishUpdateBeneficiaryTx = await multiVesting
        .connect(address2)
        .finishUpdateBeneficiary(owner.address, {nonce: address2Nonce, gasLimit, gasPrice: lowerGasPrice});
    address2Nonce += 1;
    info(`finishUpdateBeneficiaryTx.hash: ${finishUpdateBeneficiaryTx.hash}`);
    const finishUpdateReceipt = await finishUpdateBeneficiaryTx.wait();
    info(`Actual value: ${formatEther(finishUpdateReceipt.gasUsed.mul(finishUpdateReceipt.effectiveGasPrice).toNumber())}`);

    info("Done");
}

async function currentTimestamp() {
    const blockNumBefore = await ethers.provider.getBlockNumber();
    const blockBefore = await ethers.provider.getBlock(blockNumBefore);
    return blockBefore.timestamp;
}

async function increaseTime(seconds: number) {
    await ethers.provider.send("evm_increaseTime", [seconds]);
    await ethers.provider.send("evm_mine", []);
}

function delay(seconds: number) {
    return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

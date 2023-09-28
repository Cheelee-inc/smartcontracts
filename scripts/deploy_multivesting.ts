import * as dotenv from "dotenv";
import { ethers, upgrades } from "hardhat";
import { verify } from "./19_verify";
import { CHEELContractType } from '../lib/ContractProvider';

const UPDATE_BENEFICIARY_MIN_SECONDS = 1;
const UPDATE_BENEFICIARY_MAX_SECONDS = 1800;
const UPDATE_BENEFICIARY_ALLOWED = true;
const EMERGENCY_WITHDRAWAL_ALLOWED = false;

dotenv.config();

const N_CONFIRMATIONS = 3;

// BEFORE START: set `GNOSIS` var in CHEEL and MultiVesting  smarts to `owner` address.

// TODO: save deployment info, set automatically
const DO_DEPLOY = true;

async function main() {
    let tx;

    const network = await ethers.provider.getNetwork();
    console.log("Network name =", network.name);
    console.log("Network chain id =", network.chainId);

    const [owner] = await ethers.getSigners();
    let nonce = await owner.getTransactionCount();

    const address2_pk = process.env.DEV2_PRIVATE_KEY;
    if (address2_pk === undefined) {
        throw "Expected DEV2_PRIVATE_KEY env variable";
    }
    const address2 = new ethers.Wallet(address2_pk, ethers.provider);

    // We get the contract to deploy
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

    console.log('Contract CHEEL deployed to:', cheelContract);
    console.log('Proxy CHEEL contract deployed to:', cheelProxy.address);
    console.log('Admin CHEEL contract deployed to:', cheelAdmin);

    console.log('Verification for CHEEL contract...');
    try {
        await verify(cheelContract, []);
        console.log('CHEEL contract is verified');
    } catch {
        console.log('CHEEL contract skip verification');
    }

    const CHEEL_TOKEN = cheelProxy.address;

    const MV = await ethers.getContractFactory("MultiVesting");
    let multiVesting;
    if (DO_DEPLOY) {
        multiVesting = await MV.deploy(
            CHEEL_TOKEN, UPDATE_BENEFICIARY_ALLOWED, EMERGENCY_WITHDRAWAL_ALLOWED,
            UPDATE_BENEFICIARY_MIN_SECONDS, UPDATE_BENEFICIARY_MAX_SECONDS
        );
        await multiVesting.deployed();
    } else {
        multiVesting = MV.attach("0x379983155895e55DAc43198698C0fC4060f9754c");
    }
    
    console.log("MultiVesting address:", multiVesting.address);

    try {
        await verify(multiVesting.address, [
            CHEEL_TOKEN, UPDATE_BENEFICIARY_ALLOWED, EMERGENCY_WITHDRAWAL_ALLOWED,
            UPDATE_BENEFICIARY_MIN_SECONDS, UPDATE_BENEFICIARY_MAX_SECONDS
        ]);
        console.log('MultiVesting verified');
    } catch {
        console.log('MultiVesting skip verification');
    }

    console.log(`Doing mint: owner ${await cheelProxy.owner()}, we are on: ${owner.address}`);
    const amount = 1000;
    nonce += 1;
    await cheelProxy.mint(multiVesting.address, amount, {nonce});
    nonce += 1;
    await multiVesting.setSeller(owner.address);
    nonce += 1;

    console.log("vest");
    const timeSeconds = 30;
    const cliff = 1;

    let balanceIsCorrect = false;
    while (!balanceIsCorrect) {
        const tokenBalance = await cheelProxy.balanceOf(multiVesting.address);
        const seller = await multiVesting.seller();
        console.log("Wait for balance:", tokenBalance, "seller:", seller);
        if (tokenBalance.gte(amount) && seller === owner.address) {
            balanceIsCorrect = true;
        } else {
            await delay(2);
        }
    }
    const sumVesting = await multiVesting.sumVesting();
    const tokenBalance = await cheelProxy.balanceOf(multiVesting.address);
    console.log(`Check: ${sumVesting} + ${amount} <= ${tokenBalance}`);

    tx = await multiVesting.vest(owner.address, await currentTimestamp()-1, timeSeconds, amount, cliff, {nonce});
    nonce += 1;
    await tx.wait(N_CONFIRMATIONS);

    console.log("updateBeneficiary");
    balanceIsCorrect = false;
    while (!balanceIsCorrect) {
        const tokenBalance = (await multiVesting.beneficiary(owner.address)).amount;
        console.log("Wait for balance:", tokenBalance);
        if (tokenBalance.gte(amount)) {
            balanceIsCorrect = true;
        } else {
            await delay(2);
        }
    }
    tx = await multiVesting.updateBeneficiary(owner.address, address2.address, {nonce});
    nonce += 1;
    console.log("Wait", N_CONFIRMATIONS);
    await tx.wait(N_CONFIRMATIONS);
    
    console.log("finishUpdateBeneficiary");
    tx = await owner.sendTransaction({to: address2.address, value: ethers.utils.parseEther("0.01"), nonce})
    nonce += 1;
    console.log("Wait", N_CONFIRMATIONS);
    await tx.wait(N_CONFIRMATIONS);

    console.log(`Waiting ${timeSeconds} seconds`);
    const actuallyWaitSeconds = timeSeconds + 30;
    // For Hardhat emulate time
    if (network.chainId === 31337) {
        await increaseTime(actuallyWaitSeconds);
    } else {
        await delay(actuallyWaitSeconds);
    }

    tx = await multiVesting.connect(address2).finishUpdateBeneficiary(owner.address, {nonce});
    nonce += 1;
    console.log("Wait", N_CONFIRMATIONS);
    await tx.wait(N_CONFIRMATIONS);
    console.log("done");
}

async function currentTimestamp() {
    const blockNumBefore = await ethers.provider.getBlockNumber();
    const blockBefore = await ethers.provider.getBlock(blockNumBefore);
    return blockBefore.timestamp;
}

async function increaseTime(seconds: any) {
    await ethers.provider.send("evm_increaseTime", [seconds])
    await ethers.provider.send("evm_mine", [])
}

function delay(s: number) {
    return new Promise(resolve => setTimeout(resolve, s * 1000));
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

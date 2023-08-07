import { ethers } from "hardhat";
import EthersAdapter from '@safe-global/safe-ethers-lib'
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import SafeServiceClient from '@safe-global/safe-service-client'
import Safe, { CreateTransactionProps } from '@safe-global/safe-core-sdk'
import { SafeTransactionDataPartial } from '@safe-global/safe-core-sdk-types'
import csv from 'csvtojson';
import { BigNumber } from "ethers";
import { MultiVesting } from "../typechain";

let owner: SignerWithAddress
let safeAddress = "0x55818587f8F184f68D2fA6f01687DC274c9E6A11"
let vestingAddress = "0x3291f4847C9788149B6904625D9F10b3e72B56Db"
const txServiceUrl = 'https://safe-transaction.bsc.gnosis.io/'

// 4.330571197237970000 CHEEL
let amount = BigNumber.from("4330571197237970000")
let cliff = 1
let start = 1701561601
let duration = 94694400
const chunkSize = 480

const genVest = async (vesting: MultiVesting, recipient: string, nonce: number) => {
    // Can change to any other function
    return {
        to: vesting.address,
        value: "0",
        data: (
            await vesting.populateTransaction.vest(
                recipient,
                start,
                duration,
                amount,
                cliff,
            )).data!,
        nonce,
    }
}

async function main() {
    [owner] = await ethers.getSigners()
    console.log("Owner address:", owner.address);
    console.log("Amount:", amount);
    console.log("Cliff:", cliff);
    console.log("Start:", start);
    console.log("Duration:", duration);
    console.log("Chunk size:", chunkSize);

    const ethAdapter = new EthersAdapter({ ethers, signerOrProvider: owner })    
    const safeService = new SafeServiceClient({ txServiceUrl, ethAdapter })
    const safeSdk = await Safe.create({ ethAdapter, safeAddress })
    const Factory = await ethers.getContractFactory("MultiVesting")
    const vesting = Factory.attach(vestingAddress)

    const csvData = await csv().fromFile("Vest_unique_shuffled_2.csv");
    let recipients = await Promise.all(csvData.map((it) => it['recipient'] as string));
    console.log("recipients.length ==", recipients.length);

    for (let i = 0; i < recipients.length; i += chunkSize) {
        const timeStart = performance.now();

        let nonce = await safeService.getNextNonce(safeAddress);

        const chunk = recipients.slice(i, i + chunkSize);
        console.log(`Processing chunk of ${chunk.length} - ${i}-${i + chunkSize}: ${chunk[0]}-${chunk[chunk.length - 1]}`);
        const transaction: SafeTransactionDataPartial[]  =
                await Promise.all(chunk.map(
                    (recipient) => genVest(vesting, recipient, nonce)
                )
            );

        console.log("Finished creation tx data. Nonce:", nonce);

        const props: CreateTransactionProps = { safeTransactionData: transaction, options:{nonce: nonce} };
        const safeTransaction = await safeSdk.createTransaction(props);

        const safeTxHash = await safeSdk.getTransactionHash(safeTransaction);
        console.log("safeTxHash:", safeTxHash);

        const senderSignature = await safeSdk.signTransactionHash(safeTxHash);

        await safeService.proposeTransaction({
            safeAddress: safeAddress,
            safeTransactionData: safeTransaction.data,
            safeTxHash: safeTxHash,
            senderAddress: owner.address,
            senderSignature: senderSignature.data,
        });

        const signature = await safeService.confirmTransaction(safeTxHash, senderSignature.data);
        console.log("Signature:", signature.signature);

        const timeEnd = performance.now();
        console.log(`Took: ${(timeEnd - timeStart) / 1000} seconds to process ${chunk.length} txs`);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
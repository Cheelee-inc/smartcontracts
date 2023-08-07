import { ethers } from "hardhat";
import fs from "fs";
import csv from 'csvtojson';
import { BigNumber } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

/**
 * need to install aws cli on host machine, and set up config and credentials.
 * potential issue: when running, script can fail to run, in that case we 
 * need to add aws region to system environments.
 * 
 * how to use:
 * when specifying network, set kmsKeyId = "arn:aws:kms:..." instead of accounts: [""] in hardhat.config.ts for specified network.
 */

const abi = JSON.parse(fs.readFileSync("./cheel_abi.json", 'utf8')); //read abi of tokens, can swap for any other contract

const CONTRACT_ADDRESS = "0x1F1C90aEb2fd13EA972F0a71e35c0753848e3DB0" //address of erc20 token

// 0.276419438121572000 CHEEL
const amount = BigNumber.from("276419438121572000");

const contract = new ethers.Contract(CONTRACT_ADDRESS, abi);

const chunkSize = 20;

async function main() {
    const csvData = await csv().fromFile("Airdrop_unique_shuffled_2.csv");
    let recipients = await Promise.all(csvData.map((it: any) => it['receiver']));
    console.log(recipients);
    console.log(recipients.length);

    const [owner] = await ethers.getSigners();
    console.log("Owner address:", owner.address);
    console.log("Amount:", amount);

    const initTxCounter = await owner.getTransactionCount('latest');
    console.log("Init TX counter:", initTxCounter);

    // TODO: set N
    for (let i = 0; i < 4629; i += chunkSize) {
        const chunk = recipients.slice(i, i + chunkSize);

        // const to = recipients[i];
        console.log(`Sending to: ${i}..${i + chunkSize}`, chunk);

        let results = await Promise.all(chunk.map(
            (recipient, chunkIdx) => sendTx(owner, i + chunkIdx, recipient as string, initTxCounter + i + chunkIdx, chunkIdx)
        ));
        if (!results.every(isOk => isOk)) {
            return;
        }

        // const data = contract.interface.encodeFunctionData("transfer", [to, amount] )

        // const tx = await owner.sendTransaction({
        //     to: CONTRACT_ADDRESS,
        //     data: data,
        // });

        // console.log("TX hash:", tx.hash);
        // console.log("Index:", i);

        // const receipt = await tx.wait();
        // console.log("Status:", receipt.status);
        // if (receipt.status != 1) {
        //     console.log("TX was reverted!");
        //     return;
        // }

        await delay(100);

        // TODO: delete
        // return;
    }
}

async function sendTx(owner: SignerWithAddress, i: number, to: string, nonce: number, chunkIdx: number): Promise<boolean> {
    console.log(`${i} Sending to: ${to}`);

    await delay(chunkIdx * 10);

    const data = contract.interface.encodeFunctionData("transfer", [to, amount] );

    const tx = await owner.sendTransaction({
        to: CONTRACT_ADDRESS,
        data: data,
        nonce,
    });

    console.log(`${i} TX hash: ${tx.hash}`);

    const receipt = await tx.wait();
    console.log(`${i} Status: ${receipt.status}`);
    if (receipt.status != 1) {
        console.log(`${i} TX was reverted!`);
    } else {
        console.log(`${i} Address to TX: ${to} ${tx.hash}`);
    }
    return receipt.status == 1;
}

function delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}

main().then(it=>{})

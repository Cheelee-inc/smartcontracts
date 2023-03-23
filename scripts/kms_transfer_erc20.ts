import { ethers } from "hardhat";
import fs from "fs"

/**
 * need to install aws cli on host machine, and set up config and credentials.
 * potential issue: when running, script can fail to run, in that case we 
 * need to add aws region to system environments.
 * 
 * how to use:
 * when specifying network, set kmsKeyId = "arn:aws:kms:..." instead of accounts: [""] in hardhat.config.ts for specified network.
 */

const abi = JSON.parse(fs.readFileSync("abi.json")); //read abi of tokens, can swap for any other contract

const CONTRACT_ADDRESS = "0x43957FaA595a7E66adeE16Becd92B00713fE7449" //address of erc20 token
const to = "0x2ee51F0bCC1ece7B94091e5E250b08e8276256D9"; //recipient of tokens
const amount = 1000;

const contract = new ethers.Contract(CONTRACT_ADDRESS, abi)
const data = contract.interface.encodeFunctionData("transfer", [to, amount] )

async function main() {
    let signer = await ethers.getSigner()

    const tx = await signer.sendTransaction({
        type: 0,
        to: CONTRACT_ADDRESS,
        data: data,
    });

    console.log(tx);
}

main().then(it=>{})

import hre, { ethers } from "hardhat";
import { Signer } from "ethers";
import EthersAdapter from '@safe-global/safe-ethers-lib'
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import SafeServiceClient from '@safe-global/safe-service-client'
import Safe, { CreateTransactionProps } from '@safe-global/safe-core-sdk'
import { SafeTransactionDataPartial } from '@safe-global/safe-core-sdk-types'
import csv from 'csvtojson';


let safeAddress = "0x1d305206AEf96eC878C34342b34beb760f597BC2"
let owner: SignerWithAddress
let vestingAddress = "0xc48A4E84446Df7D257927abB71D4F64d1EaEe31B"
const txServiceUrl = 'https://safe-transaction.goerli.gnosis.io/'

// let safeAddress = "0xe69C24fA49FC2fF52305E4300D627a9094b648f5"
// let owner: SignerWithAddress
// let vestingAddress = "0xB2fde13B28f2d7Fe069748DB515DC1207dd3F31E"
// const txServiceUrl = 'https://safe-transaction.bsc.gnosis.io/'

let amount = 1000
let cliff = 900
let duration = 1800
let start = 1000000000
const chunkSize = 10;

async function main() {
    [owner] = await ethers.getSigners()
    console.log(await owner.getAddress());

    const ethAdapter = new EthersAdapter({ethers ,signerOrProvider: owner})    

    const safeService = new SafeServiceClient({ txServiceUrl, ethAdapter })
    const safeSdk = await Safe.create({ ethAdapter, safeAddress })

    const Factory = await ethers.getContractFactory("MultiVesting")
    const vesting = Factory.attach(vestingAddress)

    let nonce = await safeService.getNextNonce(safeAddress)
    
    const csvData = await csv().fromFile("test.csv");
    let recipients = await Promise.all(csvData.map((it) => it['receiver']))
    for (let i = 0; i < recipients.length; i += chunkSize) {
        const chunk = recipients.slice(i, i + chunkSize);

        const transaction: SafeTransactionDataPartial[]  =
                await Promise.all(chunk.map(
                    (recipient) => genVest(vesting, recipient, nonce)
                )
            )

        const props: CreateTransactionProps = { safeTransactionData: transaction }

        const safeTransaction = await safeSdk.createTransaction(props)
        const safeTxHash = await safeSdk.getTransactionHash(safeTransaction)
        const senderSignature = await safeSdk.signTransactionHash(safeTxHash)
        await safeService.proposeTransaction({
            safeAddress: safeAddress,
            safeTransactionData: safeTransaction.data,
            safeTxHash: safeTxHash,
            senderAddress: owner.address,
            senderSignature: senderSignature.data
        })
    }

}

const genVest = async (vesting: any, recipient: any, nonce: number) => {
    return { to: vesting.address, value: "0",data: (await vesting.populateTransaction.vest(recipient, start, duration, amount, cliff)).data!, nonce: nonce }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
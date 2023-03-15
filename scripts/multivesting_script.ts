import { ethers } from "hardhat";
import EthersAdapter from '@safe-global/safe-ethers-lib'
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import SafeServiceClient from '@safe-global/safe-service-client'
import Safe, { CreateTransactionProps } from '@safe-global/safe-core-sdk'
import { SafeTransactionDataPartial } from '@safe-global/safe-core-sdk-types'
import csv from 'csvtojson';

let safeAddress = "0x55818587f8F184f68D2fA6f01687DC274c9E6A11"
let owner: SignerWithAddress
let vestingAddress = "0x3291f4847C9788149B6904625D9F10b3e72B56Db"
const txServiceUrl = 'https://safe-transaction.bsc.gnosis.io/'

let amount = "17617890000000000000"
let cliff = 1
let duration = 94694400
let start = 1687219200
const chunkSize = 480

const genVest = async (vesting: any, recipient: any, nonce: number) => {
    //can change to any other function
    return { to: vesting.address, value: "0", data: (await vesting.populateTransaction.vest(recipient, start, duration, amount, cliff)).data!, nonce: nonce }
}

async function main() {
    [owner] = await ethers.getSigners()
    console.log(await owner.getAddress());

    const ethAdapter = new EthersAdapter({ethers,signerOrProvider: owner})    
    const safeService = new SafeServiceClient({ txServiceUrl, ethAdapter })
    const safeSdk = await Safe.create({ ethAdapter, safeAddress })
    const Factory = await ethers.getContractFactory("MultiVesting")
    const vesting = Factory.attach(vestingAddress)
    
    const csvData = await csv().fromFile("drop.csv");
    let recipients = await Promise.all(csvData.map((it) => it['recipient']))
    for (let i = 0; i < recipients.length; i += chunkSize) {
        let nonce = await safeService.getNextNonce(safeAddress)

        const chunk = recipients.slice(i, i + chunkSize);
        const transaction: SafeTransactionDataPartial[]  =
                await Promise.all(chunk.map(
                    (recipient) => genVest(vesting, recipient, nonce)
                )
            )

        console.log("finished creation tx data", nonce);

        const props: CreateTransactionProps = { safeTransactionData: transaction, options:{nonce: nonce} }
        const safeTransaction = await safeSdk.createTransaction(props)

        const safeTxHash = await safeSdk.getTransactionHash(safeTransaction)

        const senderSignature = await safeSdk.signTransactionHash(safeTxHash)

        await safeService.proposeTransaction({
            safeAddress: safeAddress,
            safeTransactionData: safeTransaction.data,
            safeTxHash: safeTxHash,
            senderAddress: owner.address,
            senderSignature: senderSignature.data,
        })

        await safeService.confirmTransaction(safeTxHash, senderSignature.data)
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });

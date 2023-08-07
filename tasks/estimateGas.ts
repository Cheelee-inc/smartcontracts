import { task } from 'hardhat/config'
import { BigNumber } from '@ethersproject/bignumber'

import {
  CHEELContractType,
  // CommonBlacklistContractType,
  LEEContractType,
  NFTContractType,
} from "../lib/ContractProvider";
import {
  // CommonBlacklistConfig,
  LEEConfig,
  CHEELConfig,
  NFTCasesConfig,
  NFTGlassesConfig,
} from "../config/ContractsConfig";
import { currentTimestamp } from '../utils/helpers';


// import { Align, getMarkdownTable } from 'markdown-table-ts'

// const SIZES = [1, 2, 3, 4, 5]
const GWEI_TO_ETH = 1e-9
const ETH_PRICE = 1300
const GAS_PRICE = 20

// const sortShares = (accounts: string[], shares: string[]): [string[], string[]] => {
//   const data = accounts.map((account, i) => [account, shares[i]]);
//   data.sort((a, b) => a[0] > b[0] ? 1 : a[0] < b[0] ? -1 : 0);
//   return [data.map(pair => pair[0]), data.map(pair => pair[1])];
// }

const formatBN = (bn: BigNumber) =>
  bn.toNumber().toLocaleString().replace(/,/g, '_')

const formatBNToCurrency = (
  bn: BigNumber,
  opts: Intl.NumberFormatOptions = {},
) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    ...opts,
  }).format(bn.toNumber() * ETH_PRICE * GAS_PRICE * GWEI_TO_ETH)

/* eslint-disable no-loops/no-loops */
/* eslint-disable no-console */

export default task(
  'estimateGas',
  'Estimate gas values for a variety of X.LA transactions',
  // eslint-disable-next-line  no-empty-pattern
).setAction(async ({}, hre) => {
  if (hre.network.name === 'hardhat') {
    console.warn(
      'You are running the createSplit task with Hardhat network, which' +
        ' gets automatically created and destroyed every time. Use the Hardhat' +
        " option '--network localhost'",
    )
  }

  const signers = await hre.ethers.getSigners();
  console.log(signers.length);
  const [owner, dev1, dev2, dev3, dev4, dev5] = signers;

  // const totalGas: string[][] = []
  // const perCapitaGas: string[][] = []
  // const totalGasUSD: string[][] = []
  // const perCapitaGasUSD: string[][] = []

  // console.log(`Generating gas estimates for splits of size ${SIZES}\n`)

  console.log([owner, dev1, dev2, dev3, dev4].map(s => s.address));

  console.log('Deploying CHEEL contract...');

  // We get the contract to deploy
  const CHEELContract = await hre.ethers.getContractFactory(CHEELConfig.contractName);
  const MultiVestingContract = await hre.ethers.getContractFactory("MultiVesting");

  const cheelProxy = await hre.upgrades.deployProxy(CHEELContract, [], { initializer: 'initialize' }) as CHEELContractType;
  await cheelProxy.deployed();

  const cheelContract = await hre.upgrades.erc1967.getImplementationAddress(cheelProxy.address);
  const cheelAdmin = await hre.upgrades.erc1967.getAdminAddress(cheelProxy.address);

  const multiVesting = await MultiVestingContract.deploy(cheelProxy.address, true, true, 100, 200);
  await multiVesting.deployed();

  const gnosisMV = await hre.ethers.getImpersonatedSigner(await multiVesting.GNOSIS());
  await owner.sendTransaction({to: gnosisMV.address, value: hre.ethers.BigNumber.from('10').pow('17')});
  await multiVesting.connect(gnosisMV).setSeller(await owner.getAddress())

  console.log('Contract CHEEL deployed to:', cheelContract);
  console.log('Proxy CHEEL contract deployed to:', cheelProxy.address);
  console.log('Admin CHEEL contract deployed to:', cheelAdmin);

  console.log("Owner:", await cheelProxy.owner());

  console.log('Contract MultiVesting deployed to:', multiVesting.address);
  
  const gnosis = await hre.ethers.getImpersonatedSigner(CHEELConfig.multiSigAddress);
  await owner.sendTransaction({to: gnosis.address, value: hre.ethers.BigNumber.from('10').pow('17')});


  // Transfer

  const n = signers.length;
  await cheelProxy.connect(gnosis).mint(owner.address, n * 20);

  let totalGas = hre.ethers.BigNumber.from("0");

  let gasAmounts = [];

  let byGasAmount = new Map<string, number[]>();

  for (let i = 0; i < n * 2; i++) {
    const signer = signers[i % n];
    const tx = await cheelProxy.connect(owner).transfer(signer.address, 10);
    const receipt = await tx.wait();
    gasAmounts.push(receipt.gasUsed);
    totalGas = totalGas.add(receipt.gasUsed);
    const key = receipt.gasUsed.toString();
    if (byGasAmount.has(key)) {
      const ids = byGasAmount.get(key);
      if (ids !== undefined) {
        ids.push(i);
      } else {
        throw "Error";
      }
    } else {
      byGasAmount.set(key, [i]);
    }

    console.log(i, "/", n);
  }
  console.log(totalGas, totalGas.div(n));
  let cmp = (a: BigNumber, b: BigNumber) => a.gt(b) ? 1 : (a.lt(b) ? -1 : 0);
  gasAmounts = gasAmounts.sort(cmp);
  console.log(gasAmounts[0], gasAmounts[gasAmounts.length - 1]);
  console.log(byGasAmount);



  // Vest

  async function currentTimestamp() {
      const blockNumBefore = await hre.ethers.provider.getBlockNumber();
      const blockBefore = await hre.ethers.provider.getBlock(blockNumBefore);
      return blockBefore.timestamp;
  }

  const amount = 1000 * n;

  await cheelProxy.connect(gnosis).mint(multiVesting.address, amount);

  
  let vestGasAmounts = [];
  let byVestGasAmount = new Map<string, number[]>();
  
  for (let i = 0; i < n; i++) {
    const signer = signers[i];
    const tx = await multiVesting.vest(signer.address, await currentTimestamp(), 3600, 1000, 100);
    const receipt = await tx.wait();

    vestGasAmounts.push(receipt.gasUsed);

    const key = receipt.gasUsed.toString();
    if (byVestGasAmount.has(key)) {
      const ids = byVestGasAmount.get(key);
      if (ids !== undefined) {
        ids.push(i);
      } else {
        throw "Error";
      }
    } else {
      byVestGasAmount.set(key, [i]);
    }

    console.log(i, "/", n);
  }

  vestGasAmounts = vestGasAmounts.sort(cmp);
  console.log(vestGasAmounts[0], vestGasAmounts[vestGasAmounts.length - 1]);
  console.log(byVestGasAmount);
  



















  // const CheelToken = await hre.ethers.getContractFactory("CHEEL");
  // const cheelToken = await CheelToken.deploy();

  // await cheelToken.mint(owner.address, 100_000);

  // const TSM = await hre.ethers.getContractFactory("TSM");
  // const RSCG = await hre.ethers.getContractFactory("RSCG");

  // for (let i = 0; i < SIZES.length; i++) {
  //   const size = SIZES[i];

  //   const [accounts1, shares1] = sortShares([dev3.address, dev4.address], ['50000', '50000'])
  //   let rscgPull = await RSCG.deploy(accounts1, shares1);
  //   await rscgPull.deployed();

  //   for (let i = 1; i < size; i++) {
  //     const [accounts2, shares2] = sortShares([rscgPull.address, dev2.address], ['50000', '50000'])
  //     rscgPull = await RSCG.deploy(accounts2, shares2);
  //     await rscgPull.deployed();
  //   }

  //   const P = hre.ethers.BigNumber.from('10').pow('18');
  //   const tsm = await TSM.deploy(rscgPull.address, '18068', '57798456781204', P, '100');
  //   await tsm.deployed();

  //   const xlaToken = XlaToken.attach(await tsm.xlaToken());
  //   await xlaToken.deployed();

  //   const amount = hre.ethers.utils.parseEther("10");

  //   const buyTx = await tsm.buy(hre.ethers.constants.AddressZero, {value: amount});
  //   const buyReceipt = await buyTx.wait();

  //   const buyTxAffiliate = await tsm.buy(dev1.address, {value: amount});
  //   const buyReceiptAffiliate = await buyTxAffiliate.wait();

  //   const gasUsed = [
  //     buyReceipt,
  //     buyReceiptAffiliate,
  //   ].map((r) => r.gasUsed)

  //   // maybe make a fn that maps named inputs to their ordering in table?
  //   const sizeString = (size + 1).toString()
  //   totalGas.push([sizeString, ...gasUsed.map(formatBN)])
  //   totalGasUSD.push([
  //     sizeString,
  //     ...gasUsed.map((bn) =>
  //       formatBNToCurrency(bn, {
  //         minimumFractionDigits: 2,
  //         maximumFractionDigits: 2,
  //       }),
  //     ),
  //   ])
  //   perCapitaGas.push([
  //     sizeString,
  //     ...gasUsed.map((bn) => formatBN(bn.div(size + 1))),
  //   ])
  //   perCapitaGasUSD.push([
  //     sizeString,
  //     ...gasUsed.map((bn) =>
  //       formatBNToCurrency(bn.div(size + 1), {
  //         minimumFractionDigits: 2,
  //         maximumFractionDigits: 2,
  //       }),
  //     ),
  //   ])
  // }

  // const head = [
  //   'Target address count',
  //   'TSM.buy',
  //   'TSM.buy with affiliate',
  // ]
  // const alignment = Array(head.length).fill(Align.Right)

  // const totalTable = getMarkdownTable({
  //   table: {
  //     head,
  //     body: totalGas,
  //   },
  //   alignment,
  // })

  // console.log()
  // console.log('Total Gas')
  // console.log(totalTable)

  // const perCapitaTable = getMarkdownTable({
  //   table: {
  //     head,
  //     body: perCapitaGas,
  //   },
  //   alignment,
  // })

  // console.log()
  // console.log('Gas per target address')
  // console.log(perCapitaTable)

  // const totalTableUSD = getMarkdownTable({
  //   table: {
  //     head,
  //     body: totalGasUSD,
  //   },
  //   alignment,
  // })

  // console.log()
  // console.log(
  //   `Total Gas (in USD assuming ${GAS_PRICE} gwei gas & $${ETH_PRICE} ETH)`,
  // )
  // console.log(totalTableUSD)

  // const perCapitaTableUSD = getMarkdownTable({
  //   table: {
  //     head,
  //     body: perCapitaGasUSD,
  //   },
  //   alignment,
  // })

  // console.log()
  // console.log(
  //   `Gas per target address (in USD assuming ${GAS_PRICE} gwei gas & $${ETH_PRICE} ETH)`,
  // )
  // console.log(perCapitaTableUSD)
})
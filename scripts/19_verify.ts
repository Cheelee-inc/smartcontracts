const hre = require("hardhat");

export async function verify(address: string, args: any) {
  try {
    return hre.run("verify:verify", {address: address, constructorArguments: args,});
  } catch(e) {
    console.log(e);
  }
}

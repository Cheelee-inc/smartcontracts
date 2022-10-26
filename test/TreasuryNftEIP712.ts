
export interface WithdrawNFTSignature {
    nonce: number;
    id: number;
    address_to: string;
    ttl: number;
    option: number;
}
  
export const Pass = {
    WithdrawNFTSignature: [
        { name: "nonce", type: "uint256" },
        { name: "id", type: "uint256" },
        { name: "address_to", type: "address" },
        { name: "ttl", type: "uint256" },
        { name: "option", type: "uint256" },
    ],
};

export function eip712Domain(
    contractAddress: string,
    chainId: any
): Record<string, any> {
    return {
        name: "TREASURY",
        version: "1",
        chainId: chainId,
        verifyingContract: contractAddress,
    };
}

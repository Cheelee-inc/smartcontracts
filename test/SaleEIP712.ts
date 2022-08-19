export interface PurchaseSignature {
    id: number;
    address_to: string;
    ttl_timestamp: number;
  }
  
//PurchaseSignature(uint256 id,address address_to,uint256 ttl_timestamp)

  export const Pass = {
    PurchaseSignature: [
      { name: "id", type: "uint256" },
      { name: "address_to", type: "address" },
      { name: "ttl_timestamp", type: "uint256" },
    ],
  };
  
  export function eip712Domain(
    contractAddress: string,
    chainId: any
  ): Record<string, any> {
    return {
      name: "NFTSale",
      version: "1",
      chainId: chainId,
      verifyingContract: contractAddress,
    };
  }
  
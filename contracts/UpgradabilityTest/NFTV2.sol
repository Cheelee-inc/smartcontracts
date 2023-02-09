// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {NFT} from "../NFT.sol";

contract NFTV2 is NFT {
    bool flag;

    function setFlag() external onlyOwner {
        flag = true;
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override {
        require(flag == false, "FORBIDDEN");
    }
}

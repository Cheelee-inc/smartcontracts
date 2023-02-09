// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {LEE} from "../LEE.sol";

contract LEEV2 is LEE {
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

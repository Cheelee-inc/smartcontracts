// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {CHEEL} from "../CHEEL.sol";

contract CHEELV2 is CHEEL {
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

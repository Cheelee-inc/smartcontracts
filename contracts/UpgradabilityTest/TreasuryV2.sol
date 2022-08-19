// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Treasury} from "../Treasury.sol";

contract TreasuryV2 is Treasury {
    uint256 public value;

    function setValue() external {
        value = 42;
    }

    function getValue() external view returns (uint256) {
        return value;
    }
}

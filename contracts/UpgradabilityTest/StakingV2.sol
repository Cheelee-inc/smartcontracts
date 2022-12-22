// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {Staking} from "../Staking.sol";

contract StakingV2 is Staking {
    bool public flag;

    function withdraw(uint256 _option) external override {
        flag = true;
    }
}

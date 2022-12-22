// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {MultiVesting} from "../MultiVesting.sol";

contract MultiVestingV2 is MultiVesting {
    bool public flag;

    function setFlag() external onlyOwner {
        flag = true;
    }

    function vest(
        address _beneficiaryAddress,
        uint256 _startTimestamp,
        uint256 _durationSeconds,
        uint256 _amount,
        uint256 _cliff
    ) external override {
        require(flag == true, "FORBIDDEN");
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./interfaces/IERC20Mintable.sol";
import "./interfaces/IVesting.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MultiVesting is IVesting, Ownable {
    IERC20Mintable public immutable token;
    address public saleContract;

    mapping(address => uint256) public released;

    mapping(address => Beneficiary) public beneficiary;

    constructor(IERC20Mintable _token) {
        token = _token;
    }

    function setSaleContract(address _addr) external onlyOwner {
        saleContract = _addr;
    }

    /**
        _cliff = duration in seconds
        _duration = duration in seconds
        _startTimestamp = timestamp
    */
    function vest(
        address _beneficiaryAddress,
        uint256 _startTimestamp,
        uint256 _durationSeconds,
        uint256 _amount,
        uint256 _cliff
    ) external override {
        require(msg.sender == saleContract, "Only sale contract can call");
        require(
            _beneficiaryAddress != address(0),
            "beneficiary is zero address"
        );

        beneficiary[_beneficiaryAddress].start = _startTimestamp;
        beneficiary[_beneficiaryAddress].duration = _durationSeconds;
        beneficiary[_beneficiaryAddress].cliff = _cliff;
        beneficiary[_beneficiaryAddress].amount += _amount;
    }

    function release(address _beneficiaryAddress) external override {
        (uint256 _releasableAmount, ) = _releasable(
            msg.sender,
            block.timestamp
        );

        require(_releasableAmount > 0, "Can't claim yet!");

        released[_beneficiaryAddress] += _releasableAmount;
        token.transfer(_beneficiaryAddress, _releasableAmount);

        emit Released(_releasableAmount, msg.sender);
    }

    function releasable(address _beneficiary, uint256 _timestamp)
        external
        view
        override
        returns (uint256 canClaim, uint256 earnedAmount)
    {
        return _releasable(_beneficiary, _timestamp);
    }

    function _releasable(address _beneficiary, uint256 _timestamp)
        internal
        view
        returns (uint256 canClaim, uint256 earnedAmount)
    {
        (canClaim, earnedAmount) = _vestingSchedule(
            _beneficiary,
            beneficiary[_beneficiary].amount,
            _timestamp
        );
        canClaim -= released[_beneficiary];
    }

    function vestedAmountBeneficiary(address _beneficiary, uint256 _timestamp)
        external
        view
        override
        returns (uint256 vestedAmount, uint256 maxAmount)
    {
        return _vestedAmountBeneficiary(_beneficiary, _timestamp);
    }

    function _vestedAmountBeneficiary(address _beneficiary, uint256 _timestamp)
        internal
        view
        returns (uint256 vestedAmount, uint256 maxAmount)
    {
        // maxAmount = token.balanceOf(address(this)) + _released;
        maxAmount = beneficiary[_beneficiary].amount;
        (, vestedAmount) = _vestingSchedule(
            _beneficiary,
            maxAmount,
            _timestamp
        );
    }

    function _vestingSchedule(
        address _beneficiary,
        uint256 _totalAllocation,
        uint256 _timestamp
    ) internal view returns (uint256, uint256) {
        if (_timestamp < beneficiary[_beneficiary].start) {
            return (0, 0);
        } else if (
            _timestamp >
            beneficiary[_beneficiary].start + beneficiary[_beneficiary].duration
        ) {
            return (_totalAllocation, _totalAllocation);
        } else {
            uint256 res = (_totalAllocation *
                (_timestamp - beneficiary[_beneficiary].start)) /
                beneficiary[_beneficiary].duration;

            if (
                _timestamp <
                beneficiary[_beneficiary].start +
                    beneficiary[_beneficiary].cliff
            ) return (0, res);
            else return (res, res);
        }
    }

    function emergancyVest() external override onlyOwner {
        token.transfer(owner(), token.balanceOf(address(this)));
    }
}

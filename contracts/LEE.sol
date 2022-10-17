// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract LEE is ERC20, Ownable {
    uint256 public constant MAX_SUPPLY = 7000000000 * 10**18;
    uint256 constant secondsPerDay = 86400;

    uint256[] public emission = [
        1750000000000000000000000000,
        3150000000000000000000000000,
        4550000000000000000000000000,
        5600000000000000000000000000,
        6300000000000000000000000000,
        MAX_SUPPLY
    ];

    uint256[] public daysIncremented = [30, 61, 91, 122, 153, 181];

    uint256 public immutable createDate;
    uint256 public constant DAYS_INCREMENTED_LENGTH = 6;

    constructor(uint256 _createDate) ERC20("CHEELE Attention Token", "LEE") {
        createDate = _createDate;
    }

    function mint(address _to, uint256 _amount) external onlyOwner {
        require(
            totalSupply() + _amount <= currentSupply(block.timestamp),
            "Can't mint more then max amount"
        );
        _mint(_to, _amount);
    }

    function canMint(uint256 _timestamp)
        external
        view
        onlyOwner
        returns (uint256)
    {
        return currentSupply(_timestamp) - totalSupply();
    }

    function burn(address _from, uint256 _amount) external onlyOwner {
        _burn(_from, _amount);
    }

    function currentSupply(uint256 _currentTimestamp)
        public
        view
        returns (uint256)
    {
        uint256 _secondsPassed = secondsPassed(_currentTimestamp);
        uint256 dayNow = _secondsPassed / secondsPerDay;
        uint256 index = findUpperBound(dayNow);
        uint256 timePassed;
        uint256 interval;

        if (index == DAYS_INCREMENTED_LENGTH - 1) {
            return MAX_SUPPLY;
        } else if (index > 0) {
            timePassed = _secondsPassed - daysIncremented[index - 1] * secondsPerDay;
            interval =
                (daysIncremented[index] - daysIncremented[index - 1]) *
                secondsPerDay;
            return
                emission[index - 1] +
                ((emission[index] - emission[index - 1]) * timePassed) /
                interval;
        } else {
            timePassed = _secondsPassed;
            interval = daysIncremented[index] * secondsPerDay;
            return (emission[index] * timePassed) / interval;
        }
    }

    function findUpperBound(uint256 _element) internal view returns (uint256) {
        uint256 low = 0;
        uint256 high = DAYS_INCREMENTED_LENGTH - 1;
        uint256 mid;

        while (low < high) {
            mid = (low + high) / 2;

            if (daysIncremented[mid] > _element) {
                high = mid;
            } else {
                low = mid + 1;
            }
        }

        if (low > 0 && daysIncremented[low - 1] == _element) {
            return low - 1;
        } else {
            return low;
        }
    }

    function secondsPassed(uint256 _currentTimestamp)
        public
        view
        returns (uint256)
    {
        return _currentTimestamp - createDate;
    }
}

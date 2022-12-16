// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title Staking
/// @title Smart contract used to stake tokens
contract Staking is Ownable {
    using SafeERC20 for IERC20;

    event SetOptionState(uint256 option, bool state);
    event SetOption(
        uint256 option,
        uint256 lockPeriod,
        uint256 apy,
        uint256 minValue,
        uint256 maxValue
    );
    event AddOption(
        uint256 lockPeriod,
        uint256 apy,
        uint256 minValue,
        uint256 maxValue
    );

    IERC20 public immutable token;

    struct Status {
        uint256 balance;
        uint256 depositTimestamp;
        uint256 alreadyCollected;
    }

    uint256 private constant SECONDS_PER_YEAR = 8766 * 60 * 60;
    uint256 private constant SECONDS_PER_DAY = 86400;
    uint256 public constant DIVISOR = 100;

    uint256[] public lockPeriod = [
        30 * 24 * 60 * 60,
        90 * 24 * 60 * 60,
        180 * 24 * 60 * 60
    ];
    uint256[] public minAmount = [150 * 10**18, 1000 * 10**18, 4500 * 10**18];
    uint256[] public maxAmount = [1000 * 10**18, 4500 * 10**18, 2**256 - 1];
    uint256[] public apy = [109, 112, 116];
    mapping(uint256 => bool) public optionPaused;

    //option -> status
    mapping(uint256 => mapping(address => Status)) public status;

    mapping(address => bool) public registeredUserMap;
    address[] public registeredUsers;
    address public constant GNOSIS = 0x440637BBacBee76cc009A5C400fC9477a9e4F6Fc;

    constructor(IERC20 _token) {
        require(address(_token) != address(0), "Can't set zero address");
        token = _token;

        transferOwnership(GNOSIS);
    }

    /// @notice Returns number of users that user that have staked
    function getRegisteredUsersSize() external view returns (uint256) {
        return registeredUsers.length;
    }

    /// @notice Returns staking info on users [_from, _to] within given option
    function getRegisteredUsersSample(
        uint256 _from,
        uint256 _to,
        uint256 _option
    ) external view returns (Status[] memory) {
        require(_from <= _to, "from can't be less then to");
        require(_from <= registeredUsers.length, "from too big");

        Status[] memory arr = new Status[](_to - _from);

        for (uint256 i = _from; i < _to; i++) {
            arr[i - _from] = status[_option][registeredUsers[i]];
        }

        return arr;
    }

    /// @notice Enable/disable option, only for owner
    function setOptionState(uint256 _option, bool _state) external onlyOwner {
        optionPaused[_option] = _state;

        emit SetOptionState(_option, _state);
    }

    /// @notice Update option, only for owner
    function setOption(
        uint256 _option,
        uint256 _lockPeriod,
        uint256 _apy,
        uint256 _minValue,
        uint256 _maxValue
    ) public onlyOwner {
        require(_maxValue >= _minValue, "maxValue must be => minValue");
        require(_apy > 100, "apy too low");

        lockPeriod[_option] = _lockPeriod;
        apy[_option] = _apy;
        minAmount[_option] = _minValue;
        maxAmount[_option] = _maxValue;

        emit SetOption(_option, _lockPeriod, _apy, _minValue, _maxValue);
    }

    /// @notice Change settings for an option, only for owner
    function addOption(
        uint256 _lockPeriod,
        uint256 _apy,
        uint256 _minValue,
        uint256 _maxValue
    ) external onlyOwner {
        require(_maxValue >= _minValue, "maxValue must be => minValue");
        require(_apy > 100, "apy too low");

        lockPeriod.push(_lockPeriod);
        apy.push(_apy);
        minAmount.push(_minValue);
        maxAmount.push(_maxValue);

        emit AddOption(_lockPeriod, _apy, _minValue, _maxValue);
    }

    function getRegisteredUsers() external view returns (address[] memory) {
        return registeredUsers;
    }

    /// @notice stake tokens for selected option
    function deposit(uint256 _amount, uint256 _option) external {
        require(!optionPaused[_option], "Deposit for this option paused");
        require(status[_option][msg.sender].balance == 0, "Already staked");
        require(_amount > 0, "amount can't be 0");

        if (!registeredUserMap[msg.sender]) {
            registeredUserMap[msg.sender] = true;
            registeredUsers.push(msg.sender);
        }

        require(
            _amount >= minAmount[_option] && _amount <= maxAmount[_option],
            "Not enough tokens"
        );

        status[_option][msg.sender].balance = _amount;
        status[_option][msg.sender].depositTimestamp = block.timestamp;

        token.safeTransferFrom(msg.sender, address(this), _amount);
    }

    /// @notice return staked tokens
    function withdraw(uint256 _option) external {
        require(
            block.timestamp - status[_option][msg.sender].depositTimestamp >
                lockPeriod[_option],
            "Lock period hasn't passed"
        );
        _collect(_option);
        uint256 amount = status[_option][msg.sender].balance;
        status[_option][msg.sender].balance = 0;
        status[_option][msg.sender].depositTimestamp = 0;
        status[_option][msg.sender].alreadyCollected = 0;

        token.safeTransfer(msg.sender, amount);
    }

    /// @notice Returns amount of tokens earned
    function earned(address _addr, uint256 _option)
        public
        view
        returns (uint256 _canCollect, uint256 _earned)
    {
        uint256 balance = status[_option][_addr].balance;

        uint256 timePassed = block.timestamp -
            status[_option][_addr].depositTimestamp;
        uint256 _amount = ((((balance * apy[_option]) / DIVISOR - balance) *
            timePassed) / SECONDS_PER_YEAR);

        _earned = _amount - status[_option][_addr].alreadyCollected;

        if (timePassed > lockPeriod[_option]) _canCollect = _earned;
        else _canCollect = 0;
    }

    function _collect(uint256 _option) internal {
        (uint256 _amount, ) = earned(msg.sender, _option);
        status[_option][msg.sender].alreadyCollected += _amount;
        token.safeTransfer(msg.sender, _amount);
    }

    /// @notice Collect tokens earned from staking, only on Fridays!
    function collect(uint256 _option) external {
        require(
            ((block.timestamp / SECONDS_PER_DAY) + 4) % 7 == 5,
            "Can collect only on Fridays"
        );
        _collect(_option);
    }
}

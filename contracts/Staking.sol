// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Staking {
    IERC20 public immutable token;

    struct Status {
        uint256 balance;
        uint256 depositTimestamp;
        uint256 alreadyCollected;
    }

    uint256 private constant SECONDS_PER_YEAR = 8764 * 60 * 60;
    uint256 constant secondsPerDay = 86400;
    uint256[3] public lockPeriod = [
        30 * 24 * 60 * 60,
        90 * 24 * 60 * 60,
        180 * 24 * 60 * 60
    ];

    uint256[3] public apy = [109, 112, 116];
    uint256[3] public minAmount = [150 ether, 1000 ether, 4500 ether];
    uint256[3] public maxAmount = [1000 ether, 4500 ether, 2**256 - 1];
    uint256 public constant DIVISOR = 100;

    //option -> status
    mapping(uint256 => mapping(address => Status)) public status;

    mapping(address => bool) public registeredUserMap;
    address[] public registeredUsers;

    constructor(IERC20 _token) {
        token = _token;
    }

    function getRegisteredUsers() external view returns (address[] memory) {
        return registeredUsers;
    }

    function deposit(uint256 _amount, uint256 _option) external {
        require(status[_option][msg.sender].balance == 0, "Already staked");

        if (registeredUserMap[msg.sender] == false) {
            registeredUserMap[msg.sender] = true;
            registeredUsers.push(msg.sender);
        }

        if (_option == 0)
            require(
                _amount >= minAmount[_option] && _amount < maxAmount[_option],
                "Not enough tokens"
            );
        if (_option == 1)
            require(
                _amount >= minAmount[_option] && _amount < maxAmount[_option],
                "Not enough tokens"
            );
        if (_option == 2)
            require(
                _amount >= minAmount[_option] && _amount < maxAmount[_option],
                "Not enough tokens"
            );

        status[_option][msg.sender].balance = _amount;
        status[_option][msg.sender].depositTimestamp = block.timestamp;

        token.transferFrom(msg.sender, address(this), _amount);
    }

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

        token.transfer(msg.sender, amount);
    }

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
        status[_option][msg.sender].alreadyCollected = _amount;
        token.transfer(msg.sender, _amount);
    }

    function collect(uint256 _option) public {
        require(
            ((block.timestamp / secondsPerDay) + 4) % 7 == 5,
            "Can collect only on Fridays"
        );
        _collect(_option);
    }
}

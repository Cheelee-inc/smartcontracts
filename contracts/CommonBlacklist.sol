// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "./interfaces/ICommonBlacklist.sol";

contract CommonBlacklist is ICommonBlacklist, OwnableUpgradeable, AccessControlUpgradeable {

    bytes32 public constant BLACKLIST_OPERATOR_ROLE = keccak256("BLACKLIST_OPERATOR_ROLE");
    address public constant GNOSIS = 0xe69C24fA49FC2fF52305E4300D627a9094b648f5;

    // user
    // is_blacklisted
    mapping(address => bool) public blacklist;

    // token
    // user
    // is_blacklisted
    mapping(address => mapping (address => bool)) public internal_blacklist;


    // token
    // limits struct { day, month }
    mapping(address => TokenLimit) public token_limits;

    // token
    // user
    // day
    // amount
    mapping(address => mapping (address => mapping (uint256 => uint256))) public token_day_transfers;

    // token
    // user
    // month
    // amount
    mapping(address => mapping (address => mapping (uint256 => uint256))) public token_month_transfers;

    // token
    // has limit
    mapping(address => bool) public tokens_with_limits;

    // contract
    // has exception
    mapping(address => bool) public contracts_exclusion_list;

    // Events
    event SetTokenLimit(address token, uint256 dayLimit, uint256 monthLimit);
    event AddToExclusionList(address token);
    event RemoveFromExclusionList(address token);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    // Modifier for roles
    modifier onlyBlacklistOperator() {
        require(hasRole(BLACKLIST_OPERATOR_ROLE, _msgSender()), "Not a blacklist operator");
        _;
    }

    function initialize() external initializer {
        __AccessControl_init();
        __Ownable_init();

        transferOwnership(GNOSIS);
        _setupRole(DEFAULT_ADMIN_ROLE, GNOSIS);
    }

    /**
     * @notice Add user to global blacklist
     * @param _users: users array for adding to blacklist
     *
     * @dev Callable by blacklist operator
     *
     */
    function addUsersToBlacklist(
        address[] memory _users
    ) external onlyBlacklistOperator {
        for (uint i; i < _users.length; i++) {
            blacklist[_users[i]] = true;
        }
    }

    /**
     * @notice Remove users from global blacklist
     * @param _users: users array for removing from blacklist
     *
     * @dev Callable by blacklist operator
     *
     */
    function removeUsersFromBlacklist(
        address[] memory _users
    ) external onlyBlacklistOperator {
        for (uint i; i < _users.length; i++) {
            blacklist[_users[i]] = false;
        }
    }

    /**
     * @notice Add user to internal blacklist
     * @param _token: address of token contract
     * @param _users: users array for adding to blacklist
     *
     * @dev Callable by blacklist operator
     *
     */
    function addUsersToInternalBlacklist(
        address _token,
        address[] memory _users
    ) external onlyBlacklistOperator {
        for (uint i; i < _users.length; i++) {
            internal_blacklist[_token][_users[i]] = true;
        }
    }

    /**
     * @notice Remove users from internal blacklist
     * @param _token: address of token contract
     * @param _users: users array for removing from blacklist
     *
     * @dev Callable by blacklist operator
     *
     */
    function removeUsersFromInternalBlacklist(
        address _token,
        address[] memory _users
    ) external onlyBlacklistOperator {
        for (uint i; i < _users.length; i++) {
            internal_blacklist[_token][_users[i]] = false;
        }
    }

    /**
     * @notice Function returns current day
     */
    function getCurrentDay() public view returns(uint256) {
        return block.timestamp / 1 days;
    }

    /**
     * @notice Function returns current month
     */
    function getCurrentMonth() public view returns(uint256) {
        return block.timestamp / 30 days;
    }

    /**
     * @notice Setting token limits
     * @param _dayLimit: day limit for token transfer
     * @param _monthLimit: month limit for token transfer
     *
     * @dev Callable by blacklist operator
     *
     */
    function settingTokenLimits(
        address _token,
        uint256 _dayLimit,
        uint256 _monthLimit
    ) external onlyBlacklistOperator {
        token_limits[_token] = TokenLimit(_dayLimit, _monthLimit);
        tokens_with_limits[_token] = _dayLimit != 0 || _monthLimit != 0;

        emit SetTokenLimit(_token, _dayLimit, _monthLimit);
    }

    /**
     * @notice Save user transfers
     * @param _user: user address
     * @param _amount: amount of tokens
     *
     */
    function saveUserTransfers(
        address _user,
        uint256 _amount
    ) external {
        if (tokens_with_limits[msg.sender]) {
            uint256 currentDay = getCurrentDay();
            uint256 currentMonth = getCurrentMonth();

            token_day_transfers[msg.sender][_user][currentDay] += _amount;
            token_month_transfers[msg.sender][_user][currentMonth] += _amount;
        }
    }

    /**
     * @notice Adding Contracts to exclusion list
     * @param _contract: address of contract
     *
     * @dev Callable by blacklist operator
     *
     */
    function addContractToExclusionList(
        address _contract
    ) external onlyBlacklistOperator {
        contracts_exclusion_list[_contract] = true;

        emit AddToExclusionList(_contract);
    }

    /**
     * @notice Removing Contracts from exclusion list
     * @param _contract: address of contract
     *
     * @dev Callable by blacklist operator
     *
     */
    function removeContractFromExclusionList(
        address _contract
    ) external onlyBlacklistOperator {
        contracts_exclusion_list[_contract] = false;

        emit RemoveFromExclusionList(_contract);
    }

    /**
     * @notice Getting information if user blacklisted
     * @param _user: user address
     *
     */
    function userIsBlacklisted(
        address _user
    ) external view returns(bool) {
        return blacklist[_user];
    }

    /**
     * @notice Getting information if user in internal blacklist
     * @param _token: address of token contract
     * @param _user: user address
     *
     */
    function userIsInternalBlacklisted(
        address _token,
        address _user
    ) external view returns(bool) {
        return internal_blacklist[_token][_user];
    }

    /**
     * @notice Checking the user for the limits used per day
     * @param _token: address of token contract
     * @param _user: user address
     * @param _amount: amount of tokens
     *
     */
    function dayLimitIsReached(
        address _token,
        address _user,
        uint256 _amount
    ) external view returns(bool) {
        uint256 currentDay = getCurrentDay();

        if (!tokens_with_limits[_token] || contracts_exclusion_list[_user]) {
            return true;
        }

        return token_day_transfers[_token][_user][currentDay] + _amount <= token_limits[_token].day;
    }

    /**
     * @notice Checking the user for the limits used per month
     * @param _token: address of token contract
     * @param _user: user address
     * @param _amount: amount of tokens
     *
     */
    function monthLimitIsReached(
        address _token,
        address _user,
        uint256 _amount
    ) external view returns(bool) {
        uint256 currentMonth = getCurrentMonth();

        if (!tokens_with_limits[_token] || contracts_exclusion_list[_user]) {
            return true;
        }

        return token_month_transfers[_token][_user][currentMonth] + _amount <= token_limits[_token].month;
    }

    /**
     * @notice Getting token limits
     * @param _token: address of token contract
     *
     */
    function getTokenLimits(
        address _token
    ) external view returns(TokenLimit memory) {
        return token_limits[_token];
    }

    /**
     * @notice Getting user token day transfers
     * @param _token: address of token contract
     * @param _user: user address
     *
     */
    function getUserTokenDayTransfers(
        address _token,
        address _user
    ) external view returns(uint256) {
        uint256 currentDay = getCurrentDay();
        return token_day_transfers[_token][_user][currentDay];
    }

    /**
     * @notice Getting user token month transfers
     * @param _token: address of token contract
     * @param _user: user address
     *
     */
    function getUserTokenMonthTransfers(
        address _token,
        address _user
    ) external view returns(uint256) {
        uint256 currentMonth = getCurrentMonth();
        return token_month_transfers[_token][_user][currentMonth];
    }
}

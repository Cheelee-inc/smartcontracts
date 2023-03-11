// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "./interfaces/ICommonBlacklist.sol";

contract CommonBlacklist is ICommonBlacklist, OwnableUpgradeable, AccessControlUpgradeable {

    bytes32 public constant BLACKLIST_OPERATOR_ROLE = keccak256("BLACKLIST_OPERATOR_ROLE");
    address public constant GNOSIS = 0x126481E4E79cBc8b4199911342861F7535e76EE7;

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
    // has day limit
    mapping(address => bool) public tokens_with_day_limits;

    // token
    // has month limit
    mapping(address => bool) public tokens_with_month_limits;

    // contract
    // has exception
    mapping(address => bool) public contracts_exclusion_list;

    // Events
    event SetTokenLimit(address token, uint256 dayLimit, uint256 monthLimit);
    event SetTokenLimitStatus(address token, bool dayLimit, bool monthLimit);
    event AddToExclusionList(address token);
    event RemoveFromExclusionList(address token);

    uint256[50] __gap;

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

        contracts_exclusion_list[address(0)] = true;

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
            require(_users[i] != address(0), "Cannot be zero address");

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
            require(_users[i] != address(0), "Cannot be zero address");

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
     * @notice Getting information if user blacklisted
     * @param _sender: sender address
     * @param _from: from address
     * @param _to: to address
     *
     */
    function userIsBlacklisted(
        address _sender,
        address _from,
        address _to
    ) external view returns(bool) {
        return blacklist[_sender] || blacklist[_from] || blacklist[_to];
    }

    /**
     * @notice Getting information if user in internal blacklist
     * @param _token: address of token contract
     * @param _sender: sender address
     * @param _from: from address
     * @param _to: to address
     *
     */
    function userIsInternalBlacklisted(
        address _token,
        address _sender,
        address _from,
        address _to
    ) external view returns(bool) {
        return internal_blacklist[_token][_sender] || internal_blacklist[_token][_from] || internal_blacklist[_token][_to];
    }

    /**
     * @notice Getting information about the presence of users from the list in the blacklist
     * @param _token: address of token contract
     * @param _users: list of user address
     *
     */
    function usersFromListIsBlacklisted(
        address _token,
        address[] memory _users
    ) external view returns(address[] memory) {
        uint256 length = 0;

        for (uint i; i < _users.length; i++) {
            bool hasMatch = _token == address(0) ? blacklist[_users[i]] : internal_blacklist[_token][_users[i]] || blacklist[_users[i]];
            if (hasMatch) {
                length += 1;
            }
        }

        address[] memory list = new address[](length);

        if (length == 0) {
            return list;
        }

        uint256 listCounter = 0;

        for (uint i; i < _users.length; i++) {
            bool hasMatch = _token == address(0) ? blacklist[_users[i]] : internal_blacklist[_token][_users[i]] || blacklist[_users[i]];
            if (hasMatch) {
                list[listCounter] = _users[i];
                listCounter++;
            }
        }

        return list;
    }

    /**
     * @notice Function returns current day
     */
    function getCurrentDay() public view returns(uint256) {
        (,, uint256 day) = _timestampToDate(block.timestamp);
        return day;
    }

    /**
     * @notice Function returns current month
     */
    function getCurrentMonth() public view returns(uint256) {
        (, uint256 month,) = _timestampToDate(block.timestamp);
        return month;
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
        if (tokens_with_day_limits[msg.sender]) {
            uint256 currentDay = getCurrentDay();

            token_day_transfers[msg.sender][_user][currentDay] += _amount;
        }

        if (tokens_with_month_limits[msg.sender]) {
            uint256 currentMonth = getCurrentMonth();

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
     * @notice Checking the user for the limits used per day
     * @param _token: address of token contract
     * @param _user: user address
     * @param _amount: amount of tokens
     *
     */
    function dayLimitAllows(
        address _token,
        address _user,
        uint256 _amount
    ) external view returns(bool) {
        uint256 currentDay = getCurrentDay();

        if (!tokens_with_day_limits[_token] || contracts_exclusion_list[_user]) {
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
    function monthLimitAllows(
        address _token,
        address _user,
        uint256 _amount
    ) external view returns(bool) {
        uint256 currentMonth = getCurrentMonth();

        if (!tokens_with_month_limits[_token] || contracts_exclusion_list[_user]) {
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
    ) public view returns(uint256) {
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
    ) public view returns(uint256) {
        uint256 currentMonth = getCurrentMonth();
        return token_month_transfers[_token][_user][currentMonth];
    }

    /**
     * @notice Disable/Enable token limits
     * @param _token: address of token contract
     * @param _dayLimit: for disabling day limits
     * @param _monthLimit: for disabling month limits
     *
     * @dev Callable by blacklist operator
     *
     */
    function changeDisablingTokenLimits(
        address _token,
        bool _dayLimit,
        bool _monthLimit
    ) external onlyBlacklistOperator {
        tokens_with_day_limits[_token] = _dayLimit;
        tokens_with_month_limits[_token] = _monthLimit;

        emit SetTokenLimitStatus(_token, _dayLimit, _monthLimit);
    }

    /**
     * @notice Getting remaining limit for user
     * @param _token: address of token contract
     * @param _user: user address
     *
     */
    function getUserRemainingLimit(
        address _token,
        address _user
    ) external view returns(uint256 dayRemaining, uint256 monthRemaining) {
        uint256 currentMonthTransfers = getUserTokenMonthTransfers(_token, _user);
        uint256 currentDayTransfers = getUserTokenDayTransfers(_token, _user);

        monthRemaining = uint256(token_limits[_token].month - currentMonthTransfers);
        dayRemaining = uint256(token_limits[_token].day - currentDayTransfers);
    }

    /**
     * @notice Getting current date from timestamp
     * @param _timestamp: Timestamp
     *
     */
    function _timestampToDate(
        uint256 _timestamp
    ) internal pure returns (uint256 year, uint256 month, uint256 day) {
        unchecked {
            uint256 SECONDS_PER_DAY = 24 * 60 * 60;
            int256 _days = int256(_timestamp / SECONDS_PER_DAY);

            int256 L = _days + 68569 + 2440588;
            int256 N = (4 * L) / 146097;
            L = L - (146097 * N + 3) / 4;
            int256 _year = (4000 * (L + 1)) / 1461001;
            L = L - (1461 * _year) / 4 + 31;
            int256 _month = (80 * L) / 2447;
            int256 _day = L - (2447 * _month) / 80;
            L = _month / 11;
            _month = _month + 2 - 12 * L;
            _year = 100 * (N - 49) + _year + L;

            year = uint256(_year);
            month = uint256(_month);
            day = uint256(_day);
        }
    }
}

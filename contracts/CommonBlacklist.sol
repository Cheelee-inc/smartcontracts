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
    // limits struct { inComeDay, inComeMonth, outComeDay, outComeMonth }
    mapping(address => TokenLimit) public token_limits;

    // token
    // user
    // date
    // transfers struct { inCome, outCome }
    mapping(address => mapping (address => mapping (uint256 => TokenTransfers))) public token_transfers;

    // token
    // has limit struct { hasInComeDayLimit, hasInComeMonthLimit, hasOutComeDayLimit, hasOutComeMonthLimit }
    mapping(address => TokenLimitDisabling) public tokens_with_limits;

    // contract
    // has exception
    mapping(address => bool) public contracts_exclusion_list;

    // Events
    event SetTokenLimit(address token, uint256 inComeDayLimit, uint256 inComeMonthLimit, uint256 outComeDayLimit, uint256 outComeMonthLimit);
    event SetTokenLimitStatus(address token, bool hasInComeDayLimit, bool hasInComeMonthLimit, bool hasOutComeDayLimit, bool hasOutComeMonthLimit);
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
        return getCurrentMonth() * 100 + day;
    }

    /**
     * @notice Function returns current month
     */
    function getCurrentMonth() public view returns(uint256) {
        (uint256 year, uint256 month,) = _timestampToDate(block.timestamp);

        return year * 100 + month;
    }

    /**
     * @notice Setting token limits
     * @param _token: address of token contract
     * @param _inComeDayLimit: day limit for income token transfer
     * @param _inComeMonthLimit: month limit for income token transfer
     * @param _outComeDayLimit: day limit for outcome token transfer
     * @param _outComeMonthLimit: month limit for outcome token transfer
     *
     * @dev Callable by blacklist operator
     *
     */
    function setTokenLimits(
        address _token,
        uint256 _inComeDayLimit,
        uint256 _inComeMonthLimit,
        uint256 _outComeDayLimit,
        uint256 _outComeMonthLimit
    ) external onlyBlacklistOperator {
        token_limits[_token] = TokenLimit(_inComeDayLimit, _inComeMonthLimit, _outComeDayLimit, _outComeMonthLimit);

        emit SetTokenLimit(_token, _inComeDayLimit, _inComeMonthLimit, _outComeDayLimit, _outComeMonthLimit);
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
     * @notice Checking the user for the limits allows
     * @param _from: spender user address
     * @param _to: recipient user address
     * @param _amount: amount of tokens
     *
     */
    function limitAllows(
        address _from,
        address _to,
        uint256 _amount
    ) external {
        uint256 currentMonth = getCurrentMonth();
        uint256 currentDay = getCurrentDay();
        address _token = msg.sender;

        if (tokens_with_limits[_token].hasOutComeDayLimit && !contracts_exclusion_list[_from]) {
            require(token_transfers[_token][_from][currentDay].outCome + _amount <= token_limits[_token].outComeDay, "Spender has reached the day limit");

            token_transfers[_token][_from][currentDay].outCome += _amount;
        }

        if (tokens_with_limits[_token].hasOutComeMonthLimit) {
            require(token_transfers[_token][_from][currentMonth].outCome + _amount <= token_limits[_token].outComeMonth, "Spender has reached the month limit");

            token_transfers[_token][_from][currentMonth].outCome += _amount;
        }

        if (tokens_with_limits[_token].hasInComeDayLimit && !contracts_exclusion_list[_to]) {
            require(token_transfers[_token][_to][currentDay].inCome + _amount <= token_limits[_token].inComeDay, "Recipient has reached the day limit");

            token_transfers[_token][_to][currentDay].inCome += _amount;
        }

        if (tokens_with_limits[_token].hasInComeMonthLimit && !contracts_exclusion_list[_to]) {
            require(token_transfers[_token][_to][currentMonth].inCome + _amount <= token_limits[_token].inComeMonth, "Recipient has reached the month limit");

            token_transfers[_token][_to][currentMonth].inCome += _amount;
        }
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
     * @notice Getting user token transfers
     * @param _token: address of token contract
     * @param _user: user address
     *
     */
    function getUserTokenTransfers(
        address _token,
        address _user
    ) public view returns(
        uint256 dayInComeTransfers,
        uint256 monthInComeTransfers,
        uint256 dayOutComeTransfers,
        uint256 monthOutComeTransfers
    ) {
        uint256 currentMonth = getCurrentMonth();
        uint256 currentDay = getCurrentDay();

        dayInComeTransfers = uint256(token_transfers[_token][_user][currentDay].inCome);
        monthInComeTransfers = uint256(token_transfers[_token][_user][currentMonth].inCome);
        dayOutComeTransfers = uint256(token_transfers[_token][_user][currentDay].outCome);
        monthOutComeTransfers = uint256(token_transfers[_token][_user][currentMonth].outCome);
    }

    /**
     * @notice Disable/Enable token limits
     * @param _token: address of token contract
     * @param _hasInComeDayLimit: for disabling income day limits
     * @param _hasInComeMonthLimit: for disabling income month limits
     * @param _hasOutComeDayLimit: for disabling outcome day limits
     * @param _hasOutComeMonthLimit: for disabling outcome month limits
     *
     * @dev Callable by blacklist operator
     *
     */
    function changeDisablingTokenLimits(
        address _token,
        bool _hasInComeDayLimit,
        bool _hasInComeMonthLimit,
        bool _hasOutComeDayLimit,
        bool _hasOutComeMonthLimit
    ) external onlyBlacklistOperator {
        tokens_with_limits[_token] = TokenLimitDisabling(
            _hasInComeDayLimit,
            _hasInComeMonthLimit,
            _hasOutComeDayLimit,
            _hasOutComeMonthLimit
        );

        emit SetTokenLimitStatus(
            _token,
            _hasInComeDayLimit,
            _hasInComeMonthLimit,
            _hasOutComeDayLimit,
            _hasOutComeMonthLimit
        );
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
    ) external view returns(
        uint256 dayInComeRemaining,
        uint256 monthInComeRemaining,
        uint256 dayOutComeRemaining,
        uint256 monthOutComeRemaining
    ) {
        (uint256 dayInComeTransfers,
        uint256 monthInComeTransfers,
        uint256 dayOutComeTransfers,
        uint256 monthOutComeTransfers) = getUserTokenTransfers(_token, _user);

        dayInComeRemaining = uint256(token_limits[_token].inComeDay - dayInComeTransfers);
        monthInComeRemaining = uint256(token_limits[_token].inComeMonth - monthInComeTransfers);
        dayOutComeRemaining = uint256(token_limits[_token].outComeDay - dayOutComeTransfers);
        monthOutComeRemaining = uint256(token_limits[_token].outComeMonth - monthOutComeTransfers);
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

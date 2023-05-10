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
    mapping(address => mapping (address => bool)) public internalBlacklist;


    // token
    // limits struct { dailyIncome, monthlyIncome, dailyOutcome, monthlyOutcome }
    mapping(address => TokenLimit) public tokenLimits;

    // token
    // user
    // date
    // transfers struct { income, outcome }
    mapping(address => mapping (address => mapping (uint256 => TokenTransfers))) public tokenTransfers;

    // token
    // has limit struct { hasDailyIncomeLimit, hasMonthlyIncomeLimit, hasDailyOutcomeLimit, hasMonthlyOutcomeLimit }
    mapping(address => TokenLimitDisabling) public tokensWithLimits;

    // contract
    // has exception
    mapping(address => bool) public contractsExclusionList;

    // Events
    event SetTokenLimit(address indexed token, uint256 dailyIncomeLimit, uint256 monthlyIncomeLimit, uint256 dailyOutcomeLimit, uint256 monthlyOutcomeLimit);
    event SetTokenLimitStatus(address indexed token, bool hasDailyIncomeLimit, bool hasMonthlyIncomeLimit, bool hasDailyOutcomeLimit, bool hasMonthlyOutcomeLimit);
    event AddToExclusionList(address indexed token);
    event RemoveFromExclusionList(address indexed token);

    uint256[50] private __gap;

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

        contractsExclusionList[address(0)] = true;

        transferOwnership(GNOSIS);

        _setupRole(DEFAULT_ADMIN_ROLE, GNOSIS);
        _setupRole(BLACKLIST_OPERATOR_ROLE, GNOSIS);
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
        mapping(address => bool) storage tokenInternalBlacklist = internalBlacklist[_token];

        for (uint i; i < _users.length; i++) {
            require(_users[i] != address(0), "Cannot be zero address");

            tokenInternalBlacklist[_users[i]] = true;
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
            internalBlacklist[_token][_users[i]] = false;
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
        mapping(address => bool) storage tokenInternalBlacklist = internalBlacklist[_token];

        return tokenInternalBlacklist[_sender] || tokenInternalBlacklist[_from] || tokenInternalBlacklist[_to];
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
            bool hasMatch = _token == address(0) ? blacklist[_users[i]] : internalBlacklist[_token][_users[i]] || blacklist[_users[i]];
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
            bool hasMatch = _token == address(0) ? blacklist[_users[i]] : internalBlacklist[_token][_users[i]] || blacklist[_users[i]];
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
        (uint256 year, uint256 month, uint256 day) = _timestampToDate(block.timestamp);
        return year * 10_000 + month * 100 + day;
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
     * @param _dailyIncomeLimit: day limit for income token transfer
     * @param _monthlyIncomeLimit: month limit for income token transfer
     * @param _dailyOutcomeLimit: day limit for outcome token transfer
     * @param _monthlyOutcomeLimit: month limit for outcome token transfer
     *
     * @dev Callable by blacklist operator
     *
     */
    function setTokenLimits(
        address _token,
        uint256 _dailyIncomeLimit,
        uint256 _monthlyIncomeLimit,
        uint256 _dailyOutcomeLimit,
        uint256 _monthlyOutcomeLimit
    ) external onlyBlacklistOperator {
        tokenLimits[_token] = TokenLimit(_dailyIncomeLimit, _monthlyIncomeLimit, _dailyOutcomeLimit, _monthlyOutcomeLimit);

        emit SetTokenLimit(_token, _dailyIncomeLimit, _monthlyIncomeLimit, _dailyOutcomeLimit, _monthlyOutcomeLimit);
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
        contractsExclusionList[_contract] = true;

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
        contractsExclusionList[_contract] = false;

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

        if (tokensWithLimits[_token].hasDailyOutcomeLimit && !contractsExclusionList[_from]) {
            require(tokenTransfers[_token][_from][currentDay].outcome + _amount <= tokenLimits[_token].dailyOutcome, "Spender has reached the day limit");

            tokenTransfers[_token][_from][currentDay].outcome += _amount;
        }

        if (tokensWithLimits[_token].hasMonthlyOutcomeLimit  && !contractsExclusionList[_from]) {
            require(tokenTransfers[_token][_from][currentMonth].outcome + _amount <= tokenLimits[_token].monthlyOutcome, "Spender has reached the month limit");

            tokenTransfers[_token][_from][currentMonth].outcome += _amount;
        }

        if (tokensWithLimits[_token].hasDailyIncomeLimit && !contractsExclusionList[_to]) {
            require(tokenTransfers[_token][_to][currentDay].income + _amount <= tokenLimits[_token].dailyIncome, "Recipient has reached the day limit");

            tokenTransfers[_token][_to][currentDay].income += _amount;
        }

        if (tokensWithLimits[_token].hasMonthlyIncomeLimit && !contractsExclusionList[_to]) {
            require(tokenTransfers[_token][_to][currentMonth].income + _amount <= tokenLimits[_token].monthlyIncome, "Recipient has reached the month limit");

            tokenTransfers[_token][_to][currentMonth].income += _amount;
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
        return tokenLimits[_token];
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
        uint256 dailyIncomeTransfers,
        uint256 monthlyIncomeTransfers,
        uint256 dailyOutcomeTransfers,
        uint256 monthlyOutcomeTransfers
    ) {
        uint256 currentMonth = getCurrentMonth();
        uint256 currentDay = getCurrentDay();

        TokenTransfers memory _day = tokenTransfers[_token][_user][currentDay];
        TokenTransfers memory _month = tokenTransfers[_token][_user][currentMonth];

        dailyIncomeTransfers = uint256(_day.income);
        monthlyIncomeTransfers = uint256(_month.income);
        dailyOutcomeTransfers = uint256(_day.outcome);
        monthlyOutcomeTransfers = uint256(_month.outcome);
    }

    /**
     * @notice Disable/Enable token limits
     * @param _token: address of token contract
     * @param _hasDailyIncomeLimit: for disabling income day limits
     * @param _hasMonthlyIncomeLimit: for disabling income month limits
     * @param _hasDailyOutcomeLimit: for disabling outcome day limits
     * @param _hasMonthlyOutcomeLimit: for disabling outcome month limits
     *
     * @dev Callable by blacklist operator
     *
     */
    function changeDisablingTokenLimits(
        address _token,
        bool _hasDailyIncomeLimit,
        bool _hasMonthlyIncomeLimit,
        bool _hasDailyOutcomeLimit,
        bool _hasMonthlyOutcomeLimit
    ) external onlyBlacklistOperator {
        tokensWithLimits[_token] = TokenLimitDisabling(
            _hasDailyIncomeLimit,
            _hasMonthlyIncomeLimit,
            _hasDailyOutcomeLimit,
            _hasMonthlyOutcomeLimit
        );

        emit SetTokenLimitStatus(
            _token,
            _hasDailyIncomeLimit,
            _hasMonthlyIncomeLimit,
            _hasDailyOutcomeLimit,
            _hasMonthlyOutcomeLimit
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
        uint256 dailyIncomeRemaining,
        uint256 monthlyIncomeRemaining,
        uint256 dailyOutcomeRemaining,
        uint256 monthlyOutcomeRemaining
    ) {
        (uint256 dailyIncomeTransfers,
        uint256 monthlyIncomeTransfers,
        uint256 dailyOutcomeTransfers,
        uint256 monthlyOutcomeTransfers) = getUserTokenTransfers(_token, _user);

        TokenLimit memory limits = tokenLimits[_token];

        if (dailyIncomeTransfers >= limits.dailyIncome)
            dailyIncomeRemaining = 0;
        else
            dailyIncomeRemaining = limits.dailyIncome - dailyIncomeTransfers;
        if (monthlyIncomeTransfers >= limits.monthlyIncome)
            monthlyIncomeRemaining = 0;
        else
            monthlyIncomeRemaining = limits.monthlyIncome - monthlyIncomeTransfers;
        if (dailyOutcomeTransfers >= limits.dailyOutcome)
            dailyOutcomeRemaining = 0;
        else
            dailyOutcomeRemaining = limits.dailyOutcome - dailyOutcomeTransfers;
        if (monthlyOutcomeTransfers >= limits.monthlyOutcome)
            monthlyOutcomeRemaining = 0;
        else
            monthlyOutcomeRemaining = limits.monthlyOutcome - monthlyOutcomeTransfers;
    }

    /**
     * @notice Getting current date from timestamp
     * @param _timestamp: Timestamp
     *
     */
    function _timestampToDate(
        uint256 _timestamp
    ) internal pure returns (uint256 year, uint256 month, uint256 day) {
        uint256 _secondsPerDay;
        uint256 _days;
        uint256 _l;
        uint256 _n;
        uint256 _year;
        uint256 _month;
        uint256 _day;

        unchecked {
            _secondsPerDay = 24 * 60 * 60;
            _days = _timestamp / _secondsPerDay;

            _l = _days + 68569 + 2440588;
            _n = (4 * _l) / 146097;
            _l = _l - (146097 * _n + 3) / 4;
            _year = (4000 * (_l + 1)) / 1461001;
            _l = _l - (1461 * _year) / 4 + 31;
            _month = (80 * _l) / 2447;
            _day = _l - (2447 * _month) / 80;
            _l = _month / 11;
            _month = _month + 2 - 12 * _l;
            _year = 100 * (_n - 49) + _year + _l;

            year = uint256(_year);
            month = uint256(_month);
            day = uint256(_day);
        }
    }
}

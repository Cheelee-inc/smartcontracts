// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

interface ICommonBlacklist {

    /**
     * @notice Limits struct
     */
    struct TokenLimit {
        uint256 inComeDay;
        uint256 inComeMonth;
        uint256 outComeDay;
        uint256 outComeMonth;
    }

    /**
     * @notice Limits struct
     */
    struct TokenTransfers {
        uint256 inCome;
        uint256 outCome;
    }

    /**
     * @notice Limits disabling struct
     */
    struct TokenLimitDisabling {
        bool hasInComeDayLimit;
        bool hasInComeMonthLimit;
        bool hasOutComeDayLimit;
        bool hasOutComeMonthLimit;
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
    ) external;

    /**
     * @notice Remove users from global blacklist
     * @param _users: users array for removing from blacklist
     *
     * @dev Callable by blacklist operator
     *
     */
    function removeUsersFromBlacklist(
        address[] memory _users
    ) external;

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
    ) external;

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
    ) external;

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
    ) external view returns(bool);

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
    ) external view returns(bool);

    /**
     * @notice Getting information about the presence of users from the list in the blacklist
     * @param _token: address of token contract
     * @param _users: list of user address
     *
     */
    function usersFromListIsBlacklisted(
        address _token,
        address[] memory _users
    ) external view returns(address[] memory);

    /**
     * @notice Function returns current day
     */
    function getCurrentDay() external view returns(uint256);

    /**
     * @notice Function returns current month
     */
    function getCurrentMonth() external view returns(uint256);

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
    function settingTokenLimits(
        address _token,
        uint256 _inComeDayLimit,
        uint256 _inComeMonthLimit,
        uint256 _outComeDayLimit,
        uint256 _outComeMonthLimit
    ) external;

    /**
     * @notice Save income user transfers
     * @param _from: from address
     * @param _to: to address
     * @param _amount: amount of tokens
     *
     */
    function saveUserTransfers(
        address _from,
        address _to,
        uint256 _amount
    ) external;

    /**
     * @notice Adding Contracts to exclusion list
     * @param _contract: address of contract
     *
     * @dev Callable by blacklist operator
     *
     */
    function addContractToExclusionList(
        address _contract
    ) external;

    /**
     * @notice Removing Contracts from exclusion list
     * @param _contract: address of contract
     *
     * @dev Callable by blacklist operator
     *
     */
    function removeContractFromExclusionList(
        address _contract
    ) external;

    /**
     * @notice Checking the user for the limits allows
     * @param _token: address of token contract
     * @param _from: spender user address
     * @param _to: recipient user address
     * @param _amount: amount of tokens
     *
     */
    function limitAllows(
        address _token,
        address _from,
        address _to,
        uint256 _amount
    ) external view returns(
        bool dayInComeLimitAllow,
        bool monthInComeLimitAllow,
        bool dayOutComeLimitAllow,
        bool monthOutComeLimitAllow
    );

    /**
     * @notice Getting token limits
     * @param _token: address of token contract
     *
     */
    function getTokenLimits(
        address _token
    ) external view returns(TokenLimit memory);

    /**
     * @notice Getting user token transfers
     * @param _token: address of token contract
     * @param _user: user address
     *
     */
    function getUserTokenTransfers(
        address _token,
        address _user
    ) external view returns(
        uint256 dayInComeTransfers,
        uint256 monthInComeTransfers,
        uint256 dayOutComeTransfers,
        uint256 monthOutComeTransfers
    );

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
    ) external;

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
    );
}

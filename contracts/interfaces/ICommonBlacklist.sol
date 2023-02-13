// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

interface ICommonBlacklist {

    /**
     * @notice Limits struct
     */
    struct TokenLimit {
        uint256 day;
        uint256 month;
    }

    /**
     * @notice Add user to blacklist
     * @param _users: users array for adding to blacklist
     *
     * @dev Callable by blacklist operator
     *
     */
    function addUsersToBlacklist(
        address[] memory _users
    ) external;

    /**
     * @notice Remove users from blacklist
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
    ) external;

    /**
     * @notice Save user transfers
     * @param _user: user address
     * @param _amount: amount of tokens
     *
     */
    function saveUserTransfers(
        address _user,
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
    ) external view returns(bool);

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
    ) external view returns(bool);

    /**
     * @notice Getting token limits
     * @param _token: address of token contract
     *
     */
    function getTokenLimits(
        address _token
    ) external view returns(TokenLimit memory);

    /**
     * @notice Getting user token day transfers
     * @param _token: address of token contract
     * @param _user: user address
     *
     */
    function getUserTokenDayTransfers(
        address _token,
        address _user
    ) external view returns(uint256);

    /**
     * @notice Getting user token month transfers
     * @param _token: address of token contract
     * @param _user: user address
     *
     */
    function getUserTokenMonthTransfers(
        address _token,
        address _user
    ) external view returns(uint256);
}

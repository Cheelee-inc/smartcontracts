// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

interface ICommonBlacklist {

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
     * @notice Getting information if user blacklisted
     * @param _user: user address
     *
     */
    function userIsBlacklisted(
        address _user
    ) external view returns(bool);

    /**
     * @notice Getting information if user in internal blacklist
     * @param _token: address of token contract
     * @param _user: user address
     *
     */
    function userIsInternalBlacklisted(
        address _token,
        address _user
    ) external view returns(bool);
}

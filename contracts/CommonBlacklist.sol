// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import './interfaces/ICommonBlacklist.sol';

contract CommonBlacklist is ICommonBlacklist, OwnableUpgradeable, AccessControlUpgradeable {

    bytes32 public constant BLACKLIST_OPERATOR_ROLE = keccak256("BLACKLIST_OPERATOR_ROLE");
    address public constant GNOSIS = 0xe69C24fA49FC2fF52305E4300D627a9094b648f5;

    mapping(address => bool) public blacklist;
    mapping(address => mapping (address => bool)) public internal_blacklist;

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
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import './interfaces/ICommonBlacklist.sol';

contract CommonBlacklist is ICommonBlacklist, OwnableUpgradeable, AccessControlUpgradeable {

    bytes32 public constant BLACKLIST_OPERATOR_ROLE = keccak256("BLACKLIST_OPERATOR_ROLE");
    address public constant GNOSIS = 0xe69C24fA49FC2fF52305E4300D627a9094b648f5;

    mapping(address => bool) public blacklist;

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
     * @notice Add user to blacklist
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
     * @notice Remove users from blacklist
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
     * @notice Getting information if user blacklisted
     * @param _user: user address
     *
     */
    function userIsBlacklisted(
        address _user
    ) external view returns(bool) {
        bool isBlacklisted = blacklist[_user];

        return isBlacklisted;
    }
}

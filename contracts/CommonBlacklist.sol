// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;
pragma abicoder v2;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import './interfaces/ICommonBlacklist.sol';

contract CommonBlacklist is ICommonBlacklist, UUPSUpgradeable, OwnableUpgradeable, AccessControlUpgradeable {
    bytes32 public constant BLACKLIST_OPERATOR_ROLE = keccak256("BLACKLIST_OPERATOR_ROLE");

    address public GNOSIS;

    mapping(address => bool) public blacklist;

    // Modifier for roles
    modifier onlyBlacklistOperator() {
        require(hasRole(BLACKLIST_OPERATOR_ROLE, _msgSender()), "Not a blacklist operator");
        _;
    }

    function initialize(
        address _GNOSIS
    ) external initializer {
        __AccessControl_init();
        __Ownable_init();

        GNOSIS = _GNOSIS;

        transferOwnership(_GNOSIS);
        _setupRole(DEFAULT_ADMIN_ROLE, _GNOSIS);
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

    receive() external payable {}
    fallback() external payable {}
    function _authorizeUpgrade(address) internal override onlyOwner {}
}

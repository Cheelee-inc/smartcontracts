// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;
pragma abicoder v2;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/draft-ERC20PermitUpgradeable.sol";
import './interfaces/ICommonBlacklist.sol';
import './interfaces/ILEE.sol';

contract LEE is ILEE, UUPSUpgradeable, ERC20PermitUpgradeable, OwnableUpgradeable, AccessControlUpgradeable {
    bytes32 public constant BLACKLIST_OPERATOR_ROLE = keccak256("BLACKLIST_OPERATOR_ROLE");

    ICommonBlacklist public commonBlacklist;
    uint256 public MAX_AMOUNT;
    address public GNOSIS;
    uint256[50] __gap;

    mapping(address => bool) public blacklist;

    // Modifier for roles
    modifier onlyBlacklistOperator() {
        require(hasRole(BLACKLIST_OPERATOR_ROLE, _msgSender()), "Not a blacklist operator");
        _;
    }

    function initialize(
        string memory _tokenName,
        string memory _tokenSymbol,
        uint256 _maxAmount,
        address _blackList,
        address _GNOSIS
    ) external initializer {
        __ERC20_init(_tokenName, _tokenSymbol);
        __ERC20Permit_init(_tokenName);

        __AccessControl_init();
        __Ownable_init();

        MAX_AMOUNT = _maxAmount * 10**18;
        GNOSIS = _GNOSIS;
        commonBlacklist = ICommonBlacklist(_blackList);

        transferOwnership(GNOSIS);
        _setupRole(DEFAULT_ADMIN_ROLE, _GNOSIS);
    }

    /**
     * @notice Mint tokens.
     * @param _to: recipient address
     * @param _amount: amount of tokens
     *
     * @dev Callable by owner
     *
     */
    function mint(
        address _to,
        uint256 _amount
    ) external onlyOwner {
        require(
            totalSupply() + _amount <= MAX_AMOUNT,
            "Can't mint more than max amount"
        );

        require(!blacklist[_to], "Recipient in internal blacklist");
        require(!commonBlacklist.userIsBlacklisted(_to), "Recipient in common blacklist");

        _mint(_to, _amount);
    }

    /**
     * @notice Burn tokens.
     * @param _amount: amount of tokens
     *
     * @dev Callable by owner
     *
     */
    function burn(
        uint256 _amount
    ) external onlyOwner {
        _burn(msg.sender, _amount);
    }

    /**
     * @notice Add user to blacklist
     * @param _users: users array for adding to blacklist
     * @dev Callable by blacklist operator
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
     * @dev Callable by blacklist operator
     */
    function removeUsersFromBlacklist(
        address[] memory _users
    ) external onlyBlacklistOperator {
        for (uint i; i < _users.length; i++) {
            blacklist[_users[i]] = false;
        }
    }

    /**
     * @notice Getting information if user in internal blacklist
     * @param _user: user address
     *
     */
    function userInBlacklist(
        address _user
    ) external view returns(bool) {
        bool isBlacklisted = blacklist[_user];

        return isBlacklisted;
    }

    /**
    * @dev Moves `amount` of tokens from `from` to `to`.
     *
     * This internal function is equivalent to {transfer}, and can be used to
     * e.g. implement automatic token fees, slashing mechanisms, etc.
     *
     * Emits a {Transfer} event.
     *
     * Requirements:
     *
     * - `from` cannot be the zero address.
     * - `to` cannot be the zero address.
     * - `from` must have a balance of at least `amount`.
     */
    function _transfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual override {
        require(!blacklist[from], "Sender in internal blacklist");
        require(!commonBlacklist.userIsBlacklisted(from), "Sender in common blacklist");
        require(!blacklist[to], "Recipient in internal blacklist");
        require(!commonBlacklist.userIsBlacklisted(to), "Recipient in common blacklist");

        address spender = _msgSender();

        require(!blacklist[spender], "Spender in internal blacklist");
        require(!commonBlacklist.userIsBlacklisted(spender), "Spender in common blacklist");

        super._transfer(from, to, amount);
    }

    /**
     * @dev Sets `amount` as the allowance of `spender` over the `owner` s tokens.
     *
     * This internal function is equivalent to `approve`, and can be used to
     * e.g. set automatic allowances for certain subsystems, etc.
     *
     * Emits an {Approval} event.
     *
     * Requirements:
     *
     * - `owner` cannot be the zero address.
     * - `spender` cannot be the zero address.
     */
    function _approve(
        address owner,
        address spender,
        uint256 amount
    ) internal virtual override {
        require(!blacklist[spender], "Spender in internal blacklist");
        require(!commonBlacklist.userIsBlacklisted(spender), "Spender in common blacklist");
        require(!blacklist[owner], "Sender in internal blacklist");
        require(!commonBlacklist.userIsBlacklisted(owner), "Sender in common blacklist");

        super._approve(owner, spender, amount);
    }


    receive() external payable {}
    fallback() external payable {}
    function _authorizeUpgrade(address) internal override onlyOwner {}
}

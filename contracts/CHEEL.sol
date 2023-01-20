// SPDX-License-Identifier: MIT

pragma solidity ^0.8.17;
pragma abicoder v2;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20VotesUpgradeable.sol";
import './interfaces/ICommonBlacklist.sol';
import './interfaces/ICHEEL.sol';

contract CHEEL is ICHEEL, UUPSUpgradeable, ERC20VotesUpgradeable, OwnableUpgradeable, AccessControlUpgradeable {
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
        __ERC20Votes_init();

        __AccessControl_init();
        __Ownable_init();

        MAX_AMOUNT = _maxAmount * 10**18;
        GNOSIS = _GNOSIS;
        commonBlacklist = ICommonBlacklist(_blackList);

        transferOwnership(_GNOSIS);
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
     * @dev See {IERC20-transfer}.
     *
     * Requirements:
     *
     * - `to` cannot be the zero address.
     * - the caller must have a balance of at least `amount`.
     */
    function transfer(address to, uint256 amount) public virtual override returns (bool) {
        require(!blacklist[to], "Recipient in internal blacklist");
        require(!commonBlacklist.userIsBlacklisted(to), "Recipient in common blacklist");

        address owner = _msgSender();

        require(!blacklist[owner], "Sender in internal blacklist");
        require(!commonBlacklist.userIsBlacklisted(owner), "Sender in common blacklist");

        _transfer(owner, to, amount);
        return true;
    }

    /**
     * @dev See {IERC20-transferFrom}.
     *
     * Emits an {Approval} event indicating the updated allowance. This is not
     * required by the EIP. See the note at the beginning of {ERC20}.
     *
     * NOTE: Does not update the allowance if the current allowance
     * is the maximum `uint256`.
     *
     * Requirements:
     *
     * - `from` and `to` cannot be the zero address.
     * - `from` must have a balance of at least `amount`.
     * - the caller must have allowance for ``from``'s tokens of at least
     * `amount`.
     */
    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) public virtual override returns (bool) {
        require(!blacklist[from], "Sender in internal blacklist");
        require(!commonBlacklist.userIsBlacklisted(from), "Sender in common blacklist");
        require(!blacklist[to], "Recipient in internal blacklist");
        require(!commonBlacklist.userIsBlacklisted(to), "Recipient in common blacklist");

        address spender = _msgSender();

        require(!blacklist[spender], "Spender in internal blacklist");
        require(!commonBlacklist.userIsBlacklisted(spender), "Spender in common blacklist");

        _spendAllowance(from, spender, amount);
        _transfer(from, to, amount);
        return true;
    }

    /**
     * @dev See {IERC20-approve}.
     *
     * NOTE: If `amount` is the maximum `uint256`, the allowance is not updated on
     * `transferFrom`. This is semantically equivalent to an infinite approval.
     *
     * Requirements:
     *
     * - `spender` cannot be the zero address.
     */
    function approve(address spender, uint256 amount) public virtual override returns (bool) {
        require(!blacklist[spender], "Spender in internal blacklist");
        require(!commonBlacklist.userIsBlacklisted(spender), "Spender in common blacklist");

        address owner = _msgSender();

        require(!blacklist[owner], "Sender in internal blacklist");
        require(!commonBlacklist.userIsBlacklisted(owner), "Sender in common blacklist");

        _approve(owner, spender, amount);
        return true;
    }

    receive() external payable {}
    fallback() external payable {}
    function _authorizeUpgrade(address) internal override onlyOwner {}
}

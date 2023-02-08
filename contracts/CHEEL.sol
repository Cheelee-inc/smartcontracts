// SPDX-License-Identifier: MIT

pragma solidity ^0.8.17;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20VotesUpgradeable.sol";
import './interfaces/ICommonBlacklist.sol';
import './interfaces/ICHEEL.sol';

contract CHEEL is ICHEEL, ERC20VotesUpgradeable, OwnableUpgradeable {

    uint256 public constant MAX_AMOUNT = 10**9 * 10**18;
    address public constant GNOSIS = 0x126481E4E79cBc8b4199911342861F7535e76EE7;
    uint256[50] __gap;
    ICommonBlacklist public commonBlacklist;

    event GlobalBlacklistUpdated(ICommonBlacklist blacklist);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        ICommonBlacklist _commonBlacklist
    ) external initializer {
        __ERC20_init("CHEELEE", "CHEEL");
        __ERC20Permit_init("CHEELEE");
        __ERC20Votes_init();

        __Ownable_init();

        commonBlacklist = _commonBlacklist;

        transferOwnership(GNOSIS);
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
     * @dev Hook that is called before any transfer of tokens. This includes
     * minting and burning.
     *
     * Calling conditions:
     *
     * - when `from` and `to` are both non-zero, `amount` of ``from``'s tokens
     * will be transferred to `to`.
     * - when `from` is zero, `amount` tokens will be minted for `to`.
     * - when `to` is zero, `amount` of ``from``'s tokens will be burned.
     * - `from` and `to` are never both zero.
     *
     * To learn more about hooks, head to xref:ROOT:extending-contracts.adoc#using-hooks[Using Hooks].
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual override {

        require(!commonBlacklist.userIsBlacklisted(from), "CHEEL: Spender in global blacklist");
        require(!commonBlacklist.userIsBlacklisted(to), "CHEEL: Recipient in global blacklist");
        require(!commonBlacklist.userIsBlacklisted(_msgSender()), "CHEEL: Sender in global blacklist");
        require(!commonBlacklist.userIsInternalBlacklisted(address(this), from), "CHEEL: Spender in internal blacklist");
        require(!commonBlacklist.userIsInternalBlacklisted(address(this), to), "CHEEL: Recipient in internal blacklist");
        require(!commonBlacklist.userIsInternalBlacklisted(address(this), _msgSender()), "CHEEL: Sender in internal blacklist");
        require(commonBlacklist.dayLimitIsReached(address(this), from, amount), "CHEEL: Spender has reached the day limit");
        require(commonBlacklist.monthLimitIsReached(address(this), from, amount), "CHEEL: Spender has reached the month limit");
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

        require(!commonBlacklist.userIsBlacklisted(owner), "CHEEL: Owner in global blacklist");
        require(!commonBlacklist.userIsBlacklisted(spender), "CHEEL: Spender in global blacklist");
        require(!commonBlacklist.userIsInternalBlacklisted(address(this), owner), "CHEEL: Owner in internal blacklist");
        require(!commonBlacklist.userIsInternalBlacklisted(address(this), spender), "CHEEL: Spender in internal blacklist");

        super._approve(owner, spender, amount);
    }

    /**
     * @dev Hook that is called after any transfer of tokens. This includes
     * minting and burning.
     *
     * Calling conditions:
     *
     * - when `from` and `to` are both non-zero, `amount` of ``from``'s tokens
     * has been transferred to `to`.
     * - when `from` is zero, `amount` tokens have been minted for `to`.
     * - when `to` is zero, `amount` of ``from``'s tokens have been burned.
     * - `from` and `to` are never both zero.
     *
     * To learn more about hooks, head to xref:ROOT:extending-contracts.adoc#using-hooks[Using Hooks].
     */
    function _afterTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual override {
        commonBlacklist.saveUserTransfers(from, amount);
    }
}

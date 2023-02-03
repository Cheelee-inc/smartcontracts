// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/draft-ERC20PermitUpgradeable.sol";
import './interfaces/ICommonBlacklist.sol';
import './interfaces/ILEE.sol';

contract LEE is ILEE, ERC20PermitUpgradeable, OwnableUpgradeable {

    uint256 public constant MAX_AMOUNT = 7 * 10**9 * 10**18;
    address public constant GNOSIS = 0xE6e74cA74e2209A5f2272f531627f44d34AFc299;
    uint256[50] __gap;
    ICommonBlacklist public commonBlacklist;

    event GlobalBlacklistUpdated(address blacklist);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _commonBlacklist
    ) external initializer {
        __ERC20_init("CHEELEE Attention Token", "LEE");
        __ERC20Permit_init("CHEELEE Attention Token");

        __Ownable_init();

        commonBlacklist = ICommonBlacklist(_commonBlacklist);

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
        require(!commonBlacklist.userIsBlacklisted(from), "LEE: Spender in global blacklist");
        require(!commonBlacklist.userIsBlacklisted(to), "LEE: Recipient in global blacklist");
        require(!commonBlacklist.userIsBlacklisted(_msgSender()), "LEE: Sender in global blacklist");
        require(!commonBlacklist.userIsInternalBlacklisted(address(this), from), "LEE: Spender in internal blacklist");
        require(!commonBlacklist.userIsInternalBlacklisted(address(this), to), "LEE: Recipient in internal blacklist");
        require(!commonBlacklist.userIsInternalBlacklisted(address(this), _msgSender()), "LEE: Sender in internal blacklist");
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
        require(!commonBlacklist.userIsBlacklisted(owner), "LEE: Owner in global blacklist");
        require(!commonBlacklist.userIsBlacklisted(spender), "LEE: Spender in global blacklist");
        require(!commonBlacklist.userIsInternalBlacklisted(address(this), owner), "LEE: Owner in internal blacklist");
        require(!commonBlacklist.userIsInternalBlacklisted(address(this), spender), "LEE: Spender in internal blacklist");

        super._approve(owner, spender, amount);
    }
}

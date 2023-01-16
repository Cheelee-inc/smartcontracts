// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/draft-ERC20PermitUpgradeable.sol";

contract LEE is UUPSUpgradeable, ERC20PermitUpgradeable, OwnableUpgradeable {
    uint256 public constant MAX_AMOUNT = 7 * 10**9 * 10**18;
    address public constant GNOSIS = 0xE6e74cA74e2209A5f2272f531627f44d34AFc299;
    uint256[50] __gap;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize() external initializer {
        __ERC20_init("CHEELEE Attention Token", "LEE");
        __ERC20Permit_init("CHEELEE Attention Token");

        __Ownable_init();

        transferOwnership(GNOSIS);
    }

    function mint(address _to, uint256 _amount) external onlyOwner {
        require(
            totalSupply() + _amount <= MAX_AMOUNT,
            "Can't mint more than max amount"
        );
        _mint(_to, _amount);
    }

    function burn(uint256 _amount) external onlyOwner {
        _burn(msg.sender, _amount);
    }

    receive() external payable {}
    fallback() external payable {}
    function _authorizeUpgrade(address) internal override onlyOwner {}
}

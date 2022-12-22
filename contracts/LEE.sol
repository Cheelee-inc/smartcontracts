// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20VotesUpgradeable.sol";

contract LEE is ERC20VotesUpgradeable, OwnableUpgradeable {
    uint256 public constant MAX_AMOUNT = 7 * 10**9 * 10**18;
    address public constant GNOSIS = 0xE6e74cA74e2209A5f2272f531627f44d34AFc299;

    function initialize() external initializer {
        __ERC20_init("CHEELEE", "CHEEL");
        __ERC20Permit_init("CHEELEE");
        __ERC20Votes_init();

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
}

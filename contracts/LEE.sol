// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract LEE is ERC20, ERC20Permit, Ownable {
    uint256 public constant MAX_AMOUNT = 7 * 10**9 * 10**18;
    address public constant GNOSIS = 0xE6e74cA74e2209A5f2272f531627f44d34AFc299;

    constructor() ERC20("CHEELEE Attention Token", "LEE") ERC20Permit("LEE") {
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

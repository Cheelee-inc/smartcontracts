// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";

contract CHEEL is ERC20Votes, Ownable {
    uint256 public constant MAX_AMOUNT = 10**9 * 10**18;
    address public constant GNOSIS = 0x126481E4E79cBc8b4199911342861F7535e76EE7;

    constructor() ERC20("CHEELEE", "CHEEL") ERC20Permit("CHEELEE") {
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

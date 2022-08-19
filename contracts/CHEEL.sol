// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";

contract CHEEL is ERC20, Ownable, ERC20Permit, ERC20Votes {
    uint256 public constant MAX_AMOUNT = 1000000000 * 10**18;

    constructor() ERC20("CHEELEE", "CHEEL") ERC20Permit("CHEELEE") {}

    function _afterTokenTransfer(
        address _from,
        address _to,
        uint256 _amount
    ) internal override(ERC20, ERC20Votes) {
        super._afterTokenTransfer(_from, _to, _amount);
    }

    function _mint(address _to, uint256 _amount)
        internal
        override(ERC20, ERC20Votes)
        onlyOwner
    {
        super._mint(_to, _amount);
    }

    function _burn(address _from, uint256 _amount)
        internal
        override(ERC20, ERC20Votes)
        onlyOwner
    {
        super._burn(_from, _amount);
    }

    function mint(address _to, uint256 _amount) external onlyOwner {
        require(totalSupply() + _amount <= MAX_AMOUNT, "Max amount exceeded");
        _mint(_to, _amount);
    }

    function burn(address _from, uint256 _amount) external onlyOwner {
        _burn(_from, _amount);
    }
}

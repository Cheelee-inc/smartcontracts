// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IVesting.sol";

contract Admined {
	address public admin;

	constructor() {
		admin = msg.sender;
	}

	modifier onlyAdmin() {
		require(msg.sender == admin) ;
		_;
	}

	function transferAdminship(address newAdmin) onlyAdmin public  {
		admin = newAdmin;
	}
}

contract BulkVest is Admined {
    function bulkVest(
        address _vesting,
        address[] calldata addresses,
        uint256 _startTimestamp,
        uint256 _durationSeconds,
        uint256 _amount,
        uint256 _cliff
    ) public onlyAdmin {
        IVesting vesting = IVesting(_vesting);

	    for(uint256 i = 0; i < addresses.length; i++) {
	        vesting.vest(
                addresses[i],
                _startTimestamp,
                _durationSeconds,
                _amount,
                _cliff
            );
	    }
	}
}
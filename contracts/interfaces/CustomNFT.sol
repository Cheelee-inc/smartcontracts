// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

interface CustomNFT is IERC721 {
    function receiveNFT(address _to, uint256 _id) external;
}

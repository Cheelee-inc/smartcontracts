// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

interface ICustomNFT {

    /**
     * @notice Transfer or minting NFT from sale contract or treasury
     * @param _to: recipient address
     * @param _tokenId: token id
     *
     */
    function receiveNFT(
        address _to,
        uint256 _tokenId
    ) external;

    /**
     * @notice Mint nft.
     * @param _to: recipient address
     * @param _tokenId: token id
     *
     * @dev Callable by owner
     *
     */
    function safeMint(
        address _to,
        uint256 _tokenId
    ) external;

    /**
     * @notice Setting base uri for nft collection.
     * @param _uri: new base uri
     *
     * @dev Callable by owner
     *
     */
    function setUri(
        string memory _uri
    ) external;

    /**
     * @notice Setting NFT sale contract and treasury addresses
     * @param _nftSale: nft sale contract address
     * @param _treasury: treasury address
     *
     * @dev Callable by owner
     *
     */
    function setNftSaleAndTreasury(
        address _nftSale,
        address _treasury
    ) external;

    /**
     * @notice Getting information about owned tokens by user address
     * @param _addr: user address
     *
     */
    function tokensOwnedByUser(
        address _addr
    ) external view returns (uint256[] memory tokenIds);
}

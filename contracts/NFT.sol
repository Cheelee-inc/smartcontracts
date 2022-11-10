// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "./interfaces/CustomNFT.sol";

contract NFT is ERC721, ERC721Enumerable, CustomNFT, Ownable {
    event SetSaleAndTreasury(address sale, address treasury);
    event ReceiveNFT(address receiver, uint256 tokenId);
    event SetURI(string uri);

    string public NAME;
    string public VERSION;

    address public nftSale;
    address public treasury;
    address public constant GNOSIS = 0xC40b7fBb7160B98323159BA800e122C9DeD0668D;

    string public baseUri;

    constructor(string memory _name, string memory _version)
        ERC721(_name, _version)
    {
        NAME = _name;
        VERSION = _version;

        transferOwnership(constant GNOSIS);
    }

    function receiveNFT(address _to, uint256 _tokenId) external override {
        require(
            msg.sender == nftSale || msg.sender == treasury,
            "Not allowed to call contract"
        );

        if (_exists(_tokenId)) safeTransferFrom(msg.sender, _to, _tokenId);
        else _safeMint(_to, _tokenId);

        emit ReceiveNFT(_to, _tokenId);
    }

    function safeMint(address _to, uint256 _tokenId) external onlyOwner {
        _safeMint(_to, _tokenId);
    }

    function setUri(string memory _uri) external onlyOwner {
        baseUri = _uri;

        emit SetURI(_uri);
    }

    function setNftSaleAndTreasury(address _nftSale, address _treasury)
        external
        onlyOwner
    {
        require(
            _nftSale != address(0) && _treasury != address(0),
            "Can't set zero address"
        );

        nftSale = _nftSale;
        treasury = _treasury;

        emit SetSaleAndTreasury(nftSale, treasury);
    }

    function tokenURI(uint256 _tokenId)
        public
        view
        override
        returns (string memory)
    {
        return string(abi.encodePacked(baseUri, Strings.toString(_tokenId)));
    }

    function tokensOwnedByUser(address _addr)
        external
        view
        returns (uint256[] memory tokenIds)
    {
        uint256 balance = balanceOf(_addr);
        tokenIds = new uint256[](balance);
        for (uint256 i = 0; i < balance; i++)
            tokenIds[i] = tokenOfOwnerByIndex(_addr, i);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override(ERC721, ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, IERC165)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}

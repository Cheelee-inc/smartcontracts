// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import './interfaces/ICommonBlacklist.sol';
import "./interfaces/ICustomNFT.sol";

contract NFT is ICustomNFT, ERC721EnumerableUpgradeable, OwnableUpgradeable {
    event SetSaleAndTreasury(address sale, address treasury);
    event ReceiveNFT(address indexed receiver, uint256 indexed tokenId);
    event SetURI(string uri);

    ICommonBlacklist public commonBlacklist;
    string public NAME;
    string public SYMBOL;
    string private baseURI;

    address public nftSale;
    address public treasury;
    address public constant GNOSIS = 0xC40b7fBb7160B98323159BA800e122C9DeD0668D;
    uint256[50] __gap;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(string memory _name, string memory _symbol)
    external
    initializer
    {
        __Ownable_init();
        __ERC721_init(_name, _symbol);
        __ERC721Enumerable_init();

        NAME = _name;
        SYMBOL = _symbol;
        transferOwnership(GNOSIS);
    }

    /**
     * @notice Transfer or minting NFT from sale contract or treasury
     * @param _to: recipient address
     * @param _tokenId: token id
     *
     */
    function receiveNFT(
        address _to,
        uint256 _tokenId
    ) external override {
        require(
            msg.sender == nftSale || msg.sender == treasury,
            "Not allowed to call contract"
        );

        if (_exists(_tokenId)) {
            safeTransferFrom(msg.sender, _to, _tokenId);
        } else {
            _safeMint(_to, _tokenId);
        }

        emit ReceiveNFT(_to, _tokenId);
    }

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
    ) external onlyOwner {
        _safeMint(_to, _tokenId);
    }

    /**
     * @notice Setting base uri for nft collection.
     * @param _uri: new base uri
     *
     * @dev Callable by owner
     *
     */
    function setUri(
        string memory _uri
    ) external onlyOwner {
        baseURI = _uri;

        emit SetURI(_uri);
    }

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
    ) external onlyOwner {
        require(
            _nftSale != address(0) && _treasury != address(0),
            "Can't set zero address"
        );

        nftSale = _nftSale;
        treasury = _treasury;

        emit SetSaleAndTreasury(nftSale, treasury);
    }

    /**
     * @notice Getting information about owned tokens by user address
     * @param _addr: user address
     *
     */
    function tokensOwnedByUser(
        address _addr
    )
        external
        view
        returns (uint256[] memory)
    {
        uint256 balance = balanceOf(_addr);
        uint256[] memory tokenIds = new uint256[](balance);

        for (uint256 i = 0; i < balance; i++) {
            tokenIds[i] = tokenOfOwnerByIndex(_addr, i);
        }

        return tokenIds;
    }

    /**
     * @notice Return base URI
     *
     */
    function _baseURI() internal view override returns (string memory) {
        return baseURI;
    }

    /**
     * @notice Update common blacklist address
     * @param _commonBlacklist: amount of tokens
     *
     * @dev Callable by owner
     *
     */
    function updateGlobalBlacklist(
        address _commonBlacklist
    ) external onlyOwner {
        commonBlacklist = ICommonBlacklist(_commonBlacklist);
    }

    /**
     * @dev Hook that is called after any transfer of tokens. This includes
     * minting and burning.
     *
     * Calling conditions:
     *
     * - when `from` and `to` are both non-zero.
     * - `from` and `to` are never both zero.
     *
     * To learn more about hooks, head to xref:ROOT:extending-contracts.adoc#using-hooks[Using Hooks].
     */
    function _afterTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual override {
        require(!commonBlacklist.userIsBlacklisted(from), "NFT: Sender in global blacklist");
        require(!commonBlacklist.userIsBlacklisted(to), "NFT: Recipient in global blacklist");
        require(!commonBlacklist.userIsBlacklisted(_msgSender()), "NFT: Sender in common blacklist");

        super._afterTokenTransfer(from, to, tokenId);
    }

    /**
     * @dev Approve `to` to operate on `tokenId`
     *
     * Emits an {Approval} event.
     */
    function _approve(address to, uint256 tokenId) internal virtual override {
        require(!commonBlacklist.userIsBlacklisted(to), "NFT: Recipient in global blacklist");

        super._approve(to, tokenId);
    }

    /**
     * @dev Approve `operator` to operate on all of `owner` tokens
     *
     * Emits an {ApprovalForAll} event.
     */
    function _setApprovalForAll(
        address owner,
        address operator,
        bool approved
    ) internal virtual override {
        require(!commonBlacklist.userIsBlacklisted(owner), "NFT: Owner in global blacklist");
        require(!commonBlacklist.userIsBlacklisted(operator), "NFT: Operator in global blacklist");

        super._setApprovalForAll(owner, operator, approved);
    }
}

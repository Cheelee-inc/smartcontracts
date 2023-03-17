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

    string public NAME;
    string public SYMBOL;
    string private baseURI;

    address public nftSale;
    address public treasury;
    address public constant GNOSIS = 0xC40b7fBb7160B98323159BA800e122C9DeD0668D;
    ICommonBlacklist public commonBlacklist;
    bool commonBlacklistIsSetted;
    uint256[49] __gap;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        string memory _name,
        string memory _symbol
    )
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
     * @notice Setting blacklist
     * @param _blacklist: new blacklist address
     *
     * @dev Callable by owner
     *
     */
    function setBlacklist(
        ICommonBlacklist _blacklist
    ) external onlyOwner {
        commonBlacklist = _blacklist;
        commonBlacklistIsSetted = true;
    }

    /**
     * @notice Return base URI
     *
     */
    function _baseURI() internal view override returns (string memory) {
        return baseURI;
    }

    /**
     * @dev Hook that is called before any token transfer. This includes minting
     * and burning.
     *
     * Calling conditions:
     *
     * - When `from` and `to` are both non-zero, ``from``'s `tokenId` will be
     * transferred to `to`.
     * - When `from` is zero, `tokenId` will be minted for `to`.
     * - When `to` is zero, ``from``'s `tokenId` will be burned.
     * - `from` and `to` are never both zero.
     *
     * To learn more about hooks, head to xref:ROOT:extending-contracts.adoc#using-hooks[Using Hooks].
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual override {
        if (commonBlacklistIsSetted) {
            require(!commonBlacklist.userIsBlacklisted(_msgSender(), from, to), "NFT: Blocked by global blacklist");
            require(!commonBlacklist.userIsInternalBlacklisted(address(this), _msgSender(), from, to), "NFT: Blocked by internal blacklist");
        }
        super._beforeTokenTransfer(from, to, tokenId);
    }

    /**
     * @dev Approve `to` to operate on `tokenId`
     *
     * Emits an {Approval} event.
     */
    function _approve(address to, uint256 tokenId) internal virtual override {
        if (commonBlacklistIsSetted) {
            require(!commonBlacklist.userIsBlacklisted(address(0), address(0), to), "NFT: Recipient in global blacklist");
            require(!commonBlacklist.userIsInternalBlacklisted(address(this), address(0), address(0), to), "NFT: Recipient in internal blacklist");
        }
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
        if (commonBlacklistIsSetted) {
            require(!commonBlacklist.userIsBlacklisted(owner, operator, address(0)), "NFT: Blocked by global blacklist");
            require(!commonBlacklist.userIsInternalBlacklisted(address(this), owner, operator, address(0)), "NFT: Blocked by internal blacklist");
        }
        super._setApprovalForAll(owner, operator, approved);
    }
}

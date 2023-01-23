// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

import './interfaces/ICommonBlacklist.sol';
import "./interfaces/ICustomNFT.sol";

contract NFT is ICustomNFT, UUPSUpgradeable, ERC721EnumerableUpgradeable, OwnableUpgradeable, AccessControlUpgradeable {
    event SetSaleAndTreasury(address sale, address treasury);
    event ReceiveNFT(address indexed receiver, uint256 indexed tokenId);
    event SetURI(string uri);

    ICommonBlacklist public commonBlacklist;
    string public NAME;
    string public SYMBOL;
    string private baseURI;

    address public nftSale;
    address public treasury;
    address public GNOSIS;
    uint256[50] __gap;

    mapping(address => bool) public blacklist;

    bytes32 public constant BLACKLIST_OPERATOR_ROLE = keccak256("BLACKLIST_OPERATOR_ROLE");

    // Modifier for roles
    modifier onlyBlacklistOperator() {
        require(hasRole(BLACKLIST_OPERATOR_ROLE, _msgSender()), "Not a blacklist operator");
        _;
    }

    function initialize(
        string memory _name,
        string memory _symbol,
        address _blackList,
        address _GNOSIS
    ) external initializer {
        __Ownable_init();
        __ERC721_init(_name, _symbol);
        __ERC721Enumerable_init();
        __AccessControl_init();

        NAME = _name;
        SYMBOL = _symbol;
        GNOSIS = _GNOSIS;
        commonBlacklist = ICommonBlacklist(_blackList);

        transferOwnership(_GNOSIS);
        _setupRole(DEFAULT_ADMIN_ROLE, _GNOSIS);
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

        require(!blacklist[_to], "NFT: Recipient in internal blacklist");
        require(!commonBlacklist.userIsBlacklisted(_to), "NFT: Recipient in common blacklist");

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
        require(!blacklist[_to], "NFT: Recipient in internal blacklist");
        require(!commonBlacklist.userIsBlacklisted(_to), "NFT: Recipient in common blacklist");

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
        returns (uint256[] memory tokenIds)
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
     * @notice Add user to blacklist
     * @param _users: users array for adding to blacklist
     * @dev Callable by blacklist operator
     */
    function addUsersToBlacklist(
        address[] memory _users
    ) external onlyBlacklistOperator {
        for (uint i; i < _users.length; i++) {
            blacklist[_users[i]] = true;
        }
    }

    /**
     * @notice Remove users from blacklist
     * @param _users: users array for removing from blacklist
     * @dev Callable by blacklist operator
     */
    function removeUsersFromBlacklist(
        address[] memory _users
    ) external onlyBlacklistOperator {
        for (uint i; i < _users.length; i++) {
            blacklist[_users[i]] = false;
        }
    }

    /**
     * @notice Getting information if user in internal blacklist
     * @param _user: user address
     *
     */
    function userInBlacklist(
        address _user
    ) external view returns(bool) {
        bool isBlacklisted = blacklist[_user];

        return isBlacklisted;
    }

    /**
     * @dev Transfers `tokenId` from `from` to `to`.
     *  As opposed to {transferFrom}, this imposes no restrictions on msg.sender.
     *
     * Requirements:
     *
     * - `to` cannot be the zero address.
     * - `tokenId` token must be owned by `from`.
     *
     * Emits a {Transfer} event.
     */
    function _transfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual override {
        require(!blacklist[from], "NFT: Sender in internal blacklist");
        require(!commonBlacklist.userIsBlacklisted(from), "NFT: Sender in common blacklist");
        require(!blacklist[to], "NFT: Recipient in internal blacklist");
        require(!commonBlacklist.userIsBlacklisted(to), "NFT: Recipient in common blacklist");

        super._transfer(from, to, tokenId);
    }

    /**
     * @dev Approve `to` to operate on `tokenId`
     *
     * Emits an {Approval} event.
     */
    function _approve(address to, uint256 tokenId) internal virtual override {
        address owner = ownerOf(tokenId);
        require(to != owner, "ERC721: approval to current owner");
        require(!blacklist[to], "NFT: Recipient in internal blacklist");
        require(!commonBlacklist.userIsBlacklisted(to), "NFT: Recipient in common blacklist");
        require(!blacklist[owner], "NFT: Owner in internal blacklist");
        require(!commonBlacklist.userIsBlacklisted(owner), "NFT: Owner in common blacklist");

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
        require(!blacklist[operator], "NFT: Operator in internal blacklist");
        require(!commonBlacklist.userIsBlacklisted(operator), "NFT: Operator in common blacklist");

        address spender = _msgSender();

        require(!blacklist[spender], "NFT: Spender in internal blacklist");
        require(!commonBlacklist.userIsBlacklisted(spender), "NFT: Spender in common blacklist");

        super._setApprovalForAll(owner, operator, approved);
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721EnumerableUpgradeable, AccessControlUpgradeable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    receive() external payable {}
    fallback() external payable {}
    function _authorizeUpgrade(address) internal override onlyOwner {}
}

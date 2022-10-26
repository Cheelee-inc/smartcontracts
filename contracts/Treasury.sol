// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts-upgradeable/utils/cryptography/draft-EIP712Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/cryptography/ECDSAUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/utils/ERC721HolderUpgradeable.sol";

import "./interfaces/CustomNFT.sol";

contract Treasury is
    EIP712Upgradeable,
    ERC721HolderUpgradeable,
    OwnableUpgradeable
{
    event Withdrawed(
        address indexed _user,
        uint256 _amount,
        uint256 indexed _option
    );
    event WithdrawedNFT(
        address indexed _user,
        uint256 _id,
        uint256 indexed _option
    );

    string public NAME;
    string public EIP712_VERSION;

    bytes32 public NFT_PASS_TYPEHASH;
    bytes32 public PASS_TYPEHASH;

    mapping(uint256 => bool) private usedSignature;

            //who              //when             //option   //amount
    mapping(address => mapping(uint256 => mapping(uint256 => uint256)))
        public tokensTransfersPerDay;
    mapping(address => mapping(uint256 => mapping(uint256 => uint256)))
        public nftTransfersPerDay;
    uint256[] public maxNftTransfersPerDay;
    uint256[] public maxTokenTransferPerDay;

    address public signer;
    IERC20Upgradeable[] public tokens;
    CustomNFT[] public nfts;

    function initialize(
        CustomNFT _chests,
        CustomNFT _glasses,
        address _signer,
        IERC20Upgradeable _lee,
        IERC20Upgradeable _cheel,
        IERC20Upgradeable _usdt
    ) external initializer {
        __Ownable_init();

        require(address(_chests) != address(0), "Can't set zero address");
        require(address(_glasses) != address(0), "Can't set zero address");
        require(address(_lee) != address(0), "Can't set zero address");
        require(address(_cheel) != address(0), "Can't set zero address");
        require(address(_usdt) != address(0), "Can't set zero address");

        NAME = "TREASURY";
        EIP712_VERSION = "1";

        __EIP712_init(NAME, EIP712_VERSION);

        NFT_PASS_TYPEHASH = keccak256(
            "WithdrawNFTSignature(uint256 nonce,uint256 id,address address_to,uint256 ttl,uint256 option)"
        );
        PASS_TYPEHASH = keccak256(
            "WithdrawSignature(uint256 nonce,uint256 amount,address address_to,uint256 ttl,uint256 option)"
        );

        nfts.push(_chests);
        nfts.push(_glasses);
        maxNftTransfersPerDay.push(7);
        maxNftTransfersPerDay.push(7);

        tokens.push(_lee);
        tokens.push(_cheel);
        tokens.push(_usdt);
        maxTokenTransferPerDay.push(100 * 10**18);
        maxTokenTransferPerDay.push(100 * 10**18);
        maxTokenTransferPerDay.push(100 * 10**18);

        signer = _signer;

        nfts[0].setApprovalForAll(address(nfts[0]), true);
        nfts[1].setApprovalForAll(address(nfts[1]), true);
    }

    function verifySignature(
        uint256 _nonce,
        uint256 _amount,
        address _to,
        uint256 _ttl,
        uint256 _option,
        bytes memory _signature
    ) public view returns (address) {
        bytes32 _digest = _hashTypedDataV4(
            keccak256(
                abi.encode(PASS_TYPEHASH, _nonce, _amount, _to, _ttl, _option)
            )
        );
        return ECDSAUpgradeable.recover(_digest, _signature);
    }

    function verifySignatureNFT(
        uint256 _nonce,
        uint256 _id,
        address _to,
        uint256 _ttl,
        uint256 _option,
        bytes memory _signature
    ) public view returns (address) {
        bytes32 _digest = _hashTypedDataV4(
            keccak256(
                abi.encode(NFT_PASS_TYPEHASH, _nonce, _id, _to, _ttl, _option)
            )
        );
        return ECDSAUpgradeable.recover(_digest, _signature);
    }

    function withdraw(
        uint256 _nonce,
        uint256 _amount,
        address _to,
        uint256 _ttl,
        uint256 _option,
        bytes memory _signature
    ) external {
        require(address(tokens[_option]) != address(0), "Option disabled");
        uint256 currentDay = getCurrentDay();
        require(
            tokensTransfersPerDay[_to][currentDay][_option] + _amount <=
                maxTokenTransferPerDay[_option],
            "Amount greater than allowed"
        );
        tokensTransfersPerDay[_to][currentDay][_option] += _amount;

        require(_ttl >= block.timestamp, "Signature is no longer active");
        require(
            verifySignature(_nonce, _amount, _to, _ttl, _option, _signature) ==
                signer,
            "Bad Signature"
        );
        require(!usedSignature[_nonce], "Signature already used");

        usedSignature[_nonce] = true;
        SafeERC20Upgradeable.safeTransfer(tokens[_option], _to, _amount);

        emit Withdrawed(_to, _amount, _option);
    }

    function withdrawNFT(
        uint256 _nonce,
        uint256 _id,
        address _to,
        uint256 _ttl,
        uint256 _option,
        bytes memory _signature
    ) external {
        require(address(nfts[_option]) != address(0), "Option disabled");
        uint256 currentDay = getCurrentDay();
        require(
            nftTransfersPerDay[_to][currentDay][_option] <
                maxNftTransfersPerDay[_option],
            "Too many transfers"
        );
        nftTransfersPerDay[_to][currentDay][_option]++;

        require(_ttl >= block.timestamp, "Signature is no longer active");
        require(
            verifySignatureNFT(_nonce, _id, _to, _ttl, _option, _signature) ==
                signer,
            "Bad Signature"
        );
        require(!usedSignature[_nonce], "Signature already used");

        usedSignature[_nonce] = true;
        nfts[_option].receiveNFT(_to, _id);

        emit WithdrawedNFT(_to, _id, _option);
    }

    function getCurrentDay() public view returns (uint256) {
        return (block.timestamp / 86400) + 4;
    }

    function setSigner(address _signer) external onlyOwner {
        signer = _signer;
    }

    function setTokenLimit(uint256 _index, uint256 _newLimit)
        external
        onlyOwner
    {
        maxTokenTransferPerDay[_index] = _newLimit;
    }

    function setNftLimit(uint256 _index, uint256 _newLimit) external onlyOwner {
        maxNftTransfersPerDay[_index] = _newLimit;
    }

    function addToken(IERC20Upgradeable _addr, uint256 _limit)
        external
        onlyOwner
    {
        require(address(_addr) != address(0), "Zero address not acceptable");
        tokens.push(_addr);
        maxTokenTransferPerDay.push(_limit);
    }

    function addNFT(CustomNFT _addr, uint256 _limit) external onlyOwner {
        require(address(_addr) != address(0), "Zero address not acceptable");
        nfts.push(_addr);
        maxNftTransfersPerDay.push(_limit);

        _addr.setApprovalForAll(address(_addr), true);
    }

    function disableToken(uint256 _index) external onlyOwner {
        tokens[_index] = IERC20Upgradeable(address(0));
    }

    function disableNFT(uint256 _index) external onlyOwner {
        nfts[_index] = CustomNFT(address(0));
    }

    function withdrawToken(IERC20Upgradeable _token, uint256 _amount)
        external
        onlyOwner
    {
        SafeERC20Upgradeable.safeTransfer(_token, msg.sender, _amount);
    }
}

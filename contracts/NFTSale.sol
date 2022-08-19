pragma solidity ^0.8.13;

import "@openzeppelin/contracts/utils/cryptography/draft-EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "./interfaces/CustomNFT.sol";

contract NFTSale is EIP712, Ownable {
    string public constant NAME = "NFTSale";
    string public constant EIP712_VERSION = "1";

    bytes32 public constant PASS_TYPEHASH =
        keccak256(
            "RedeemSignature(uint256 id,address address_to,uint256 ttl_timestamp)"
        );
    bytes32 public constant PASS_TYPEHASH2 =
        keccak256(
            "PurchaseSignature(uint256 id,address address_to,uint256 ttl_timestamp)"
        );

    address public signer;
    CustomNFT public nftContract;

    mapping(address => bool) public usedRedeemSignature;
    mapping(address => bool) public usedPurchaseSignature;

    uint256 public redeemed;
    uint256 public purchased;

    bool public redeemPaused;
    bool public purchasePaused;

    uint256 public pricePerToken;
    uint256 public immutable redeemSupply;
    uint256 public immutable purchaseSupply;

    constructor(
        CustomNFT _nftContract,
        address _signer,
        uint256 _pricePerToken,
        uint256 _redeemSupply,
        uint256 _purchaseSupply
    ) EIP712(NAME, EIP712_VERSION) {
        nftContract = _nftContract;
        signer = _signer;

        pricePerToken = _pricePerToken;
        redeemSupply = _redeemSupply;
        purchaseSupply = _purchaseSupply;
    }

    function verifySignatureRedeem(
        uint256 _id,
        address _to,
        uint256 _ttl,
        bytes memory _signature
    ) public view returns (address) {
        bytes32 _digest = _hashTypedDataV4(
            keccak256(abi.encode(PASS_TYPEHASH, _id, _to, _ttl))
        );
        return ECDSA.recover(_digest, _signature);
    }

    function verifySignaturePurchase(
        uint256 _id,
        address _to,
        uint256 _ttl,
        bytes memory _signature
    ) public view returns (address) {
        bytes32 _digest = _hashTypedDataV4(
            keccak256(abi.encode(PASS_TYPEHASH2, _id, _to, _ttl))
        );
        return ECDSA.recover(_digest, _signature);
    }

    function redeem(
        uint256 _tokenId,
        uint256 ttlTimestamp,
        bytes memory _signature
    ) external {
        require(!redeemPaused, "Redeeming paused");
        require(redeemed < redeemSupply, "Out of stock");
        require(!usedRedeemSignature[msg.sender], "Can buy only once");
        require(
            verifySignatureRedeem(
                _tokenId,
                msg.sender,
                ttlTimestamp,
                _signature
            ) == signer,
            "Bad signature"
        );
        require(ttlTimestamp >= block.timestamp, "TTL already finished");

        usedRedeemSignature[msg.sender] = true;

        nftContract.receiveNFT(msg.sender, _tokenId);
        redeemed++;
    }

    function purchase(
        uint256 _tokenId,
        uint256 ttlTimestamp,
        bytes memory _signature
    ) external payable {
        require(!purchasePaused, "Purchase paused");
        require(purchased < purchaseSupply, "Out of stock");
        require(!usedPurchaseSignature[msg.sender], "Can buy only once");
        require(msg.value == pricePerToken, "Price not correct");
        require(
            verifySignaturePurchase(
                _tokenId,
                msg.sender,
                ttlTimestamp,
                _signature
            ) == signer,
            "Bad signature"
        );
        require(ttlTimestamp >= block.timestamp, "TTL already finished");

        usedPurchaseSignature[msg.sender] = true;

        nftContract.receiveNFT(msg.sender, _tokenId);
        purchased++;
    }

    function setPrice(uint256 _price) external onlyOwner {
        pricePerToken = _price;
    }

    function withdraw() external onlyOwner {
        payable(msg.sender).transfer(address(this).balance);
    }

    function pauseRedeem() external onlyOwner {
        redeemPaused = !redeemPaused;
    }

    function pausePurchase() external onlyOwner {
        purchasePaused = !purchasePaused;
    }
}

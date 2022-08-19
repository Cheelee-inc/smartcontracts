// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts-upgradeable/utils/cryptography/draft-EIP712Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/cryptography/ECDSAUpgradeable.sol";

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "./interfaces/CustomNFT.sol";

contract Treasury is EIP712Upgradeable {
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

    IERC20 public token;
    mapping(uint256 => bool) private usedSignature;

    address public signer;

    IERC20 public lee;
    IERC20 public cheel;
    IERC20 public usdt;
    CustomNFT public chests;
    CustomNFT public glasses;

    function initialize(
        CustomNFT _chests,
        CustomNFT _glasses,
        address _signer,
        IERC20 _lee,
        IERC20 _cheel,
        IERC20 _usdt
    ) public initializer {
        NAME = "TREASURY";
        EIP712_VERSION = "1";

        NFT_PASS_TYPEHASH = keccak256(
            "WithdrawNFTSignature(uint256 nonce,uint256 id,address address_to,uint256 ttl,uint256 option)"
        );
        PASS_TYPEHASH = keccak256(
            "WithdrawSignature(uint256 nonce,uint256 amount,address address_to,uint256 ttl,uint256 option)"
        );

        __EIP712_init(NAME, EIP712_VERSION);

        chests = _chests;
        glasses = _glasses;
        signer = _signer;
        lee = _lee;
        cheel = _cheel;
        usdt = _usdt;

        chests.setApprovalForAll(address(chests), true);
        glasses.setApprovalForAll(address(glasses), true);
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
        require(_ttl >= block.timestamp, "Signature is no longer active");
        require(
            verifySignature(_nonce, _amount, _to, _ttl, _option, _signature) ==
                signer,
            "Bad Signature"
        );
        require(usedSignature[_nonce] == false, "Signature already used");

        usedSignature[_nonce] = true;

        if (_option == 1) lee.transfer(_to, _amount);
        else if (_option == 2) cheel.transfer(_to, _amount);
        else if (_option == 3) usdt.transfer(_to, _amount);

        emit Withdrawed(msg.sender, _amount, _option);
    }

    function withdrawNFT(
        uint256 _nonce,
        uint256 _id,
        address _to,
        uint256 _ttl,
        uint256 _option,
        bytes memory _signature
    ) external {
        require(_ttl >= block.timestamp, "Signature is no longer active");
        require(
            verifySignatureNFT(_nonce, _id, _to, _ttl, _option, _signature) ==
                signer,
            "Bad Signature"
        );
        require(usedSignature[_nonce] == false, "Signature already used");

        usedSignature[_nonce] = true;

        if (_option == 1) {
            chests.receiveNFT(_to, _id);
        } else if (_option == 2) {
            glasses.receiveNFT(_to, _id);
        }
        emit WithdrawedNFT(msg.sender, _id, _option);
    }
}

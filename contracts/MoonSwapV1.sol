//SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.8;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract MoonSwap is ReentrancyGuard {
    using SafeERC20 for IERC20;
    using Counters for Counters.Counter;

    struct Swap {
        IERC20 inToken;
        IERC20 outToken;
        uint256 tokensIn;
        uint256 tokensOut; // can be swapped for tokensOut or more
        address inTokenParty;
        address outTokenParty;
        bool status;
    }

    Counters.Counter public swapId;
    mapping(uint256 => Swap) public swaps;
    mapping(address => uint256) public claimableFees;
    address public admin;

    constructor() {
        admin = msg.sender;
    }

    function claimFees(IERC20 _token) external {
        _token.safeTransfer(admin, claimableFees[address(_token)]);
    }

    function createNewSwap(
        IERC20 _inToken,
        IERC20 _outToken,
        uint256 _inTokens,
        uint256 _outTokens,
        address _tokenOutParty)
        external
        returns (uint256) {
        _inToken.safeTransferFrom(msg.sender, address(this), _inTokens);
        uint256 fee = (5*_inTokens)/1000;
        claimableFees[address(_inToken)] += fee;
        Swap memory newSwap = Swap(
            _inToken, // inToken
            _outToken, // outToken
            _inTokens - fee, // tokensIn
            _outTokens, // tokensOut
            msg.sender, // tokensInParty
            _tokenOutParty, // tokensOutParty
            false // status
        );
        swaps[swapId.current()] = newSwap;
        swapId.increment();
        return swapId.current() - 1;
    }

    function commitToSwap(uint256 _swapId, uint256 _outTokens) external nonReentrant returns (uint256) {
        Swap memory newSwap = swaps[_swapId];
        require(newSwap.status, "SWAP_INACTIVE");
        require(newSwap.outTokenParty == msg.sender || newSwap.outTokenParty == address(0), "UNAUTHORIZED");
        require(_outTokens >= newSwap.tokensOut, "UNMATCHED_AMOUNT");
        newSwap.outToken.safeTransferFrom(msg.sender, address(this), _outTokens);
        uint256 fee = (5*_outTokens)/1000;
        claimableFees[address(newSwap.outToken)] += fee;
        delete swaps[_swapId]; // get those sweet gas refunds!
        newSwap.outToken.safeTransfer(newSwap.inTokenParty, _outTokens - fee);
        newSwap.inToken.safeTransfer(msg.sender, newSwap.tokensIn);
        return newSwap.tokensIn;
    }
}

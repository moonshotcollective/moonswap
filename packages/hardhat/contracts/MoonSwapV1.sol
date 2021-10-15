//SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

contract MoonSwap is ReentrancyGuard {
    using SafeERC20 for IERC20;
    using Counters for Counters.Counter;
    using EnumerableSet for EnumerableSet.UintSet;

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
    EnumerableSet.UintSet private activeSwaps;
    mapping(uint256 => Swap) public swaps;
    mapping(address => uint256) public claimableFees;

    address public admin;

    event NewSwap(
        uint256 indexed id,
        address inToken,
        address outToken,
        uint256 inTokens,
        uint256 outTokens,
        address inTokenParty,
        address outTokenParty
    );
    event RevokeSwap(uint256 indexed id);
    event CloseSwap(uint256 indexed id, address outTokenParty);

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
            true // status
        );
        activeSwaps.add(swapId.current());
        swaps[swapId.current()] = newSwap;
        swapId.increment();
        emit NewSwap(
            swapId.current() - 1,
            address(_inToken),
            address(_outToken),
            _inTokens,
            _outTokens,
            msg.sender,
            _tokenOutParty
        );
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
        activeSwaps.remove(_swapId);
        newSwap.outToken.safeTransfer(newSwap.inTokenParty, _outTokens - fee);
        newSwap.inToken.safeTransfer(msg.sender, newSwap.tokensIn);
        emit CloseSwap(_swapId, msg.sender);
        return _outTokens;
    }

    function revokeSwap(uint256 _swapId) external nonReentrant returns (uint256) {
        Swap memory swap = swaps[_swapId];
        require(swap.status, "SWAP_INACTIVE");
        require(swap.inTokenParty == msg.sender, "UNAUTHORIZED");
        uint256 returnFee = (5*swap.tokensIn)/1000;
        claimableFees[address(swap.inToken)] -= returnFee;
        delete swaps[_swapId]; // get those sweet gas refunds!
        activeSwaps.remove(_swapId);
        swap.inToken.safeTransfer(msg.sender, swap.tokensIn + returnFee);
        emit RevokeSwap(_swapId);
        return swap.tokensIn + returnFee;
    }

    function getActiveSwaps() external view returns(uint256[] memory) {
        return activeSwaps.values();
    }
}

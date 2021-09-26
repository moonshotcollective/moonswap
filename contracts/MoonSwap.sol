//SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.7;

import '@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol';
import '@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol';
import "@openzeppelin/contracts/utils/Counters.sol";

contract MoonSwap {
    using Counters for Counters.Counter;
    ISwapRouter public immutable swapRouter;

    struct Swap {
        IERC20 from;
        IERC20 to;
        uint256 tokenLeft;
        address executor;
        bool paid;
        bool status;
    }

    Counters.Counter public swapId;

    mapping(uint256 => Swap) public swaps;

    constructor(ISwapRouter _swapRouter) {
        swapRouter = _swapRouter;
    }

    function swapExactInputMultihop(uint256 amountIn, uint256 amountOutMinimum, uint256 ttl, bytes memory path) internal returns (uint256 amountOut) {
        // Transfer `amountIn` of DAI to this contract.
        TransferHelper.safeTransferFrom(DAI, msg.sender, address(this), amountIn);

        // Approve the router to spend DAI.
        TransferHelper.safeApprove(DAI, address(swapRouter), amountIn);

        // Multiple pool swaps are encoded through bytes called a `path`. A path is a sequence of token addresses and poolFees that define the pools used in the swaps.
        // The format for pool encoding is (tokenIn, fee, tokenOut/tokenIn, fee, tokenOut) where tokenIn/tokenOut parameter is the shared token across the pools.
        // Since we are swapping DAI to USDC and then USDC to WETH9 the path encoding is (DAI, 0.3%, USDC, 0.3%, WETH9).
        ISwapRouter.ExactInputParams memory params =
            ISwapRouter.ExactInputParams({
                path: path,
                recipient: address(this),
                deadline: block.timestamp + ttl,
                amountIn: amountIn,
                amountOutMinimum: amountOutMinimum
            });

        // Executes the swap.
        amountOut = swapRouter.exactInput(params);
    }
}

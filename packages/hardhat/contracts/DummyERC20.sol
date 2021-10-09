//SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";


contract DummyERC20 is ERC20("Dummy ERC20", "DERC20") {
	constructor() {
		_mint(msg.sender, 1000 * 10 ** 18);
	}
}

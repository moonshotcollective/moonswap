import { ethers } from "ethers";
import { ERC20ABI } from "../constants";

export async function getTokenData(tokenContractAddress, signer) {
  try {
    const tokenContract = new ethers.Contract(tokenContractAddress, ERC20ABI, signer);
    const name = await tokenContract.name();
    const symbol = await tokenContract.symbol();
    return { name, symbol };
  } catch (err) {
    console.log(err);
    return { name: null, symbol: null };
  }
}

export async function checkAllowance(tokenContractAddress, signer, spender) {
  const userAddress = await signer.getAddress();
  const tokenContract = new ethers.Contract(tokenContractAddress, ERC20ABI, signer);
  const allowance = await tokenContract.allowance(userAddress, spender);
  const decimals = await tokenContract.decimals();
  return ethers.utils.formatUnits(allowance, decimals);
}

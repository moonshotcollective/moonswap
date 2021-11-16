import { ethers } from "ethers";
import { ERC20ABI } from "../constants";

export async function getTokenData(tokenContractAddress, signer) {
  const tokenContract = new ethers.Contract(tokenContractAddress, ERC20ABI, signer);
  const name = await tokenContract.name();
  const symbol = await tokenContract.symbol();
  return { name, symbol };
}

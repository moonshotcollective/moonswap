import { utils } from "ethers";
import React, { useEffect, useState } from "react";
import ClaimFees from "../components/ClaimFees";

const AllSwaps = ({ readContracts, localProvider, chainId }) => {
  const [activeSwaps, setActiveSwaps] = useState(null);
  useEffect(() => {
    if (readContracts?.MoonSwap) {
      const getAllSwaps = async () => {
        const allSwaps = await readContracts.MoonSwap.getActiveSwaps();
        const swapArray = [];
        allSwaps.map(swap => {
          swapArray.push(utils.keccak256(swap));
        });
        setActiveSwaps(swapArray);
      };
      getAllSwaps();
    }
  }, [readContracts]);
  return (
    <div>
      <h1>All active Swaps</h1>
      {activeSwaps &&
        activeSwaps.map(swap => (
          <div style={{ margin: "1rem" }} key={swap}>
            <ClaimFees hash={swap} localProvider={localProvider} chainId={chainId} />
          </div>
        ))}
    </div>
  );
};

export default AllSwaps;

import React, { useEffect, useState } from "react";

const AllSwaps = ({ readContracts }) => {
  const [activeSwaps, setActiveSwaps] = useState(null);
  useEffect(() => {
    if (readContracts?.MoonSwap) {
      const getAllSwaps = async () => {
        const allSwaps = await readContracts.MoonSwap.getActiveSwaps();
        setActiveSwaps(allSwaps);
        // console.log("allSwaps: ", allSwaps);
        allSwaps.forEach(swap => {
          console.log("swap: ", swap);
        });
      };
      getAllSwaps();
    }
  }, [readContracts]);
  return (
    <div>
      <h1>All active Swaps</h1>
      {activeSwaps &&
        activeSwaps.map(swap => {
          return (
            <div key={swap}>
              <p>{swap._hex}</p>
            </div>
          );
        })}
    </div>
  );
};

export default AllSwaps;

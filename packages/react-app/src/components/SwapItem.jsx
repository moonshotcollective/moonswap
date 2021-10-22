import React, { useEffect, useState } from "react";
import { useThemeSwitcher } from "react-css-theme-switcher";
import { Typography, Button } from "antd";
import { NETWORK } from "../constants";

export default function SwapItem({ onClick, hash, index, localProvider, chainId, ...props }) {
  const { currentTheme } = useThemeSwitcher();
  const [loading, updateLoading] = useState(true);
  const [txData, updateTxData] = useState({});

  const checkTx = async () => {
    const _tx = await localProvider.waitForTransaction(hash, 1);

    console.log(txData);
    updateTxData(_tx);
    updateLoading(false);
  };

  useEffect(() => {
    // get transaction status
    checkTx();
  }, []);

  const explorer = NETWORK(chainId).blockExplorer || `https://etherscan.io/`;

  return (
    <div style={{ width: "100%" }}>
      <div
        style={{
          flex: 1,
          display: "flex",
          width: "100%",
          flexDirection: "row",
          justifyContent: "space-between",
          paddingLeft: 5,
          fontSize: props.fontSize ? props.fontSize : 20,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
          <Typography>{index}</Typography>
          <Typography.Text copyable={{ text: hash }}>
            <a
              style={{ color: currentTheme === "light" ? "#222222" : "#ddd" }}
              target="_blank"
              href={`${explorer}tx/${hash}`}
              rel="noopener noreferrer"
            >
              {hash}
            </a>
          </Typography.Text>
          <Button onClick={onClick}>Commit Swap</Button>
        </div>
      </div>
    </div>
  );
}

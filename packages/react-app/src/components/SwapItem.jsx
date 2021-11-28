import React, { useEffect, useState } from "react";
import { useThemeSwitcher } from "react-css-theme-switcher";
import { Typography, Button } from "antd";
import { NETWORK } from "../constants";
import { getTokenData } from "../helpers/utils";
import { Address } from ".";

export default function SwapItem({ onClick, hash, index, localProvider, chainId, swapData, ...props }) {
  const { currentTheme } = useThemeSwitcher();
  const [loading, updateLoading] = useState(true);
  const [txData, updateTxData] = useState({});

  const [tokenInData, setTokenInData] = useState({});
  const [tokenOutData, setTokenOutData] = useState({});

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

  useEffect(() => {
    console.log("SWAPDATA in SWAPITEM", { swapData });
    if (swapData) {
      getTokenData(swapData.inToken, localProvider).then(data => setTokenInData(data));
      getTokenData(swapData.outToken, localProvider).then(data => setTokenOutData(data));
    }
  }, [swapData]);

  const explorer = NETWORK(chainId).blockExplorer || `https://etherscan.io/`;

  if (!swapData) return null;

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
          <Address address={swapData.inTokenParty} fontSize={16} />
          <Typography.Text copyable={{ text: `${explorer}address/${swapData.inToken}` }}>
            <a
              style={{ color: currentTheme === "light" ? "#222222" : "#ddd" }}
              target="_blank"
              href={`${explorer}address/${swapData.inToken}`}
              rel="noopener noreferrer"
            >
              {swapData.tokensIn.toNumber()} {tokenInData ? tokenInData.symbol : swapData.inToken}
            </a>
          </Typography.Text>
          <Address address={swapData.outTokenParty} fontSize={16} />
          <Typography.Text copyable={{ text: `${explorer}address/${swapData.outToken}` }}>
            <a
              style={{ color: currentTheme === "light" ? "#222222" : "#ddd" }}
              target="_blank"
              href={`${explorer}address/${swapData.outToken}`}
              rel="noopener noreferrer"
            >
              {swapData.tokensOut.toNumber()} {tokenOutData ? tokenOutData.symbol : swapData.outToken}
            </a>
          </Typography.Text>
          <Button onClick={onClick}>Commit Swap</Button>
        </div>
      </div>
      <br />
      <hr />
    </div>
  );
}

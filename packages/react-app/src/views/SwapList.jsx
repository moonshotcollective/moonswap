import React, { useCallback, useEffect, useState } from "react";
import { SyncOutlined, SettingOutlined, ArrowDownOutlined } from "@ant-design/icons";
import { utils, BigNumber } from "ethers";
import { Button, Divider, Input, List, Row, Col, Tabs, Card, Form, Checkbox } from "antd";
import { Address, Balance, SwapItem, AddressInput } from "../components";
import { useParams, useHistory } from "react-router-dom";
import { Router } from "@uniswap/sdk";

export default function SwapList({
  purpose,
  setPurposeEvents,
  address,
  mainnetProvider,
  localProvider,
  yourLocalBalance,
  price,
  tx,
  readContracts,
  writeContracts,
  chainId,
}) {
  const history = useHistory();

  const [activeSwaps, setActiveSwaps] = useState([]);
  const [swapIds, setSwapIds] = useState([]);

  const getActiveSwaps = async () => {
    let swaps = null;
    let temp = [];
    let tempIds = [];
    if (readContracts?.MoonSwap) {
      swaps = await readContracts.MoonSwap.getActiveSwaps();
      console.log("swaps", swaps);
      swaps.forEach(swap => {
        tempIds.push(swap.toNumber());
      });
      console.log("viewswap ", swaps);
      console.log("tempIds ", tempIds);
      console.log("before sorting tempIds", tempIds);

      tempIds = tempIds.sort((a, b) => b - a);
      tempIds.map((id, index) => {
        temp.push(utils.keccak256(swaps.find(swap => swap.toNumber() === id)));
      });
      console.log("temp ", temp);

      setActiveSwaps(temp);
      setSwapIds(tempIds);
    }
  };

  useEffect(() => {
    console.log("active Swaps", activeSwaps);
  }, []);

  useEffect(() => {
    console.log("readContract", readContracts);
  }, []);

  useEffect(async () => {
    getActiveSwaps();
  }, [activeSwaps]);

  return (
    <div>
      <div style={{ marginBottom: 25, flex: 1 }}>
        <Card title="Swaps" style={{ width: "100%" }}>
          <List
            bordered
            dataSource={activeSwaps}
            renderItem={(item, index) => (
              <List.Item>
                <div
                  style={{
                    width: "80%",
                    margin: "auto",
                  }}
                >
                  <SwapItem
                    index={swapIds[index]}
                    onClick={() => {
                      history.push(`/swap/${swapIds[index]}`);
                    }}
                    hash={item}
                    localProvider={localProvider}
                    chainId={chainId}
                    fontSize={14}
                  />
                </div>
              </List.Item>
            )}
          />
        </Card>
      </div>
    </div>
  );
}

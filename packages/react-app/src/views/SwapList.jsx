import React, { useCallback, useEffect, useState } from "react";
import { SyncOutlined, SettingOutlined, ArrowDownOutlined } from "@ant-design/icons";
import { utils, BigNumber } from "ethers";
import { Button, Divider, Input, List, Row, Col, Tabs, Card, Form, Checkbox } from "antd";
import { Address, Balance, SwapItem, AddressInput } from "../components";

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
  const [activeSwaps, setActiveSwaps] = useState([]);

  const getActiveSwaps = async () => {
    let swaps = null;
    let temp = [];
    if (readContracts?.MoonSwap) {
      swaps = await readContracts.MoonSwap.getActiveSwaps();
      swaps.forEach(swap => {
        temp.push(utils.keccak256(swap));
      });
      console.log("viewswap ", swaps, temp);
      setActiveSwaps(temp);
    }
  };

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
                  }}
                >
                  <SwapItem hash={item} localProvider={localProvider} chainId={chainId} fontSize={14} />
                </div>
              </List.Item>
            )}
          />
        </Card>
      </div>
    </div>
  );
}

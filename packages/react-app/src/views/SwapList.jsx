import React, { useCallback, useEffect, useState } from "react";
import { SyncOutlined, SettingOutlined, ArrowDownOutlined } from "@ant-design/icons";
import { utils, BigNumber } from "ethers";
import { Button, Divider, Input, List, Row, Col, Tabs, Card, Form, Checkbox } from "antd";
import { Address, Balance, SwapItem, AddressInput } from "../components";
import { useParams, useHistory } from "react-router-dom";
import { Router } from "@uniswap/sdk";

export default function SwapList({ localProvider, readContracts, chainId }) {
  const history = useHistory();

  const [activeSwaps, setActiveSwaps] = useState([]);
  const [swapIds, setSwapIds] = useState([]);
  const [swapData, setSwapData] = useState([]);

  const getActiveSwaps = async () => {
    let swaps = null;
    let temp = [];
    let tempIds = [];
    if (readContracts?.MoonSwap) {
      swaps = await readContracts.MoonSwap.getActiveSwaps();
      swaps.forEach(swap => {
        tempIds.push(swap.toNumber());
      });

      tempIds = tempIds.sort((a, b) => b - a);
      tempIds.map((id, index) => {
        temp.push(utils.keccak256(swaps.find(swap => swap.toNumber() === id)));
      });

      setActiveSwaps(temp);
      setSwapIds(tempIds);

      let output = [];

      for (let id of tempIds) {
        const data = await readContracts.MoonSwap.swaps(id);
        output[id] = data;
      }

      setSwapData(output);
    }
  };

  useEffect(() => {
    console.log("active Swaps", activeSwaps);
  }, [activeSwaps]);

  useEffect(() => {
    console.log({ swapData });
  }, [swapData]);

  useEffect(async () => {
    getActiveSwaps();
  }, []);

  return (
    <div>
      <div style={{ marginBottom: 25, flex: 1 }}>
        <Card title="List of Swaps" style={{ width: "100%" }}>
          {swapData.length > 0 ? (
            <List
              header={
                <Row>
                  <Col span={4} style={{ fontSize: "20px", textDecoration: "underline" }}>
                    Swap Id
                  </Col>
                  <Col span={4} style={{ fontSize: "20px", textDecoration: "underline" }}>
                    In party
                  </Col>
                  <Col span={4} style={{ fontSize: "20px", textDecoration: "underline" }}>
                    In token
                  </Col>
                  <Col span={4} style={{ fontSize: "20px", textDecoration: "underline" }}>
                    Out party
                  </Col>
                  <Col span={4} style={{ fontSize: "20px", textDecoration: "underline" }}>
                    Out token
                  </Col>
                  <Col span={4} style={{ fontSize: "20px", textDecoration: "underline" }}>
                    Commit To Swap
                  </Col>
                </Row>
              }
              bordered
              dataSource={activeSwaps}
              pagination={{ pageSize: 10 }}
              renderItem={(item, index) => {
                return (
                  <List.Item>
                    <div
                      style={{
                        width: "80%",
                        margin: "auto",
                      }}
                    >
                      <SwapItem
                        index={swapIds[activeSwaps.indexOf(item)]}
                        onClick={() => {
                          history.push(`/swap/${swapIds[activeSwaps.indexOf(item)]}`);
                        }}
                        hash={item}
                        swapData={swapData[swapIds[activeSwaps.indexOf(item)]]}
                        localProvider={localProvider}
                        chainId={chainId}
                        fontSize={14}
                      />
                    </div>
                  </List.Item>
                );
              }}
            />
          ) : (
            "Loading..."
          )}
        </Card>
      </div>
    </div>
  );
}

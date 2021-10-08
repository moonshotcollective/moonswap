import { SyncOutlined, SettingOutlined, ArrowDownOutlined } from "@ant-design/icons";
import { utils } from "ethers";
import { Button, Divider, Input, List, Row, Col, Tabs, Card, Form, Checkbox } from "antd";
import React, { useState } from "react";
import { Address, Balance, ClaimFees, AddressInput } from "../components";

export default function TokenSwap({
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
  isWalletConnected,
}) {
  const [readyToSwap, setReadyToSwap] = useState();
  const [addressIn, setAddressIn] = useState();
  const [addressOut, setAddressOut] = useState(address);
  const [token, setTokenOut] = useState();

  const createNewSwap = ({ tokenIn, swapValueIn, tokenOut, swapValueOut }) => {
    if (!isWalletConnected) {
      return notification.error({
        message: "Access request failed",
        description: "Please connect your wallet to proceed.",
        placement: "bottomRight",
      });
    }
    const result = tx(
      writeContracts.MoonSwap.createNewSwap({
        addressIn,
        tokenIn,
        swapValueIn,
        addressOut,
        tokenOut,
        swapValueOut,
      }),
      update => {
        console.log("📡 New Swap Created:", update);
        if (update && (update.status === "confirmed" || update.status === 1)) {
          setReadyToSwap(true);
          setTokenOut(tokenOut);
          notification.success({
            message: "Ready to Commit To Swap",
            description: "successful",
            placement: "bottomRight",
          });
        }
      },
    );
  };

  const commitToSwap = async () => {
    let swapId = null;
    if (readContracts?.MoonSwap) {
      swapId = await readContracts.MoonSwap.swapId();
    }
    const result = tx(writeContracts.MoonSwap.commitToSwap({ swapId, tokenOut }), update => {
      console.log("📡 Swap Committed:", update);
      if (update && (update.status === "confirmed" || update.status === 1)) {
        setReadyToSwap(false);
        console.log(" 🍾 Swap finished!");
        notification.success({
          message: "Swap Complete",
          description: "successful",
          placement: "bottomRight",
        });
      }
    });
  };

  return (
    <div
      style={{
        border: "1px solid #cccccc",
        padding: 30,
        width: 600,
        margin: "auto",
        marginTop: 64,
        borderRadius: 25,
        minHeight: 100,
      }}
    >
      <div>
        <h2 style={{ float: "left", marginLeft: 10 }}>SWAP</h2>
        <a style={{ float: "right" }}>
          <Button
            onClick={() => {
              /* look how we call setPurpose AND send some value along */
              tx(
                writeContracts.YourContract.setPurpose("💵 Paying for this one!", {
                  value: utils.parseEther("0.001"),
                }),
              );
              /* this will fail until you make the setPurpose function payable */
            }}
            type="primary"
          >
            ...
          </Button>
        </a>
      </div>

      <div style={{ margin: 8 }}>
        <Form name="join_room" onFinish={createNewSwap}>
          <div
            style={{
              border: "1px solid #cccccc",
              padding: 20,
              width: 500,
              margin: "auto",
              marginTop: 64,
              borderRadius: 25,
            }}
          >
            <Row>
              <Col span={6}>
                <h1 style={{ float: "left", fontSize: 40 }}>IN</h1>
              </Col>
              <Col span={16}>
                <AddressInput
                  autoFocus
                  ensProvider={mainnetProvider}
                  placeholder="Address"
                  address={addressIn}
                  onChange={setAddressIn}
                />
                <Form.Item name="tokenIn">
                  <Input style={{ marginRight: 20, marginTop: 20 }} placeholder="Token Hash" />
                </Form.Item>
                <Form.Item name="swapValueIn">
                  <Input style={{ marginRight: 20, marginTop: 20 }} placeholder="Swap Value" />
                </Form.Item>
              </Col>
            </Row>
          </div>
          <ArrowDownOutlined style={{ margin: 20 }} />
          <div
            style={{
              border: "1px solid #cccccc",
              padding: 20,
              width: 500,
              margin: "auto",
              borderRadius: 25,
            }}
          >
            <Row>
              <Col span={6}>
                <h1 style={{ float: "left", fontSize: 40 }}>OUT</h1>
              </Col>
              <Col span={16}>
                <AddressInput
                  autoFocus
                  ensProvider={mainnetProvider}
                  placeholder="Address"
                  address={addressOut}
                  onChange={setAddressOut}
                />
                <Form.Item name="tokenOut">
                  <Input style={{ marginRight: 20, marginTop: 20 }} placeholder="Token Hash" />
                </Form.Item>
                <Form.Item name="swapValueOut">
                  <Input style={{ marginRight: 20, marginTop: 20 }} placeholder="Swap Value" />
                </Form.Item>
              </Col>
            </Row>
          </div>
          <Button style={{ margin: 30 }} type="primary" disabled={!readyToSwap} onClick={commitToSwap}>
            Commit To Swap
          </Button>
          <Form.Item>
            <Button htmlType="submit" type="primary" style={{ marginRight: 10 }}>
              Create New Swap
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
}

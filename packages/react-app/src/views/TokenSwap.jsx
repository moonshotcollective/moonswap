import { SyncOutlined, SettingOutlined, ArrowDownOutlined } from "@ant-design/icons";
import { utils, ethers } from "ethers";
import { Button, Divider, Input, List, Row, Col, Tabs, Card, Form, Checkbox, notification } from "antd";
import React, { useState, useEffect } from "react";
import { Address, Balance, ClaimFees, AddressInput } from "../components";
import externalContracts from "../contracts/external_contracts";

const ERC20ABI = externalContracts[1].contracts.UNI.abi;

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
  userSigner,
  chainId,
}) {
  const [readyToSwap, setReadyToSwap] = useState();
  const [addressIn, setAddressIn] = useState();
  const [addressOut, setAddressOut] = useState(address);
  const [token, setTokenOut] = useState();
  const [numTokensOut, setNumTokensOut] = useState();
  const [commitSwapId, setCommitSwapId] = useState();
  const [activeSwaps, setActiveSwaps] = useState();

  const [tokenInContract, setTokenInContract] = useState();
  const [tokenOutContract, setTokenOutContract] = useState();

  const getTokenDetails = async ({ token }) => {
    const decimals = await readContracts[token].decimals;
    return { decimals };
  };

  const getLatestSwapId = async () => {
    let swaps = null;
    if (readContracts?.MoonSwap) {
      swaps = await readContracts.MoonSwap.getActiveSwaps();
      const latestSwap = swaps[swaps.length - 1];
      setCommitSwapId(utils.keccak256(latestSwap));
    }
  };

  const approveTokenAllowance = async ({ maxApproval, token, tokenInContract, tokenOutContract }) => {
    // const decimals = await getTokenDetails({ token });
    // FIX: Harcoded decimals value
    const newAllowance = ethers.utils.parseUnits(maxApproval, await tokenInContract.decimals());
    const res = await tokenInContract.approve(readContracts.MoonSwap.address, newAllowance);
    await res.wait(1);
  };

  const createNewSwap = async ({ tokenIn, swapValueIn, tokenOut, swapValueOut }) => {
    if (!isWalletConnected) {
      return notification.error({
        message: "Access request failed",
        description: "Please connect your wallet to proceed.",
        placement: "bottomRight",
      });
    }

    const signer = userSigner;

    console.log("signer", signer);

    const inContract = new ethers.Contract(tokenIn, ERC20ABI, signer);
    const outContract = new ethers.Contract(tokenOut, ERC20ABI, signer);

    console.log("inContract", inContract);

    setTokenInContract(inContract);
    setTokenOutContract(outContract);

    // Approve the token allowance
    await approveTokenAllowance({
      maxApproval: swapValueIn,
      token: tokenIn,
      tokenInContract: inContract,
      tokenOutContract: outContract,
    });

    const result = tx(
      writeContracts.MoonSwap.createNewSwap(tokenIn, tokenOut, swapValueIn, swapValueOut, addressOut),
      (update, error) => {
        console.log("result check ", update, error);
        if (update && (update.status === "confirmed" || update.status === 1)) {
          console.log("📡 New Swap Created:", update);
          setReadyToSwap(true);
          setNumTokensOut(swapValueOut);
          notification.success({
            message: "Ready to Commit To Swap",
            description: "successful",
            placement: "bottomRight",
          });
        }
      },
    ).then(result => {
      console.log("result finished ", result);
      getLatestSwapId();
    });
  };

  const commitToSwap = async ({ currentSwapId, tokenOut }) => {
    currentSwapId = commitSwapId;
    tokenOut = numTokensOut;

    const result = tx(writeContracts.MoonSwap.commitToSwap(currentSwapId, tokenOut), update => {
      console.log("📡 Swap Complete:", update);
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
        width: 700,
        margin: "auto",
        marginTop: 64,
        borderRadius: 25,
        minHeight: 100,
      }}
    >
      <div>
        {!readyToSwap && <h2 style={{ float: "left", marginLeft: 10 }}>START SWAP</h2>}
        {readyToSwap && commitSwapId && numTokensOut && (
          <h2 style={{ float: "left", marginLeft: 10 }}>COMMIT TO SWAP</h2>
        )}
        <a style={{ float: "right" }}>
          <Button
            onClick={() => {
              /* look how we call setPurpose AND send some value along */
              // tx(
              //   writeContracts.YourContract.setPurpose("💵 Paying for this one!", {
              //     value: utils.parseEther("0.001"),
              //   }),
              // );
              console.log("Three dots clicked");
              /* this will fail until you make the setPurpose function payable */
            }}
            type="primary"
          >
            ...
          </Button>
        </a>
      </div>

      <div style={{ margin: 8 }}>
        {!readyToSwap && (
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
                    <Input style={{ marginRight: 20, marginTop: 20 }} placeholder="Token Amount" />
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
                    <Input style={{ marginRight: 20, marginTop: 20 }} placeholder="Token Amount" />
                  </Form.Item>
                </Col>
              </Row>
            </div>
            <Form.Item>
              <Button htmlType="submit" type="primary" style={{ marginRight: 10, marginTop: 10 }}>
                Create New Swap
              </Button>
            </Form.Item>
          </Form>
        )}
        {readyToSwap && commitSwapId && numTokensOut && (
          <Form name="join_room" onFinish={commitToSwap}>
            <div
              style={{
                border: "1px solid #cccccc",
                padding: 20,
                width: 600,
                margin: "auto",
                marginTop: 64,
                borderRadius: 25,
              }}
            >
              <Row>
                <Col span={16}>
                  <Form.Item label="Swap Id" name="swapId">
                    <p>{commitSwapId}</p>
                  </Form.Item>
                  <Form.Item label="Token Out" name="tokenOut">
                    <p>{numTokensOut} </p>
                  </Form.Item>
                </Col>
              </Row>
            </div>
            <Form.Item>
              <Button htmlType="submit" type="primary" style={{ marginRight: 10, marginTop: 10 }}>
                Commit To Swap
              </Button>
            </Form.Item>
          </Form>
        )}
      </div>
    </div>
  );
}

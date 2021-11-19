import { SyncOutlined, SettingOutlined, ArrowDownOutlined } from "@ant-design/icons";
import { utils, ethers } from "ethers";
import { Button, Divider, Input, List, Row, Col, Tabs, Card, Form, Checkbox, notification, Steps } from "antd";
import React, { useState, useEffect } from "react";
import { Address, Balance, ClaimFees, AddressInput } from "../components";
import externalContracts from "../contracts/external_contracts";
import { useParams, useHistory, Link } from "react-router-dom";
import { checkAllowance, getTokenData } from "../helpers/utils";
const { Step } = Steps;

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
  const { id } = useParams();
  const history = useHistory();
  const [readyToSwap, setReadyToSwap] = useState();
  const [addressIn, setAddressIn] = useState();
  const [addressOut, setAddressOut] = useState(address);
  const [numTokensOut, setNumTokensOut] = useState();
  const [commitSwapId, setCommitSwapId] = useState();
  const [tokenInAddress, setTokenInAddress] = useState();
  const [tokenOutAddress, setTokenOutAddress] = useState();
  const [swapValueIn, setSwapValueIn] = useState();
  const [swapValueOut, setSwapValueOut] = useState();
  const [swapStep, setSwapStep] = useState();
  const [swapComplete, setSwapComplete] = useState();

  const [swapData, setSwapData] = useState();

  const [tokenInMetadata, setTokenInMetadata] = useState();
  const [tokenOutMetadata, setTokenOutMetadata] = useState();

  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (id) {
      setReadyToSwap(true);
      setCommitSwapId(id);

      getSwapData(id);
    }
  }, [id, readContracts]);

  useEffect(() => {
    async function exec() {
      if (swapData) {
        const tokenInData = await getTokenData(swapData.inToken, userSigner);
        const tokenOutData = await getTokenData(swapData.outToken, userSigner);
        setTokenInMetadata(tokenInData);
        setTokenOutMetadata(tokenOutData);
      }
    }

    exec();
  }, [swapData]);

  useEffect(() => {
    if (window.location.href.endsWith("/swap")) {
      setSwapStep(0);
    } else if (notFound) {
      setSwapStep(2);
    } else {
      setSwapStep(1);
    }
  }, []);

  useEffect(() => {
    async function exec() {
      const tokenInData = await getTokenData(tokenInAddress, userSigner);
      console.log("tokenInData", tokenInData);
      const tokenOutData = await getTokenData(tokenOutAddress, userSigner);
      setTokenInMetadata(tokenInData);
      setTokenOutMetadata(tokenOutData);
    }
    exec();
  }, [tokenInAddress, tokenOutAddress]);

  const getSwapData = async id => {
    if (readContracts && readContracts.MoonSwap) {
      const swapData = await readContracts.MoonSwap.swaps(id);
      const status = swapData.status;
      if (!status) {
        setNotFound(true);
      }
      setNumTokensOut(swapData.tokensOut.toNumber());
      setTokenOutAddress(swapData.outToken.toString());
      setSwapData(swapData);
      console.log("swapData: ", swapData);
    }
  };

  const getLatestSwapId = async () => {
    let swaps = null;
    if (readContracts?.MoonSwap) {
      swaps = await readContracts.MoonSwap.getActiveSwaps();
      const latestSwap = swaps[swaps.length - 1];
      console.log("latestSwap: ", latestSwap.toNumber());
      history.push(`/swap/${latestSwap.toNumber()}`);
      setCommitSwapId(latestSwap.toNumber());
    }
  };

  const approveTokenAllowance = async ({ maxApproval, tokenInContract }) => {
    // const decimals = await getTokenDetails({ token });
    // FIX: Harcoded decimals value
    const newAllowance = ethers.utils.parseUnits(maxApproval, await tokenInContract.decimals());
    const res = await tokenInContract.approve(readContracts.MoonSwap.address, newAllowance);
    await res.wait(1);
  };

  const createNewSwap = async () => {
    if (!isWalletConnected) {
      return notification.error({
        message: "Access request failed",
        description: "Please connect your wallet to proceed.",
        placement: "bottomRight",
      });
    }

    const signer = userSigner;

    const inContract = new ethers.Contract(tokenInAddress, ERC20ABI, signer);

    const currentAllowance = await checkAllowance(tokenInAddress, signer, readContracts.MoonSwap.address);

    if (currentAllowance < ethers.utils.formatEther(swapValueIn)) {
      // Approve the token allowance
      await approveTokenAllowance({
        maxApproval: swapValueIn,
        tokenInContract: inContract,
      });
    }

    const result = tx(
      writeContracts.MoonSwap.createNewSwap(tokenInAddress, tokenOutAddress, swapValueIn, swapValueOut, addressOut),
      (update, error) => {
        console.log("result check ", update, error);
        if (update && (update.status === "confirmed" || update.status === 1)) {
          console.log("📡 New Swap Created:", update);
          setReadyToSwap(true);
          setNumTokensOut(swapValueOut);
          setSwapStep(1);
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

    const signer = userSigner;
    const outContract = new ethers.Contract(tokenOutAddress, ERC20ABI, signer);

    const currentAllowance = await checkAllowance(tokenOutAddress, signer, readContracts.MoonSwap.address);

    if (currentAllowance < ethers.utils.formatEther(tokenOut)) {
      await approveTokenAllowance({ maxApproval: tokenOut.toString(), tokenInContract: outContract });
    }

    const result = tx(writeContracts.MoonSwap.commitToSwap(currentSwapId, tokenOut), update => {
      console.log("📡 Swap Complete:", update);
      if (update && (update.status === "confirmed" || update.status === 1)) {
        setReadyToSwap(false);
        setSwapComplete(true);
        setSwapStep(2);
        console.log(" 🍾 Swap finished!");
        notification.success({
          message: "Swap Complete",
          description: "successful",
          placement: "bottomRight",
        });
      }
    });
  };

  if (notFound) {
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
        Swap not found or inactive. Please check the swap id and try again.
      </div>
    );
  }

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
        <Row>
          <Col span={12}>
            {!readyToSwap && <h2 style={{ float: "left", marginLeft: 10 }}>START SWAP</h2>}
            {readyToSwap && commitSwapId && numTokensOut && (
              <h2 style={{ float: "left", marginLeft: 10 }}>COMMIT TO SWAP</h2>
            )}
          </Col>
          <Col span={12}>
            <Button
              onClick={() => {
                setCommitSwapId(null);
                setReadyToSwap(false);
                setSwapStep(0);
              }}
              style={{ float: "right" }}
              type="primary"
            >
              <Link to="/swap">Open New Swap</Link>
            </Button>
          </Col>
        </Row>
        <Row style={{ marginTop: 10 }}>
          <Steps current={swapStep}>
            <Step title="Create New Swap" />
            <Step title="Commit To Swap" />
            <Step title="Swap Complete" />
          </Steps>
        </Row>
      </div>

      <div style={{ margin: 8 }}>
        {!readyToSwap && !swapComplete && (
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
                    placeholder="In party address"
                    address={addressIn}
                    onChange={setAddressIn}
                  />
                  <Form.Item name="tokenIn">
                    <Input
                      value={tokenInAddress}
                      onChange={e => setTokenInAddress(e.target.value)}
                      style={{ marginRight: 0, marginTop: 20 }}
                      placeholder="In token contract address"
                    />
                    <span>{tokenInMetadata?.name ? tokenInMetadata.name : "Loading..."}</span>
                  </Form.Item>
                  <Form.Item name="swapValueIn">
                    <Input
                      value={swapValueIn}
                      onChange={e => setSwapValueIn(e.target.value)}
                      style={{ marginRight: 20, marginTop: 20 }}
                      placeholder="Token Amount in wei"
                    />
                    <span>{tokenInMetadata?.symbol ? tokenInMetadata.symbol : "Loading..."}</span>
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
                    placeholder="Out party address"
                    address={addressOut}
                    onChange={setAddressOut}
                  />
                  <Form.Item name="tokenOut">
                    <Input
                      value={tokenOutAddress}
                      onChange={e => setTokenOutAddress(e.target.value)}
                      style={{ marginRight: 20, marginTop: 20 }}
                      placeholder="Out token contract address"
                    />
                    <span>{tokenOutMetadata?.name ? tokenOutMetadata.name : "Loading..."}</span>
                  </Form.Item>
                  <Form.Item name="swapValueOut">
                    <Input
                      value={swapValueOut}
                      onChange={e => setSwapValueOut(e.target.value)}
                      style={{ marginRight: 20, marginTop: 20 }}
                      placeholder="Token Amount in wei"
                    />
                    <span>{tokenOutMetadata?.symbol ? tokenOutMetadata.symbol : "Loading..."}</span>
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
        {notFound && <div>Swap already completed or inactive.</div>}
        {!notFound && !swapComplete && readyToSwap && commitSwapId && numTokensOut && swapData && (
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
                  <Form.Item label="Token In" name="tokenIn">
                    <p>
                      {tokenInMetadata &&
                        (tokenInMetadata.symbol
                          ? swapData.tokensIn.toNumber() + " " + tokenInMetadata.symbol + "(wei)"
                          : "Loading...")}
                    </p>
                  </Form.Item>
                  <Form.Item label="Token Out" name="tokenOut">
                    <p>
                      {tokenOutMetadata &&
                        (tokenOutMetadata.symbol
                          ? swapData.tokensOut.toNumber() + " " + tokenOutMetadata.symbol + "(wei)"
                          : "Loading...")}
                    </p>
                  </Form.Item>
                  <Form.Item label="Swapping from" name="inParty">
                    <Address address={swapData.inTokenParty} ensProvider={mainnetProvider} fontSize={18} />
                  </Form.Item>
                  <Form.Item label="Swapping to" name="inParty">
                    <Address address={swapData.outTokenParty} ensProvider={mainnetProvider} fontSize={18} />
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
        {swapComplete && <p>Swap Complete</p>}
      </div>
    </div>
  );
}

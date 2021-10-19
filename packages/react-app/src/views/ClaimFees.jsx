import { SyncOutlined, SettingOutlined, ArrowDownOutlined } from "@ant-design/icons";
import { utils } from "ethers";
import { Button, Divider, Input, List, Row, Col, Tabs, Card, Form, Checkbox } from "antd";
import React, { useState } from "react";
import { Address, Balance, ClaimFees, AddressInput } from "../components";

export default function Swap({
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
}) {
  const [newPurpose, setNewPurpose] = useState("loading...");
  const [openToSwap, setOpenToSwap] = useState();

  return (
    <div>
      <div style={{ marginBottom: 25, flex: 1 }}>
        <Card title="Claim Fees" style={{ width: "100%" }}>
          <List
            bordered
            dataSource={[]}
            renderItem={(item, index) => (
              <List.Item>
                <div
                  style={{
                    width: "80%",
                  }}
                >
                  <ClaimFees localProvider={localProvider} chainId={chainId} hash={item} fontSize={14} />
                </div>
              </List.Item>
            )}
          />
        </Card>
      </div>
    </div>
  );
}

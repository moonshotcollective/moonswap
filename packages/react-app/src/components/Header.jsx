import { PageHeader } from "antd";
import React from "react";

// displays a page header

export default function Header() {
  return (
    <a href="https://github.com/moonshotcollective/moonswap" target="_blank" rel="noopener noreferrer">
      <PageHeader title="Moonswap" style={{ cursor: "pointer" }} />
    </a>
  );
}

import React from 'react'
import { SmileOutlined } from "@ant-design/icons";
import { Button, Result, Card } from "antd";

function ComingSoon() {
  return (
    <div
      style={{
        margin: "20px",
        display: "flex",
        height: "80vh",
        placeContent: "center",
        placeItems: "center",
      }}
    >
      <Result
        icon={<SmileOutlined style={{ color: "orange" }} />}
        title="Coming Soon"
        subTitle="We’re still cooking up something awesome for this page. It’s not quite ready yet, but it’s going to be worth the wait!"
      />
    </div>
  );
}

export default ComingSoon
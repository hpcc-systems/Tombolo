import React from "react";
import { Table } from "antd";
import  useWindowSize from "../../../hooks/useWindowSize";


const columns = [
  { title: "",  render: (text, record, index) => index + 1, key: "value", width: 10 },
  { title: "File Name", dataIndex: "text", key: "value" },
];

function FileTemplateTable({ data }) {
    const [ windowHeight] = useWindowSize();
  return <Table columns={columns} dataSource={data} size="small" pagination={{ pageSize: Math.abs(Math.round((windowHeight) / 65 ))}}/>;
}

export default FileTemplateTable;

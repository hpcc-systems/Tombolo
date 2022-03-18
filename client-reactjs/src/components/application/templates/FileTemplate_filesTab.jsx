import React from "react";
import { Table } from "antd";
import  useWindowSize from "../../../hooks/useWindowSize";


const columns = [
  { title: "",  render: (text, record, index) => index + 1, width: 10 },
  { title: "File Name", dataIndex: "text" },
];

function FileTemplateTable({ data }) {
    const [ windowHeight] = useWindowSize();
  return <Table columns={columns} 
                dataSource={data} 
                size="small"
                rowKey={record => record.text}
                pagination={{ pageSize: Math.abs(Math.round((windowHeight) / 65 ))}}/>;
}

export default FileTemplateTable;

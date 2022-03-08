import  {Table} from 'antd';
import {FileOutlined } from "@ant-design/icons"

export  const monthMap = {
  1: "January",
  2: "February",
  3: "March",
  4: "April",
  5: "May",
  6: "June",
  7: "July",
  8: "August",
  9: "September",
  10: "October",
  11: "November",
  12: "December",
};

export const monthAbbrMap = {
  JAN: "January",
  FEB: "February",
  MAR: "March",
  APR: "April",
  MAY: "May",
  JUN: "June",
  JUL: "July",
  AUG: "August",
  SEP: "September",
  OCT: "October",
  NOV: "November",
  DEC: "December",
};

export const dayMap = {
  0: "Sunday",
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday",
  7: "Sunday",
};
export const dayAbbrMap = {
  SUN: "Sunday",
  MON: "Monday",
  TUE: "Tuesday",
  WED: "Wednesday",
  THU: "Thursday",
  FRI: "Friday",
  SAT: "Saturday",
};

export const _minutes = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
  22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
  41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59,
];

export const _hours = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
  22, 23,
];

export const _dayOfMonth = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22,
  23, 24, 25, 26, 27, 28, 29, 30, 31,
];

export const expendedRowRender = (record) =>{ // For displaying files that match a template
    const {files} = record;
    const nestedTableColumns = [ {
        dataIndex: "name",
        width: '24%'
      },
      {
        dataIndex: "description",
      }]
      
    return <Table dataSource={files} columns={nestedTableColumns} pagination={false} showHeader={false} style={{ paddingLeft: '5px'}}></Table>
}

export const eclItemLayout = {
      labelCol: {
        xs: { span: 2 },
        sm: { span: 2 },
        md: { span: 2 },
        lg: { span: 2 },
      },
      wrapperCol: {
        xs: { span: 4 },
        sm: { span: 24 },
        md: { span: 24 },
        lg: { span: 24 },
        xl: { span: 24 },
      },
    };

export const longFieldLayout = {
      labelCol: { span: 2 },
      wrapperCol: { span: 12 },
    };

export const fileColumns = [
       {
        title: "",
        width: "2%",
        render : (text, record, index) =>{return record.assetType === 'fileTemplate' ? 
                                         <i className="fa fa-file-text-o fa-lg"></i>
                                        : <FileOutlined style={{fontSize : '1.33333333em'}}/>},
      },

      {
        title: "Name",
        width: "20%",
        render: (text, record, index) =>{return record.files ? <
          span style={{display: "flex", justifyContent: 'space-between', alignItems: 'center'}}>{record.name} 
          <small style={{color: "blue"}}>[{record.files.length} Files]</small></span>: record.name}
      },
      Table.EXPAND_COLUMN,
      { 
       width: '1%',
       align: 'center'
     },
      {
        title: "Description",
        dataIndex: "description",
        width: "76%",
      },
    ];
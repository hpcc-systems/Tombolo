import styled from "styled-components";
// import {DeleteOutlined} from '@ant-design/icons';


export const LandingZoneUploadContainer = styled.div`
  height: 20vh;
  place-items: center;
  width: 450px;
  margin-top: 50px;
  > * {
    display: block;
    margin-top:20px;
//   }
`

//Tabel columns
export const columns = [
    {
      title: '#',
      dataIndex: 'sno',
    },
    {
      title: 'Type',
      dataIndex: 'type',
    },
    {
      title: 'File Name',
      dataIndex: 'fileName',
    },
    {
      title: 'Size',
      dataIndex: 'fileSize',
    },
    // {
    //   title: '',
    //   dataIndex: '',
    //   key: 'x',
    //   render: (text,record, index) => <DeleteOutlined onClick= {(e) => {console.log(text)}} />,
    // },
  ];
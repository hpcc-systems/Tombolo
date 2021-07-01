import React from 'react'
import { Upload, message, Button } from 'antd';
import { ImportOutlined  } from '@ant-design/icons';
import styled from "styled-components"


function ImportApplication() {
    //On upload status change
    const handleChange = (info) =>  {
        if (info.file.status !== 'uploading') {
          console.log("Uploading >>>>" , info.file, info.fileList);
        }
        if (info.file.status === 'done') {
          console.log(`<<<< 0${info.file.name} file uploaded successfully`);
        } else if (info.file.status === 'error') {
          console.log(` <<<< ${info.file.name} file upload failed.`);
        }
      }

    return (
        <ImportElemnt>
          <Upload onChange={handleChange}>
            <Button style={{display: "flex", placeItems : "center", marginRight: "10px"}} 
            className="btn btn-sm btn-primary" 
            icon={<ImportOutlined  />}>Import App</Button>
        </Upload>  
        </ImportElemnt>
    )
}

export default ImportApplication

//Styled Components
const ImportElemnt = styled.span`
   & .ant-upload-list{
       display: none;
   }
`

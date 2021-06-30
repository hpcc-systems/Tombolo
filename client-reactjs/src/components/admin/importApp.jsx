import React from 'react'
import { Upload, message, Button, Tooltip } from 'antd';
import { ImportOutlined } from '@ant-design/icons';

function ImportApp() {
    //Mock props
    const props = {
        name: 'file',
        action: 'https://www.mocky.io/v2/5cc8019d300000980a055e76',
        headers: {
          authorization: 'authorization-text',
        },
    //Onchange
        onChange(info) {
          if (info.file.status !== 'uploading') {
            console.log(info.file, info.fileList);
          }
          if (info.file.status === 'done') {
            message.success(`${info.file.name} file uploaded successfully`);
          } else if (info.file.status === 'error') {
            message.error(`${info.file.name} file upload failed.`);
          }
        },
      };
    return (
        <>
        <Upload  >
        <Tooltip placement="bottom" title={"Upload file to import app"}>
            <Button style={{display: "flex", alignItems: "center"}}
            className="btn btn-secondary btn-sm  " icon={<ImportOutlined />}>Import Application </Button>
        </Tooltip>
        </Upload>
        </>
    )
}

export default ImportApp;

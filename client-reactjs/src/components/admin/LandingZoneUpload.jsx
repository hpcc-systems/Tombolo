import React, {useState} from 'react'
import { Upload } from 'antd';
import { InboxOutlined } from '@ant-design/icons';



function LandingZoneUpload() {
    const { Dragger } = Upload;
    const [file, setFile] = useState(null);

    const props = {
        name: 'file',
        multiple: true,
        action: 'https://www.mocky.io/v2/5cc8019d300000980a055e76',
        onChange(info) {
        const { status } = info.file;
        if (status !== 'uploading') {
            console.log(info.file, info.fileList);
        }
        if (status === 'done') {
        } else if (status === 'error') {
        }
        },
        onDrop(e) {
        console.log('Dropped files', e.dataTransfer.files);
        },
    };
  


    return (
    <div style={{ height: "100vh"}}>
        <Dragger 
        // {...props}
        style={{height: "90vh"}}
        >
            <p className="ant-upload-drag-icon">
            <InboxOutlined />
            </p>
            <p className="ant-upload-text"><b></b>Click or drag file to this area to upload</p>
            <p className="ant-upload-hint">
            Support for a single or bulk upload. 
            </p>
        </Dragger>,
    </div>
    )
}

export default LandingZoneUpload

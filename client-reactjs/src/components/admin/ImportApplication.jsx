import React, {useState} from 'react'
import { Upload, message, Button , Modal} from 'antd';
import { ImportOutlined, InboxOutlined , MinusCircleOutlined , LoadingOutlined, CheckCircleOutlined} from '@ant-design/icons';
import styled from "styled-components"


function ImportApplication() {
  const { Dragger } = Upload;
  const [ modalVisible, setModalVisiblity] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("")
  const [importing, setImportStatus] = useState(false)
  const [ dataStatus, setDataStatus] = useState("pending")
  const [ applicationStatus, setApplicationStatus] = useState("pending")
  const [ assetsStatus, setAssetsStatus] = useState("pending")

//<<<< Test simulation
const startSimulation = (time, status, action) =>{
  setTimeout(() =>{
    action(status)
  }, time)
  }
  //Handle Import
  const handleImport = () => {
    setImportStatus(true);
    startSimulation(1000, "underway",setDataStatus);
    startSimulation(3000, "completed",setDataStatus);
    startSimulation(3100, "underway",setApplicationStatus);
    startSimulation(6000, "completed",setApplicationStatus);
    startSimulation(6100, "underway",setAssetsStatus);
    startSimulation(9000, "completed",setAssetsStatus);
  }

  const statusIconSwitch = (item) => {
    switch(item){
      case 'pending':
        return <MinusCircleOutlined/>
      case 'underway' :
        return <LoadingOutlined />
      case 'completed':
        return <CheckCircleOutlined style={{color: "green"}}/>

    }
  }

  const props = {
    name: 'file',
    multiple: true,
    action: 'https://www.mocky.io/v2/5cc8019d300000980a055e76',
    onChange(info) {
      setUploadStatus("")
      const { status } = info.file;
      if (status !== 'uploading') {
        console.log("uploading <<<<", info.file, info.fileList);
        setUploadStatus("loaded")
      }
      if (status === 'done') {
        message.success(`<<< Done ${info.file.name} file uploaded successfully.`);
      } else if (status === 'error') {
        message.error(`Err <<<< ${info.file.name} file upload failed.`);
      }
    },
    onDrop(e) {
      console.log('Dropped files', e.dataTransfer.files);
    }
  };

    return (
        <ImportElemnt>
            <Button style={{display: "flex", placeItems : "center", marginRight: "10px"}} 
              className="btn btn-sm btn-primary" 
              onClick={() =>setModalVisiblity(true)}
              icon={<ImportOutlined  />}>Import App
            </Button>
           
            <Modal title="Import Application" 
            className="importApplication__modal"
              visible={modalVisible} 
              onCancel={() => {setModalVisiblity(false); setUploadStatus("")}}
              footer={uploadStatus === "loaded" && !importing ? 
                      <Button className="btn-primary" 
                      onClick={ handleImport}
                      >Start Import</Button> 
                      : null}>
                <Dragger 
                maxCount={1}
                className="importApplication_dragger"
                style={{display : importing?"none":"block"}}
                {...props}
                >
                  <p className="ant-upload-drag-icon">
                    <InboxOutlined />
                  </p>
                  <p className="ant-upload-text">Click or drag file to this area to upload</p>
                  <p className="ant-upload-hint">
                    Data must be in JSON format
                  </p>
                </Dragger>
                <ImportSteps style={{display : importing?"block":"none"}}>
                    <div>{statusIconSwitch(dataStatus)} <span>Inspecting Data ...</span></div>
                    <div>{statusIconSwitch(applicationStatus)} <span>Importing Application ...</span></div>
                    <div>{statusIconSwitch(assetsStatus)} <span>Importing Assets ...</span></div>

                  </ImportSteps>
            </Modal>
          
         
        </ImportElemnt>
    )
}

export default ImportApplication

//Styled Components
const ImportElemnt = styled.span`
 
`

const ImportSteps = styled.div`
> div{
  display: flex;
  place-items: center;

  >span{
    margin-left: 15px;
    color: black;
  }
}
`

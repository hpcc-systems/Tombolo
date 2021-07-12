import React, {useState} from 'react'
import { Upload, Button , Modal} from 'antd';
import { ImportOutlined, InboxOutlined , MinusCircleOutlined , LoadingOutlined, CheckCircleOutlined} from '@ant-design/icons';
import styled from "styled-components"
import { authHeader, handleError } from "../common/AuthHeader.js";

function ImportApplication(props) {
  const { Dragger } = Upload;
  const [ modalVisible, setModalVisiblity] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("")
  const [file, setFile] = useState();
  const [importing, setImportStatus] = useState(false)
  const [ dataStatus, setDataStatus] = useState("pending")
  const [ applicationStatus, setApplicationStatus] = useState("pending")
  const [ assetsStatus, setAssetsStatus] = useState("pending")

  
//<<<< <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<Test simulation
const startSimulation = (time, status, action) =>{
  setTimeout(() =>{
    action(status)
  }, time)
  }

  //Handle Import
  const handleImport = () => {
    setImportStatus(true);

    //<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
    let formData = new FormData();
    formData.append("user", props.user.username);
    formData.append("file", file);
    
 
    fetch("/api/app/read/importApp", {
      method: 'post',
      headers: authHeader("importApp"),
      body: formData
    }).then((response) => {
      console.log("<<<< Api called")
    if(response.ok) {
      return response.json();
    }
    handleError(response);
  })

    //Simulation
    startSimulation(1000, "underway",setDataStatus);
    startSimulation(3000, "completed",setDataStatus);
    startSimulation(3100, "underway",setApplicationStatus);
    startSimulation(6000, "completed",setApplicationStatus);
    startSimulation(6100, "underway",setAssetsStatus);
    startSimulation(90000000000000, "completed",setAssetsStatus);
  }

  //Status icon
  const statusIconSwitch = (item) => {
    switch(item){
      // case 'pending':
      //   return <MinusCircleOutlined/>
      case 'underway' :
        return <LoadingOutlined style={{color: "#FFA500	"}} />
      case 'completed':
        return <CheckCircleOutlined style={{color: "#00FF00"}}/>
    }
  }

  //Draggeer's props
  const propss = {
    name: 'file',
    multiple: false,
    onChange(info) {
      setUploadStatus("")
      const { status } = info.file;
      if (status !== 'uploading') {
        setUploadStatus(status)
        console.log("<<<< Uploading ...")
      }
      if (status === 'done') {
        setUploadStatus(status);
        console.log("<<<< antD dragger", info.file.originFileObj)
        setFile(info.file.originFileObj);
      } else if (status === 'error') {
        setUploadStatus(status)
        console.log("<<<< Error uploading")
      }
    },
    onDrop(e) {
      console.log('Dropped files', e.dataTransfer.files);
    }
  };


  //customRequest
  const customRequest = ({ file, onSuccess }) => {
    setTimeout(() => {
      onSuccess("ok");
    }, 0);
  };
    
    return (
        <ImportElemnt>
           <Button style={{display: "flex", placeItems : "center", marginRight: "10px"}} 
              className="btn btn-sm btn-primary" 
              onClick={() =>setModalVisiblity(true)}
              icon={<ImportOutlined  />}>Import App
            </Button>
           
            <Modal 
              // title="Import Application" 
              title={importing ? null : "Import Application"}
              closable={!importing}
              className="importApplication__modal"
              visible={modalVisible} 
              onCancel={() => {setModalVisiblity(false); setUploadStatus("")}}
              footer={uploadStatus === "done" && !importing ? 
                      <Button className="btn-primary" 
                      onClick={ handleImport}
                      >Start Import</Button> 
                      : null}>
                        <br></br>
                <Dragger 
                maxCount={1}
                className="importApplication_dragger"
                style={{display : importing?"none":"block"}}
                {...propss}
                customRequest={customRequest}
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

// <<<<< Styled Components
const ImportElemnt = styled.span``

const ImportSteps = styled.div`
> div{
  display: flex;
  place-items: center;

  >span{
    margin-left: 15px;
    color: black 
 }
}
`

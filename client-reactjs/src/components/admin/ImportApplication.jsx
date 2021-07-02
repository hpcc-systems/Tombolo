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


  //Import app function
  const importApp  = () => {
    console.log("<<<< Importing application")

    //Steps 
    // 1. Check if importing is true
    //2. check if file is uploaded
      //2.a. hide import btn
      //2.b. hide file name
      //2.c. hide modal cancel btn
    //3. if 1 and 3 are satisfied make API call
    //4. Check file data
    //5. if file has incorrect data send back to clent with appropriate message
    //6. if correct create app, group and assets
    //7. send status of each action on number 6


    // if(this.state.applications.filter(application => {
    //   if (application.id != this.state.newApp.id && application.title == this.state.newApp.title) {
    //     return application;
    //   }
    // }).length > 0) {
    //   message.config({top:150})
    //   message.error("There is already an application with the same name. Please select a different name.")
    //   return;
    // }
    // this.setState({
    //   confirmLoading: true,
    //   submitted: true
    // });

    // if(this.state.newApp.title) {
    //   var userId = (this.props.user) ? this.props.user.username : "";
    //   let data = JSON.stringify({
    //     "id": this.state.newApp.id,
    //     "title" : this.state.newApp.title,
    //     "description" : this.state.newApp.description,
    //     "user_id":userId,
    //     "creator":this.props.user.username});

    // 	  fetch("/api/app/read/newapp", {
    //       method: 'post',
    //       headers: authHeader(),
    //       body: data
    //     }).then((response) => {
    //     if(response.ok) {
    //       return response.json();
    //     }
    //     handleError(response);
    //   })
    //   .then(response => {
    //     if(this.state.newApp.id == '') {
    //       console.log('new app')
    //       //new application
    //       this.props.dispatch(applicationActions.newApplicationAdded(response.id, this.state.newApp.title));
    //     } else {
    //       console.log('update app')
    //       //updating an application
    //       this.props.dispatch(applicationActions.applicationUpdated(this.state.newApp.id, this.state.newApp.title));
    //     }

  	//   	this.setState({
    //     ...this.state,
    //       newApp: {
    //         ...this.state.newApp,
    //         id : '',
    //         title: '',
    //         description:''
    //       },
    //       showAddApp: false,
    //       confirmLoading: false,
    //       submitted:false
    //     });

  	//     this.getApplications();
    //   }).catch(error => {
    //     console.log(error);
    //   });
    }
//<<<< <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<Test simulation
const startSimulation = (time, status, action) =>{
  setTimeout(() =>{
    action(status)
  }, time)
  }


  //Handle Import
  const handleImport = () => {
    setImportStatus(true);


    //Simulation
    startSimulation(1000, "underway",setDataStatus);
    startSimulation(3000, "completed",setDataStatus);
    startSimulation(3100, "underway",setApplicationStatus);
    startSimulation(6000, "completed",setApplicationStatus);
    startSimulation(6100, "underway",setAssetsStatus);
    startSimulation(9000, "completed",setAssetsStatus);
  }

  //Status icon
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


  // Test Props <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
  const props = {
    name: 'file',
    multiple: true,
    action: 'https://www.mocky.io/v2/5cc8019d300000980a055e76',
    onChange(info) {
      setUploadStatus("")
      const { status } = info.file;
      console.log("<<<< Status", info.file.status)
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

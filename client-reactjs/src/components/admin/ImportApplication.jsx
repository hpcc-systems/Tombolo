import React, {useState, useEffect} from 'react'
import { Upload, message, Button , Modal} from 'antd';
import { ImportOutlined, InboxOutlined , MinusCircleOutlined , LoadingOutlined, CheckCircleOutlined} from '@ant-design/icons';
import styled from "styled-components"
import { authHeader, handleError } from "../common/AuthHeader.js";

    //Steps 
    // 1. Check if importing is true
    //2. check if file is uploaded
      //2.a. hide import btn
      //2.b. hide file name
      //2.c. hide modal cancel btn
     // 🔥 /3. if 1 and 3 are satisfied make API call  
    //4. Check file data
    //5. if file has incorrect data send back to clent with appropriate message
    //6. if correct create app, group and assets
    //7. send status of each action on number 6



function ImportApplication(props) {
  const { Dragger } = Upload;
  const [ modalVisible, setModalVisiblity] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("")
  const [file, setFile] = useState();
  const [importing, setImportStatus] = useState(false)
  const [ dataStatus, setDataStatus] = useState("pending")
  const [ applicationStatus, setApplicationStatus] = useState("pending")
  const [ assetsStatus, setAssetsStatus] = useState("pending")

  useEffect(() => {
    console.log(props.user)
   }, [])

  //Import app function
  const importApp  = () => {
  


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
     //  🔥 
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

    //<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
    let formData = new FormData();
    formData.append("file", file);
    // formData.append("user", props.user)
    for (var pair of formData.entries()) {
      console.log("<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< ", pair[0]+ ', ' + pair[1]); 
  }
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

  //<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<

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
      // case 'pending':
      //   return <MinusCircleOutlined/>
      case 'underway' :
        return <LoadingOutlined style={{color: "#FFA500	"}} />
      case 'completed':
        return <CheckCircleOutlined style={{color: "#00FF00"}}/>
    }
  }


  // Test Props <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
  const propss = {
    name: 'file',
    multiple: false,
    action: 'https://www.mocky.io/v2/5cc8019d300000980a055e76',
    onChange(info) {
      setUploadStatus("")
      const { status } = info.file;
      if (status !== 'uploading') {
        setUploadStatus(status)
      }
      if (status === 'done') {
        setUploadStatus(status);
        console.log("<<<< File 0", info )
        console.log("<<<< File", info.file)
        setFile(info.file);
      } else if (status === 'error') {
        setUploadStatus(status)
      }
    },
    onDrop(e) {
      console.log('Dropped files', e.dataTransfer.files);
    }
  };


  //<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
  const onFileChange = (e) =>{
    setFile(e.target.files[0])
  }

  const handleFileSubmit = (e) => {
    console.log(file, "<<<<<<<<<<<<<<<<<<<<<<<<")
    e.preventDefault();
    const formData = new FormData();
    formData.append("user", props.user.username)
    formData.append("file", file)

    console.log(props.user.username,  " <<<<<<<<<<<<<<<<<<")
    
    for (var pair of formData.entries()) {
      console.log("<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< ", pair[0]+ ', ' + pair[1]); 
  }

    fetch("/api/app/read/importApp", {
      method: 'post',
      headers: authHeader("importApp"),
      body: formData
    }).then((response) => {
      console.log("<<<< response ", response)
    if(response.ok) {
      return response.json();
    }
    handleError(response);
    console.log("Error occured")
  })
  }
  //<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
  
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
                >
                  <p className="ant-upload-drag-icon">
                    <InboxOutlined />
                  </p>
                  <p className="ant-upload-text">Click or drag file to this area to upload</p>
                  <p className="ant-upload-hint">
                    Data must be in JSON format
                  </p>
                </Dragger> 
             {/* --------------------------------------------------------------- */}
             <br></br> 

             <form>
                <input type="file" id="myFile" name="filename" onChange={onFileChange}/>
                <input type="submit" onClick={handleFileSubmit} />
              </form>
              {/* --------------------------------------------------------------- */}

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
    color: gray 
 }
}
`

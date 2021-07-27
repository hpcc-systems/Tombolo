import React from 'react'
import { Upload, Button , Modal, message} from 'antd';
import { ImportOutlined, InboxOutlined } from '@ant-design/icons';



function LandingZoneUpload() {
    const { Dragger } = Upload;

    return (
        <div  style={{ height: "100vh"}}>
             <Dragger 
                maxCount={1}
                showUploadList={false}
                className="importApplication_dragger"
                // style={{display: importStatus === null  ? "block" : "none"}}
                // {...propss}
                // customRequest={customRequest}
                >
                  <p className="ant-upload-drag-icon">
                    <InboxOutlined />
                  </p>
                  <p className="ant-upload-text">Click or drag file to this area to upload</p>
                  <p className="ant-upload-hint">
                    Data must be in JSON format
                  </p>
                  {/* <p><b>{file?file.name:null}</b></p> */}
                
                </Dragger> 
        </div>
    )
}

export default LandingZoneUpload;




// import React, {useState, useEffect, useRef} from 'react'
// import { Upload, Button , Modal, message} from 'antd';
// import { ImportOutlined, InboxOutlined } from '@ant-design/icons';
// import { authHeader } from "../common/AuthHeader.js";
// import { applicationActions } from '../../redux/actions/Application';
// import { store } from "../../redux/store/Store";
// import { useHistory } from "react-router";
// import {io} from "socket.io-client";

// function ImportApplication(props) {
//   const [ modalVisible, setModalVisiblity] = useState(false);
//   const [uploadStatus, setUploadStatus] = useState("")
//   const [file, setFile] = useState({});
//   const [socket, setSocket] = useState();
//   const [importStatus, setImportStatus] = useState(null)
//   const [ importUpdates, setImportUpdates] = useState([])
//   const [ importSuccess, setImportSuccess] = useState();
//   const [ routingURL, setRoutingURL] = useState("")
//   const history = useHistory();
//   const scrollToBottomRef = useRef(null);
//   const { Dragger } = Upload;
//   const token = JSON.parse(localStorage.getItem('user')).token;


//   //Log color
//   const logColor = (status) =>{
//     if(status === "error"){
//       return "#ff5722"
//     }else if(status === "success"){
//       return "#00ff00"
//     }else{
//       return "#FFFFFF"
//     }
//   }

//   useEffect(() => {
//     //Establish socket connection when  component loads
//     const socket = io(`http://localhost:3000`, {
//     transports: ["websocket"]
//     });

//     setSocket(socket);

//     //Clean up socket connection when component unmounts
//     return function cleanup(){
//       socket.close()
//     }
//   }, [])


//   useEffect(() => {
//    //When message is received from back end
//    if(socket){
//     socket.on("message", (message) =>{
//       setImportUpdates(existingMsgs => [...existingMsgs , JSON.parse(message)])
//     })
//    }
//   }, [socket])

//   //Scroll logs to bottom
//  const scrollLogs = () => {
//   scrollToBottomRef.current?.scrollIntoView({behavior : "smooth"})
//  }
//  useEffect(() => {
//   scrollLogs()
//  }, [importUpdates])


//   //message config
//   message.config({ top: 150 });

//   //Handle Import
//   const handleImport = () => {
//     setImportStatus("importing");
//     let formData = new FormData();
//     formData.append("user", props.user.username);
//     formData.append("file", file);
    
//     fetch("/api/app/read/importApp", {
//       method: 'post',
//       headers: authHeader("importApp"),
//       body: formData
//     }).then((response) => response.json())
//       .then(data => {
//         if(data.success){
//           setImportStatus("done")
//           setImportSuccess(true);
//           // message.success(data.message)
//           store.dispatch(applicationActions.applicationSelected(data.appId, data.appTitle));
//           localStorage.setItem("activeProjectId", data.appTitle);
//           setRoutingURL(`/${data.appId}/assets`);
//         }else{
//           setImportStatus("done")
//           // message.error(data.message)
//         }
//       })
//   }

//   //When done importing close btn is cliced
//   const handleDoneImport = () =>{
//     setFile({})
//     setImportUpdates([])
//     setModalVisiblity(false)
//     setImportStatus(null);
//     setUploadStatus("");
//     if(importSuccess){
//       history.push(routingURL);
//     }
//   }

//   //Draggeer's props
//   const propss = {
//     name: 'file',
//     multiple: false,
//     onChange(info) {
//       setUploadStatus("")
//       const { status } = info.file;
//       if (status !== 'uploading') {
//         setUploadStatus(status)
//       }
//       if (status === 'done') {
//         setUploadStatus(status);
//         setFile(info.file.originFileObj);
//       } else if (status === 'error') {
//         setUploadStatus(status)
//       }
//     },
//     onDrop(e) {
//       console.log('Dropped files', e.dataTransfer.files);
//     }
//   };

//   //customRequest
//   const customRequest = ({ onSuccess }) => {
//       onSuccess("ok");
//   };

//   //Modal footer buttons
//   const footer = () => {
//     if(importStatus === "importing"){
//       return null;
//     }else if(importStatus === "done"){
//       return <Button type="primary" size={"large"} onClick={handleDoneImport}> Close</Button>
//     }else if(uploadStatus === "done"){
//       return <Button onClick={ handleImport} type="primary" size={"large"}> Import Application</Button>
//     }else {
//       return null
//     }
//   }

//     return (
//         <div>
//            <Button style={{display: "flex", 
//                           placeItems : "center", 
//                           marginRight: "10px"}} 
//               className="btn btn-sm btn-primary" 
//               onClick={() =>setModalVisiblity(true)}
//               icon={<ImportOutlined  />}>Import App
//             </Button>

//             <Modal 
//               title={importStatus ? null : "Import Application"}
//               closable={uploadStatus === "" }
//               maskClosable = {false}
//               visible={modalVisible} 
//               onCancel={() => {setModalVisiblity(false); setUploadStatus(""); setFile({})}}
//               footer={footer()}
//               >
//                 <Dragger 
//                 maxCount={1}
//                 showUploadList={false}
//                 className="importApplication_dragger"
//                 style={{display: importStatus === null  ? "block" : "none"}}
//                 {...propss}
//                 customRequest={customRequest}
//                 >
//                   <p className="ant-upload-drag-icon">
//                     <InboxOutlined />
//                   </p>
//                   <p className="ant-upload-text">Click or drag file to this area to upload</p>
//                   <p className="ant-upload-hint">
//                     Data must be in JSON format
//                   </p>
//                   <p><b>{file?file.name:null}</b></p>
                
//                 </Dragger> 
//                 <div style={{background: "var(--dark)",
//                             textAlign: "left",
//                             padding: "10px", 
//                             maxHeight: "400px",
//                             overflow: "auto",  
//                             display: importStatus ? "block" : "none"
//                  }} >
//                   {importUpdates.map(item => {
//                     let textColor = logColor(item.status);
//                     let message = item.step;
//                     return <div style={{textAlign: "left"}}>
//                       <small style={{color: textColor, 
//                                     fontWeight: "600", 
//                                     lineHeight: "5px"}}>
//                         {message}
//                       </small>
//                     </div>
//                   })
//                   }
//                   <div ref={scrollToBottomRef}></div>
//                 </div>
               
               
//             </Modal>
//         </div>
//     )
// }

// export default ImportApplication


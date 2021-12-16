import React, {useState, useEffect} from 'react';
import {useSelector} from "react-redux"
import { Upload, Table, Select, message, Button,Checkbox,Spin, Cascader, Tooltip,    } from 'antd';
import { InboxOutlined, LoadingOutlined , CheckCircleOutlined, CloseCircleOutlined} from '@ant-design/icons';
import { io } from "socket.io-client";
import{LandingZoneUploadContainer, columns } from "./landingZoneUploadStyles";
import {v4 as uuidv4} from 'uuid';
import { authHeader, handleError } from "../../../common/AuthHeader";
import { useHistory } from 'react-router';

function LandingZoneUpload() {
  const [files, setFiles] = useState([]);
  const [socket, setSocket] = useState(null);
  const [tableData, setTableData] = useState([]);
  const [uploadAttempted, setUploadAttempted] = useState([]);
  const [cluster, setCluster] = useState(null);
  const [machine, setMachine] = useState(null); //ip address of dropzone
  const [currentDirectoryFiles, setCurrentDirectoryFiles] = useState([]);
  const [pathToAsset, setPathToAsset] = useState('')
  const [overWriteFiles, setOverWriteFiles] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [options, setOptions] = useState([]);
  const authReducer = useSelector((state) => state.authenticationReducer);
  const clusters = useSelector(state => state.applicationReducer.clusters);
  const devURL = `${process.env.REACT_APP_PROXY_URL}/landingZoneFileUpload`;
  const prodURL  = '/landingZoneFileUpload';
  const { Dragger } = Upload;
  const { Option,  } = Select;
  const history = useHistory();


useEffect(() => {
  const test = io(`${process.env.REACT_APP_PROXY_URL}/landingZoneNameSpace`,  {
    transports: ["websocket"],
    auth : {
      token : authReducer?.user.token
    }
    });

    test.on("hi", () => console.log("Hello world"));

    console.log(test)

    // Socket io connection
    if(process.env.NODE_ENV === "development"){
      const socket = io(devURL, {
        transports: ["websocket"],
        auth : {
          token : authReducer?.user.token
        }
        });
        setSocket(socket);
    }else{
      const socket = io(prodURL, {
        transports: ["websocket"],
        auth : {
          token : authReducer?.user.token
        }
        });
        setSocket(socket);
    }

    //<<<<<<<<<<<<<<<<< Test
  }, []);


//File upload status icon 
const renderUploadStatusIcon = (status, message) =>{
  switch (status){
    case 'uploading' :
      return <LoadingOutlined style={{ fontSize: 18 }} spin />
    case 'success' :
      return <Tooltip title={message}> <CheckCircleOutlined style={{ fontSize: 18, color: 'green'}} /> </Tooltip>;
    case 'failed' :
      return <Tooltip title={message} placement="topLeft"> <CloseCircleOutlined style={{ fontSize: 18, color: 'red' }}/> </Tooltip>;
  }
}
//Setting table data
useEffect(() =>{
  let newTableData =  [];
  if(files.length > 0){
    files.map((item, index) => {
        newTableData.push({key : uuidv4(), sno : index + 1, 
          fileName : item.name, fileSize : `${item.size / 1000000} MB` , 
          uploading:   renderUploadStatusIcon(item.uploadStatus, item.statusDescription) });

    })
  }
  setTableData(newTableData);
}, [files])

useEffect(() =>{
   const newFiles = files.map(file => {
          if(file.uid ===  uploadAttempted[0].id){
            file.uploadStatus = uploadAttempted[0].success ? 'success' : 'failed';
            file.statusDescription = uploadAttempted[0].message
          }
          return file;
        });
    setFiles(newFiles);
}, [uploadAttempted])

  // Listining to msgs from socket
  useEffect(() =>{
     //Response
     if(socket){
      socket.on('file-upload-response', (response => {
        setUploadAttempted([ {id : response.id, success : response.success, message: response.message}])
      }))
    }
  
     //Clean up socket connection when component unmounts
     return function cleanup(){
       if(socket){
         socket.close()
       }
     }
  }, [socket])

  //Handle File Upload
  const handleFileUpload = () =>{
    let newFiles = files.map(item => item.name);
    let commonFiles = currentDirectoryFiles.filter(item => newFiles.includes(item));

    message.config({top:150,   maxCount: 1});
    if(!cluster){
      message.error("Select a cluster")
    }else if(!pathToAsset){
      message.error("Select  destination folder")
    }
    else if(files.length < 1){
      message.error("Please select atleast one file to upload")
    }else if(commonFiles.length > 0 && !overWriteFiles){
      message.error("Some file(s) already exist. Please check overwrite box to continue")
    }
    else{
    setUploading(true);
    let filesCopy = [...files];
    filesCopy.map(item => {
      item.uploadStatus = 'uploading'
      return item;
    })
    setFiles(filesCopy);

    // Start by sending some file and destination details to server
    socket.emit('start-upload', {pathToAsset, cluster, machine});
    files.map(item => {
      if(item.size <= 1000000){
         let reader = new FileReader();
         reader.readAsArrayBuffer(item);
          reader.onload = function(e){
            let arrayBuffer = e.target.result;
            socket.emit('upload-file', {
              id : item.uid,
              fileName : item.name,
              data: arrayBuffer
            })
          }
      }else{
        let slice = item.slice(0, 100000);
        let reader = new FileReader();
        reader.readAsArrayBuffer(slice);
        reader.onload = function(e){
          let arrayBuffer = e.target.result;
          socket.emit('upload-slice', {
            id: item.uid,
            fileName : item.name,
            data: arrayBuffer,
            fileSize : item.size,
            chunkStart : 100000,
            chunkSize: 100000
          })
        }
      }
    })

     //When server asks for a slice of a file
     socket.on('supply-slice', (message) =>{
      let currentFile = files.filter(item => item.uid === message.id);
      let slice = currentFile[0].slice(message.chunkStart, message.chunkStart + message.chunkSize);
      let reader = new FileReader();
      reader.readAsArrayBuffer(slice);
      reader.onload = function(e){
        let arrayBuffer = e.target.result;
        socket.emit('upload-slice', {
          id: currentFile[0].uid,
          fileName : currentFile[0].name,
          data: arrayBuffer,
          fileSize : currentFile[0].size,
          chunkSize : message.chunkSize
        })
      }
    })
    }
  }

  //Draggeer's props
  const props = {
    name: 'file',
    multiple: true,
    showUploadList:false,
    maxCount:5,
    accept: '.xls, .xlsm, .xlsx, .txt, .json, .csv',
    onChange(info) {
      const { status } = info.file;
      if (status !== 'uploading') {
      }
      if (status === 'done') {
        let newFilesArray  = ([...files, info.file.originFileObj]);
        setFiles(newFilesArray);
      } else if (status === 'error') {
      }
    },
    onDrop(e) {
      console.log('Dropped files', e.dataTransfer.files);
    },
  
  };

  // When the value of cluster dropdown changes
  function handleClusterChange(value) {
    //set selected cluster
    let selectedCluster = JSON.parse(value);
    setCluster(selectedCluster);

  //Make a call to get all dropzones within that cluster
  fetch(`/api/hpcc/read/getDropzones?clusterId=${selectedCluster.id}&for=fileUpload`,{
    headers : authHeader()
  }).then(response => {
    if(response.ok){
      return response.json()
    }
     handleError(response);
  }).then(data =>{
      let newOptions = [];
      data.map(item => {
          newOptions.push( {'value' : item.path, 'label' : item.name, machine: item.machines[0], isLeaf: false, selectedCluster});
      })
      setOptions(newOptions);             
  }).catch(err =>{
      console.log(err)
  })
  }

  //Load cascader data 
  const loadData = (selectedOptions) => {
    let {thor_host, thor_port, id:clusterId} = cluster;
    const targetOption = selectedOptions[selectedOptions.length - 1];
    targetOption.loading = true;
    const pathToAsset = selectedOptions.map(option => option.value).join('/')+'/';
    setPathToAsset(pathToAsset);
    if(targetOption === selectedOptions[0]){
      setMachine(targetOption.machine.Netaddress) // checking this condition so the machine is set only once to avoid unnecessary component re-render
    }

    //constructing data object to be sent as query params
    const data = JSON.stringify({
      Netaddr : selectedOptions[0].machine.Netaddress,
      Path : pathToAsset,
      OS : selectedOptions[0].OS,
      rawxml_ : true,
      DirectoryOnly: false});
    
    // Everytime user clicks a option on cascader make a call to fetch children
    fetch(`/api/hpcc/read/getDirectories?data=${data}&host=${thor_host}&port=${thor_port}&clusterId=${clusterId}`, {
      headers : authHeader()
    }).then(response =>{
      if(response.ok){
        return response.json()
      }
      handleError(response)
    }).then(data =>{
      if(data.FileListResponse.files){
      let children = [];
      let files = []
       data.FileListResponse.files.PhysicalFileStruct.map(item =>{
         if(item.isDir){
          let child = {};
          child.value =item.name;
          child.label = item.name;
          child.isLeaf = !item.isDir;
          children.push(child);
         }else{
            files.push(item.name)
         }
      });
      targetOption.loading= false;
      targetOption.children = children;
      setOptions([...options]);
      setCurrentDirectoryFiles(files);
    }else{
      targetOption.loading= false;
      targetOption.disabled= true;
      targetOption.children = [];
      setOptions([...options]);
    }
    })
    .catch(err =>{
      console.log(err)
    }) 
    }

  //Handle override checkbox change
  const onCheckBoxChnage = (e) =>{
    setOverWriteFiles(e.target.checked)
  }


    return (
        <LandingZoneUploadContainer>
          <span style={{display : uploading ? 'none' : 'block'}}>
            <small>Cluster</small>
            <Select defaultValue = ""  onChange={handleClusterChange}  size="large"style={{width: "100%"}}>
                  {clusters.map((item) => {
                      return <Option key={uuidv4()} value={JSON.stringify(item)}>{item.name} ({item.thor_host.substring(7)})</Option>
                  })}
            </Select>
          </span>

          <span style={{display : uploading ? 'none' : 'block'}}>
            <small>Destination Folder</small>
            <Cascader
                    options={options}
                    loadData={loadData}
                    placeholder="Please select"
                    allowClear
                    changeOnSelect={true}
                    style={{ width: '100%'}}

                />
           </span>
        
        
        <Dragger 
        {...props}
        customRequest={({ onSuccess }) => { onSuccess("ok");}}
        style={{display : uploading ? 'none' : 'block'}}
        >
            <p className="ant-upload-drag-icon">
            <InboxOutlined />
            </p>
            <p className="ant-upload-text"><b>Click or drag files here to upload (Up to 5 files)</b></p>
            <p className="ant-upload-hint">
                Supports xls, xlsm, xlsx, txt, json and csv
            </p>
        </Dragger>
        <span  style={{display : files.length > 0 ? "block" : "none", margin : "20px 0px 20px 0px"}}>
          <Table   columns={columns} dataSource={tableData} size="small" pagination={false} style={{width: "100%", maxHeight : "300px", overflow: "auto"}}/>
        </span>

        <span style={{ margin : "20px 0px 20px 0px", display : uploading ? 'none' : 'block'}}>
        <Checkbox onChange={onCheckBoxChnage}>Overwrite File(s)</Checkbox>
        </span>

        <span>
          <Button size="large"
           disabled={files.length< 1}
           onClick={!uploading ? handleFileUpload : () =>{history.push('/')} } 
           type="primary"  > {!uploading ? 'Upload' : 'Done'} </Button>
        </span>
        </LandingZoneUploadContainer>
    )
}

export default LandingZoneUpload;
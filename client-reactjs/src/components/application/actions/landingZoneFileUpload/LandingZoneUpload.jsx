import React, {useState, useEffect} from 'react';
import {useSelector} from "react-redux"
import { Upload, Table, Select, message, TreeSelect, Button,Checkbox,Spin, Cascader   } from 'antd';
import { InboxOutlined, LoadingOutlined } from '@ant-design/icons';
import { io } from "socket.io-client";
import{LandingZoneUploadContainer, columns } from "./landingZoneUploadStyles";
import {v4 as uuidv4} from 'uuid';
import { authHeader, handleError } from "../../../common/AuthHeader";
import { useHistory } from 'react-router';

function LandingZoneUpload() {
  const [files, setFiles] = useState([]);
  const [socket, setSocket] = useState(null);
  const [tableData, setTableData] = useState([]);
  const [cluster, setCluster] = useState(null);
  const [machine, setMachine] = useState(null); //ip address of dropzone
  const [currentDirectoryFiles, setCurrentDirectoryFiles] = useState([]);
  const [pathToAsset, setPathToAsset] = useState('')
  const [overWriteFiles, setOverWriteFiles] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [successItem, setSuccessItem] = useState(null);
  const [options, setOptions] = useState([]);
  const authReducer = useSelector(state => state.authReducer);
  const clusters = useSelector(state => state.applicationReducer.clusters);
  const devURL = `${process.env.REACT_APP_PROXY_URL}/landingZoneFileUpload`;
  const prodURL  = '/landingZoneFileUpload';
  const { Dragger } = Upload;
  const { Option,  } = Select;
  const history = useHistory();


useEffect(() => {
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
  }, []);


//Setting table data
useEffect(() =>{
  let newTableData =  [];
  if(files.length > 0){
    files.map((item, index) => {
        newTableData.push({key : uuidv4(), sno : index + 1, 
          fileName : item.name, fileSize : `${item.size / 1000000} MB` , uploading: item.uploading?<LoadingOutlined style={{ fontSize: 24 }} spin />: null   });
    })
  }
  if(files.length < 1 && successItem !== null){
    message.success("The file(s) has been uploaded successfully to the Landing Zone");
    setUploading(false)
    setSuccessItem(null)
    socket.close();
    history.push(`/`);
  }
  setTableData(newTableData);
}, [files])

  // Listining to msgs from socket
  useEffect(() =>{
     //Response
     if(socket){
      socket.on('file-upload-response', (response => {
        console.log('File upload reponse <<<<<<<<', response)
        if(response.success){
          setSuccessItem(response.id);
        }else if(!response.success){
          setUploading(false)
          message.error(`Unable to upload file(s) - ${response.message}`);
        }
      }))
    }
  
     //Clean up socket connection when component unmounts
     return function cleanup(){
       if(socket){
         socket.close()
       }
     }
  }, [socket])

  //Remove files from file array after successful upload
  useEffect(() =>{
    if(successItem){
      let filteredFiles = files.filter(item =>item.uid !== successItem);
      setFiles(filteredFiles);
    }   
  }, [successItem])

  //Handle File Upload
  const handleFileUpload = () =>{
    console.log('<<<<< Existing', currentDirectoryFiles);    
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
      item.uploading = true;
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
    let {thor_host, thor_port, name} = selectedCluster;
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
          <span>
            <small>Cluster</small>
            <Select defaultValue = ""  onChange={handleClusterChange}  size="large"style={{width: "100%"}}>
                  {clusters.map((item) => {
                      return <Option key={uuidv4()} value={JSON.stringify(item)}>{item.name} ({item.thor_host.substring(7)})</Option>
                  })}
            </Select>
          </span>

          <span>
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
        >
            <p className="ant-upload-drag-icon">
            <InboxOutlined />
            </p>
            <p className="ant-upload-text"><b>Click or drag files to this area to upload</b></p>
            <p className="ant-upload-hint">
                Supports xls, xlsm, xlsx, txt, json and csv
            </p>
        </Dragger>
        <span  style={{display : files.length > 0 ? "block" : "none", margin : "20px 0px 20px 0px"}}>
          <Table   columns={columns} dataSource={tableData} size="small" pagination={false} style={{width: "100%", maxHeight : "300px", overflow: "auto"}}/>
        </span>

        <span style={{ margin : "20px 0px 20px 0px"}}>
        <Checkbox onChange={onCheckBoxChnage}>Overwrite File(s)</Checkbox>
        </span>

        <span>
          <Button size="large" disabled={files.length< 1 || uploading}onClick={handleFileUpload} type="primary"  > Upload</Button>
        </span>
        </LandingZoneUploadContainer>
    )
}

export default LandingZoneUpload;

//Give option to remove file
//Support protected clusters
//Dont route users
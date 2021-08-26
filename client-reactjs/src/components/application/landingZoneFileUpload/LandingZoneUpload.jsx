import React, {useState, useEffect} from 'react';
import {useSelector} from "react-redux"
import { Upload, Table, Select, message, TreeSelect, Button,Checkbox,Spin    } from 'antd';
import { InboxOutlined, LoadingOutlined } from '@ant-design/icons';
import { io } from "socket.io-client";
import{LandingZoneUploadContainer, columns } from "./landingZoneUploadStyles";
import {v4 as uuidv4} from 'uuid';
import { authHeader, handleError } from "../../common/AuthHeader.js";
import { useHistory } from 'react-router';

function LandingZoneUpload() {
  const [files, setFiles] = useState([]);
  const [socket, setSocket] = useState(null);
  const [tableData, setTableData] = useState([]);
  const [destinationFolder, setDestinationFolder] = useState("");
  const [cluster, setCluster] = useState(null);
  const [dropzones, setDropZones] = useState([]);
  const [selectedDropZone, setSelectedDropZone]= useState(null)
  const [machine, setMachine] = useState(null);
  const [directory, setDirectory] = useState(null);
  const [currentDirectoryFiles, setCurrentDirectoryFiles] = useState([])
  const [treeData, setTreeData] = useState([]);
  const [overWriteFiles, setOverWriteFiles] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [successItem, setSuccessItem] = useState(null);
  const authReducer = useSelector(state => state.authReducer);
  const clusters = useSelector(state => state.applicationReducer.clusters);
  const devURL = 'http://localhost:3000/landingZoneFileUpload';
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
          token : authReducer.user.token
        }
        });
        setSocket(socket);
    }
  }, []);

  useEffect(() => {
    if(cluster){
      let {id} = JSON.parse(cluster);
      fetch(`/api/hpcc/read/getDropzones?clusterId=${id}&for=fileUpload`,{
        headers : authHeader()
      }).then(response => {
        if(response.ok){
          return response.json()
        }
        handleError(response);
      }).then(data =>{
        data.map(item => {
          setDropZones([{name: item.name, path: item.path, machines: item.machines, id: uuidv4()}])
        })   
      })
    }
      // Get directory tree on initial render
      if(selectedDropZone  != null && machine != null && cluster !== null){
        getDirectories("/", cluster)
        .then((result) =>{
          let data = result.FileListResponse.files.PhysicalFileStruct.map(item =>{
            return {...item, title : item.name, key : uuidv4(),  directorypath: `/${item.name}`,  children: [{title : "...  Loading", disabled : true, key : uuidv4()}]}
          })
          setTreeData(data)
        }).catch((err) => {
          console.log("Err ", err)
        })
      }  
  }, [cluster, selectedDropZone, machine])

  // Get child dirs
  const [currentlyExpandedNodes, setCurrentlyExpandedNodes] = useState([]);
  const getNestedDirectories = (expandedKeys) =>{
    if(currentlyExpandedNodes.length < expandedKeys.length){
      setCurrentlyExpandedNodes(expandedKeys)
      let targetDirectory = expandedKeys[expandedKeys.length - 1];
      //Tree is expanded
      let targetDirectoryPath = getDirectoryPath(targetDirectory);
      //Get nested dirs for expanded node
      getDirectories(targetDirectoryPath, cluster).then(result =>{
        const directory = result.FileListResponse?.files;
        let treeDataCopy = [...treeData];
        if(directory){
          
          let newChildDirArray = directory.PhysicalFileStruct.map(item => {
            return {...item, key: uuidv4(), title: item.name, directorypath : `${targetDirectoryPath}/${item.name}`, children: [{key: uuidv4(), title: "... Loading", disabled: true}]}
          })
          reCalcTreeData(targetDirectory, newChildDirArray, treeDataCopy)
        }else{
          let newChildDirArray = [{title : "No Data", disabled : true, key : uuidv4()}]
          reCalcTreeData(targetDirectory, newChildDirArray, treeDataCopy)
        }
      })
    }else{
      //Tree is collapsed
      setCurrentlyExpandedNodes(expandedKeys)
    }
  }

  //Recalculate treedata after a node is expanded
  const reCalcTreeData = (key, newChildDirArray, data) =>{
    for (let i = 0; i < data.length; i++){
      if(data[i].key === key){
        data[i].children = newChildDirArray;
        break;
      }else if (data[i].children){
        reCalcTreeData(key,newChildDirArray, data[i].children)
      }
    }
    setTreeData(data)
  }

  //Get directories func
  const getDirectories = (path, cluster) =>{
    let{thor_host, thor_port} = JSON.parse(cluster)
    let data = {
      Netaddr : machine,
      Path : `${directory}${path}`,
      OS : 2,
      rawxml_ : true,
      DirectoryOnly: true
    }

    return fetch(`/api/hpcc/read/getDirectories?data=${JSON.stringify(data)}&host=${thor_host}&port=${thor_port}`,{
      headers : authHeader(),
    }).then(response => response.json())
  }

  //Get files
   const getFiles = (path, cluster) =>{

    let{thor_host, thor_port} = JSON.parse(cluster)
    return fetch(`/api/hpcc/read/getDirectories?data=${JSON.stringify({Netaddr : machine,
      Path : `${directory}${path}`,
      OS : 2,
      rawxml_ : true,
      DirectoryOnly: false})}&host=${thor_host}&port=${thor_port}`,{
      headers : authHeader(),
    }).then(response => response.json())
      .then(data => {setCurrentDirectoryFiles( data.FileListResponse.files.PhysicalFileStruct)})
  }


// Recurssive dir lookup
let correctChild;
const findCorrectChild = (key, dirObj) =>{
  if(dirObj.children){
    for(let i = 0; i <  dirObj.children.length;i++){
      if(dirObj.children[i].key === key){
        correctChild = dirObj.children[i];
        break;
      }else if(dirObj.children[i].children){
        findCorrectChild(key, dirObj.children[i])
      }
    }
  }
  return correctChild;
}

//Get directory path
const getDirectoryPath = (key) => {
  let targetDirectorypath;
  treeData.map(item => {
    if(item.key === key){
      targetDirectorypath =  item.directorypath;
      return;
    }else{
      //not root dirs
      let child = findCorrectChild(key, item);
      if(child){
      targetDirectorypath = child.directorypath
      }
    }
  })
  return targetDirectorypath;
}

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
    message.success("The file has been uploaded successfully to the Landing Zone");
    setUploading(false)
    setSuccessItem(null)
    socket.close();
    history.push("/")
  }
  setTableData(newTableData);
}, [files])

  // Listining to msgs from socket
  useEffect(() =>{
    //When message is received from back end
    if(socket){
      socket.on("message", (message) =>{
      })
     }

     //Response
     if(socket){
      socket.on('file-upload-response', (response => {
        if(response.success){
          setSuccessItem(response.id);
        }else if(!response.success){
          message.error(`Unable to upload file - ${response.message}`);
          setUploading(false)
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
    let existingDirFiles = currentDirectoryFiles.map(item => item.name);
    let newFiles = files.map(item => item.name);
    let commonFiles = existingDirFiles.filter(item => newFiles.includes(item));

    message.config({top:150,   maxCount: 1});
    if(!cluster){
      message.error("Select a cluster")
    }else if(!machine){
      message.error("Select machine")
    }else if(!destinationFolder){
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
    setFiles(filesCopy)
    // Start by sending some file details to server
    socket.emit('start-upload', {destinationFolder, cluster, machine, dropZone : JSON.parse(selectedDropZone)?.name});
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
    }
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

  // Select drop down
  function handleClusterChange(value) {
    setCluster(value);
  }
  //Dropzone selection
  const handleLandingZoneChange = (value) =>{
    setSelectedDropZone(value)
  }
  //Machine Selection
  const  handleMachineChange = (value) => {
    setMachine(value);
    JSON.parse(selectedDropZone)?.machines.map(item =>{
      if(item.Netaddress === value){
        setDirectory(item.Directory)
      }
    });
  }
  //Handle node tree selection
  const handleTreeNodeSelection = (value) => {
    let targetDirectoryPath = getDirectoryPath(value);
    setDestinationFolder(targetDirectoryPath);
    getFiles(targetDirectoryPath, cluster)
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
                      return <Option key={uuidv4()} value={JSON.stringify(item)}>{item.name}</Option>
                  })}
            </Select>
          </span>

          <span>
            <small>Landing Zone: </small>
            <Select defaultValue = ""  onChange={handleLandingZoneChange}  size="large" style={{width: "100%"}}>
                  {dropzones.map((item) => {
                      return <Option key={uuidv4()} value={JSON.stringify(item)}>{item.name}</Option>
                  })}
            </Select>
          </span>

          <span style={{display: selectedDropZone == null ? "none" : "block"}}>
            <small>Machine: </small>
            <Select defaultValue = "" onChange={handleMachineChange}  size="large" style={{width: "100%"}}>
                  {JSON.parse(selectedDropZone)?.machines.map(item => {
                    return <Option key={uuidv4()} value={item.Netaddress}>{item.Netaddress}</Option>
                  })}
            </Select>
          </span> 
          
          <span style={{display: machine == null? "none" : "block"}}>
            <small>Folder</small>
            <TreeSelect
              style={{ width: '100%'}}
              value={destinationFolder}
              placeholder="Please select"
              allowClear
              onChange={handleTreeNodeSelection}
              treeData={treeData}
              onTreeExpand={getNestedDirectories}
              >
              <span style={{height: "900px"}}> Hello</span>
            </TreeSelect>
          </span>
        
        <Dragger 
        {...props}
        customRequest={({ onSuccess }) => { onSuccess("ok");}}
        >
            <p className="ant-upload-drag-icon">
            <InboxOutlined />
            </p>
            <p className="ant-upload-text"><b>Click or drag file to this area to upload</b></p>
            <p className="ant-upload-hint">
            Support for a single or bulk upload. 
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
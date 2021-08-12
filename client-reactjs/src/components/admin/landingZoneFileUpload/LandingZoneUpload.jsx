import React, {useState, useEffect} from 'react';
import {useSelector} from "react-redux"
import { Upload, Table, Select, message, Input, TreeSelect, Button  } from 'antd';
import { InboxOutlined} from '@ant-design/icons';
import { io } from "socket.io-client";
import{LandingZoneUploadContainer, columns } from "./landingZoneUploadStyles";
import {v4 as uuidv4} from 'uuid';

function LandingZoneUpload() {
  const [files, setFiles] = useState([]);
  const [socket, setSocket] = useState(null);
  const [tableData, setTableData] = useState([]);
  const [destinationFolder, setDestinationFolder] = useState("");
  const [cluster, setCluster] = useState(null);
  const [clusterIp, setClusterIp] = useState("10.173.147.1");
  const [treeData, setTreeData] = useState([]);
  const authReducer = useSelector(state => state.authReducer);
  const clusters = useSelector(state => state.applicationReducer.clusters);
  const devURL = 'http://localhost:3000/landingZoneFileUpload';
  const prodURL  = '/landingZoneFileUpload'
  const { Dragger } = Upload;
  const { Option,  } = Select;

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

    // Get directory tree on initial render
    getDirectories("")
    .then((result) =>{
      let data = result.FileListResponse.files.PhysicalFileStruct.map(item =>{
        return {...item, title : item.name, key : uuidv4(),  directorypath: "",  children: [{title : "...  Loading", disabled : true, key : uuidv4()}]}
      })
      setTreeData(data)
    }).catch((err) => {
      console.log("<<<< err ", err)
    })
  }, []);

  // Get child dirs
  const [currentlyExpandedNodes, setCurrentlyExpandedNodes] = useState([]);
  const getNestedDirectories = (expandedKeys) =>{

    if(currentlyExpandedNodes.length < expandedKeys.length){
      //Tree is expanded
      setCurrentlyExpandedNodes(expandedKeys)
      let targetDirectory = expandedKeys[expandedKeys.length - 1];

     // <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
     let path="";
     let pathKeys=[];

     const getPath = (data) =>{
      let directoryFound = false;
      function getParent(data){
         for(let  i= 0; i <= data.length; i++){
           if(directoryFound){
              return {path, pathKeys};
           }
            else if(data[i].key === targetDirectory){
              pathKeys=[]
                path =data[i].title + "/";
               pathKeys.push(i);

              return {path, pathKeys};;
            }else if(data[i].children){
                 path =data[i].title + "/";
                 pathKeys=[];
                 pathKeys.push(i)
                 getChildPath(data[i].children);
          }else{
            console.log("Do nothing")
          }
      }
      }
      
      function getChildPath(data){
         for(let i=0; i < data.length; i++){
              if(directoryFound){
                   break;
              }
              else if(data[i].key === targetDirectory){
                  path = path + data[i].title + "/";
                  pathKeys.push(i);
                  directoryFound = true;
                  break;
              }else if(data[i].children){
                getChildPath(data[i].children)
        }
      }
      }
     return getParent(data); 
    }

    let directoryPath = getPath(treeData);
     // <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<

      //Make a call
      getDirectories(directoryPath.path)
      .then((result) => {
 
        let nestedDirs = result.FileListResponse.files?.PhysicalFileStruct;
        if(nestedDirs){
          let newNestedDirs = nestedDirs.map(item =>{
            return {...item, title : item.name, key : uuidv4(), children: [{title : "... Loading", disabled : true, key : uuidv4()}]}
          })

          let currentItem;

          for(let i = 0; i < directoryPath.pathKeys.length; i++){
            if(i==0){
              currentItem = `treeData[${directoryPath.pathKeys[i]}]`
            }else{
              currentItem = currentItem+`.children[${directoryPath.pathKeys[i]}]`
            }
          }


         let convertedCurrentItem = eval(currentItem);
         let updatedCurrentItem = {...convertedCurrentItem, children : newNestedDirs}


          //>>>>>>>>>>>>>>>>>>>>>>>>>>
          let treeDataCopy = [...treeData];
          let currentItemOnCopy = currentItem.replace('treeData', "treeDataCopy");
           eval(`${currentItemOnCopy}=updatedCurrentItem`);
           setTreeData(treeDataCopy)

          // setTreeData(newTreeData)
        }else{
       
          let currentItem;

          for(let i = 0; i < directoryPath.pathKeys.length; i++){
            if(i==0){
              currentItem = `treeData[${directoryPath.pathKeys[i]}]`
            }else{
              currentItem = currentItem+`.children[${directoryPath.pathKeys[i]}]`
            }
          }


         let convertedCurrentItem = eval(currentItem);
         let updatedCurrentItem = {...convertedCurrentItem, children : [{title : "No data", disabled : true, key : uuidv4()}]}


          //>>>>>>>>>>>>>>>>>>>>>>>>>>
          let treeDataCopy = [...treeData];
          let currentItemOnCopy = currentItem.replace('treeData', "treeDataCopy");
           eval(`${currentItemOnCopy}=updatedCurrentItem`);
           setTreeData(treeDataCopy)
        }
      })
      .catch(err => {
        console.log("<<<< Err ", err)
      })
    }else{
      //tree collapsed
      setCurrentlyExpandedNodes(expandedKeys)
    }
 
  }

  //Get directories func
  const getDirectories = (path) =>{
    let data = {
      Netaddr : "10.173.147.1",
      Path : `/var/lib/HPCCSystems/mydropzone/${path}`,
      OS : 2,
      rawxml_ : true,
      DirectoryOnly: true
    }
    const formData = new FormData();
    for(let key in data){
      formData.append(key, data[key])
    }
  
    return fetch('http://10.173.147.1:8010/FileSpray/FileList.json', {
          method :'POST',
          body : formData})
          .then(response => response.json())
  }
  


  // Listining to msgs from socket
  useEffect(() =>{
    //When message is received from back end
    if(socket){
      socket.on("message", (message) =>{
        console.log("<<<< Message ", message)
      })
     }
  
     //Clean up socket connection when component unmounts
     return function cleanup(){
       if(socket){
         console.log("<<<< Killing socket connection to landing zone")
         socket.close()
       }
     }
  }, [socket])

  //Setting table data
  useEffect(() =>{
    if(files.length > 0){
      files.map(item => {
        setTableData([ {key : uuidv4(), sno : tableData.length + 1, 
                                    // type : item.type,
                                     fileName : item.name, fileSize : item.size, uploadSuccess : item.uploadSuccess}]);
      })
    }
  }, [files])


  //Handle File Upload
  const handleFileUpload = () =>{
    message.config({top:150,   maxCount: 2})
    if(!cluster){
      message.error("Select a cluster")
    }else if(!destinationFolder){
      message.error("Select  destination folder")
    }
    else if(!clusterIp){
      message.error("Select Cluster Ip")
    }  else if(files.length < 1){
      message.error("Add files")
    }
      else{
    // Start by sending some file details to server
    socket.emit('start-upload', {destinationFolder, cluster, clusterIp});
    files.map(item => {
      // data.push({id : item.uid, fileName : item.name, fileSize : item.size})
      if(item.size <= 10000000){
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
        console.log("<<<< Big files send in chunks")
      }
    })

    //Response
    socket.on('file-upload-response', (response => {
      console.log("<<<< Response ", response)
      let newFilesArray = files.map(item => {
        console.log("<<<< Current item ",  item.uid)
        if(item.uid === response.id){
          item.uploadSuccess = true;
          return item;
        }
        return item;
      })
      console.log("<<<<", files)
      setFiles(newFilesArray);
    }))
  
      //When server asks for a slice of a file
      socket.on('supply-slice', (message) =>{
        console.log(message, "<<<< Message")
        let slice = files[0].slice(message.sliceStart, message.sliceEnd);
        let reader = new FileReader();
        reader.readAsArrayBuffer(slice);
        reader.onload = function(e){
          let arrayBuffer = e.target.result;
          socket.emit('upload-slice', {
            fileName : files[0].name,
            data: arrayBuffer,
            sliceStartsAt : message.sliceEnd
          })
        }
      })
    }
    }

  //Draggeer's props
  const props = {
    name: 'file',
    multiple: true,
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
  function handleChange(value) {
    setCluster(value);
  }

  //Handle node tree selection
  const handleTreeNodeSelection = (value) => {
    setDestinationFolder(value);
  }

    return (
        <LandingZoneUploadContainer>
          <span>
            <small>Cluster</small>
            <Select defaultValue = "" style={{color: "red"}}  onChange={handleChange}  size="large"
              style={{width: "100%"}}>
                  {clusters.map((item, index) => {
                      return <Option key={index} value={JSON.stringify(item)}>{item.name}</Option>
                  })}
            </Select>
          </span>

          <span>
            <small>Cluster IP</small>
            <Input value= {clusterIp} onChange ={(e) => {setClusterIp(e.target.value)}} size="large"/>
          </span>
          <TreeSelect
            style={{ width: '100%' }}
            value={destinationFolder}
            dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
            placeholder="Please select"
            allowClear
            // onChange={handleTreeNodeSelection}
            treeData={treeData}
            onTreeExpand={getNestedDirectories}
          >
        </TreeSelect>

        <Dragger 
        {...props}
        customRequest={({ onSuccess }) => {
          onSuccess("ok");
      }}
        showUploadList={false}
        multiple={true}
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

        <Button size="large" onClick={handleFileUpload} type="primary" block > Upload</Button>
        </LandingZoneUploadContainer>
    )
}

export default LandingZoneUpload;

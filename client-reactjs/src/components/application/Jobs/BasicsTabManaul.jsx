import React, {useState, useEffect} from 'react'
import { authHeader, handleError } from "../../common/AuthHeader.js"
import { Form, Input, Select,AutoComplete, Spin,message  } from 'antd/lib';
import ReactMarkdown from 'react-markdown';
import {v4 as uuidv4} from 'uuid';
import { MarkdownEditor } from "../../common/MarkdownEditor.js";
import { Cascader } from "antd";


function BasicsTabManul(props) {
  const optionLists = [
    {
      value: 'zhejiang',
      label: 'Zhejiang',
      isLeaf: false,
    },
    {
      value: 'jiangsu',
      label: 'Jiangsu',
      isLeaf: false,
    },
  ];

    const {enableEdit, localState, editingAllowed, clusters, onChange, jobType, applicationId, setDisableReadOnlyFields, formRef, setJobDetails} = props;
    const [selectedCluster, setSelectedCluster] = useState('');
    const [dropZones, setDropZones] = useState([]);
    // const [options, setOptions] = useState([]);
    const [options, setOptions] = React.useState(optionLists);
    const [currentPath, setCurrentPath] = useState([]);
    const { Option } = Select;  

    // On form input change 
    const onFilePathChange = (value) =>{
      setCurrentPath(value);
    }

    //on cluster selection
    const onClusterSelection = (value) =>{
      console.log(value,  "<<<<<<<<<<<<<<<< CLUSTERR")
      setSelectedCluster(value)
    }

    //When the cluster id changes make a call and get all dropzones within that cluster
    useEffect(() => {
        if(selectedCluster){
          fetch(`/api/hpcc/read/getDropzones?clusterId=${selectedCluster}&for=fileUpload`,{
            headers : authHeader()
          }).then(response => {
            if(response.ok){
              return response.json()
            }
            handleError(response);
          }).then(data =>{
            data.map(item => {
            setDropZones([item])
            })   
          }).catch(err =>{
              console.log(err)
          })
        }          
      }, [selectedCluster])

      //local state tracking
      useEffect(() =>{
      }, [localState])

    // once the dropzone info is received start building options array for cascader
    // First thing map through the dropzones array and get the netaddress(machine)
    useEffect(() =>{
        if(dropZones.length > 0){
            let options = dropZones.map(dropzone => {
              return {
                value : dropzone.name,
                label : dropzone.name,
                key : uuidv4(),
                isLeaf : false,
                children : dropzone.machines.map(item =>{
                    return { value: item.Netaddress, label: item.Netaddress, key: uuidv4, isLeaf : false}
                })
            }
        }
            );
            setOptions(options)        
        }
    }, [dropZones])

    //Get more data
    const loadData = selectedOptions => {
      const targetOption = selectedOptions[selectedOptions.length - 1];
      console.log("<<<<<<< target option", selectedOptions);
      targetOption.loading = true;

      //form data
      let data  = {"Netaddr":"10.173.147.1","Path":"/var/lib/HPCCSystems/mydropzone/","OS":2,"rawxml_":true,"DirectoryOnly":true}
      let host = "host: http://10.173.147.1"
      let port =  "8010"



      fetch(`/api/hpcc/read/getDirectories?data=${JSON.stringify(data)}&host=${host}&port=${port}`,{
        headers : authHeader(),
      }).then(response => { 
        if(response.ok){
          console.log(response , "<<<<<<<<<<<<<<< response")
        return response.json()
        }
        handleError(response);})
        .then (data =>{ console.log(data)})
        .catch(err => {console.log(err)})

  
      // load options lazily
      // setTimeout(() => {
      //   targetOption.loading = false;
      //   targetOption.children = [
      //     {
      //       label: `${targetOption.label} Dynamic 1`,
      //       value: 'dynamic1',
      //       isLeaf: false
      //     },
      //     {
      //       label: `${targetOption.label} Dynamic 2`,
      //       value: 'dynamic2',
      //       isLeaf: true
      //     },
      //   ];
      //   setOptions([...options]);
      // }, 1000);
    };

    return (
        <>  
            <Form.Item  
                label="Cluster" 
                name="clusters"
                rules={[{ required: true, message: 'Please select a cluster!'}]}>
                <Select placeholder="Select a Cluster" disabled={!editingAllowed} onChange={onClusterSelection} style={{ width: 190 }}>
                    {clusters.map(cluster => <Option key={cluster.id}>{cluster.name}</Option>)}
                </Select>
            </Form.Item>

            <Form.Item 
                label="File Path" 
                name="path"
                // rules={[{ required: true, message: 'Please specify file location!' }]}
                >
                <Cascader
                    changeOnSelect={true}
                    options={options}
                    onChange={onFilePathChange}
                    loadData={loadData}
                    placeholder="Please select"
                    allowClear
                />
            </Form.Item>
       
            <Form.Item 
                label="Name" 
                name="name" 
                rules={[{ required: true, message: 'Please enter a Name!', pattern: new RegExp(/^[a-zA-Z0-9:._-]*$/) }]}>
                <Input
                    id="job_name"
                    value={localState.name}
                    onChange={onChange}
                    placeholder="Name"
                    disabled={true}
                    disabled={!editingAllowed}
                    className={enableEdit ? null : "read-only-input"} />
            </Form.Item>

            <Form.Item label="Title" 
                name="title" 
                rules={[{ required: true, 
                    message: 'Please enter a title!' }, {
                    pattern: new RegExp(/^[a-zA-Z0-9:._-]*$/),
                    message: 'Please enter a valid Title',}]}>
                <Input id="job_title"
                    onChange={onChange}
                    placeholder="Title"
                    disabled={!editingAllowed}
                    className={enableEdit? null : "read-only-input"}
                />
            </Form.Item>

            <Form.Item label="Description" 
                name="description">
                {enableEdit ?
                <MarkdownEditor
                    name="description"
                    id="job_desc"
                    onChange={onChange}
                    targetDomId="jobDescr"
                    value={localState.description}
                    disabled={!editingAllowed}
                />
                :
                <div className="read-only-markdown"> <ReactMarkdown source={localState.description} /></div>
                }
            </Form.Item>
        
            <Form.Item  
                label="Contact Email" 
                name="contact" 
                rules={[{ type: 'email',
                    required : true,
                    message: 'Please enter a valid email address', }]}>
                {enableEdit ?
                <Input 
                    id="job_bkp_svc"
                    onChange={onChange}
                    placeholder="Contact"
                    value={localState.contact}
                    disabled={!editingAllowed}
                />
                :
                <textarea className="read-only-textarea" />
            }
            </Form.Item>         
      </>   
    )
}

export default BasicsTabManul

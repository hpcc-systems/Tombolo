import React, {useState, useEffect} from 'react'
import { authHeader, handleError } from "../../common/AuthHeader.js"
import { Form, Input, Select} from 'antd/lib';
import ReactMarkdown from 'react-markdown';
import { MarkdownEditor } from "../../common/MarkdownEditor.js";
import { useSelector,useDispatch } from "react-redux";
import { assetsActions } from '../../../redux/actions/Assets';
import { Cascader } from "antd";

function BasicsTabManul(props) {
    const assetReducer = useSelector(state => state.assetReducer);
    const applicationReducer = useSelector(state => state.applicationReducer)
    const {enableEdit, localState, editingAllowed,  onChange, formRef} = props;
    const [options, setOptions] = useState([]);
    const [machines, setMachines] = useState({});
    const [selectedCluster, setSelectedCluster] = useState(assetReducer.clusterId);
    const [clusters, setClusters] = useState(applicationReducer.clusters)
    const { Option } = Select; 
    const dispatch = useDispatch();  

    // On form file path (cascader value) change 
    const onFilePathChange = (value) =>{
      formRef.current.setFieldsValue({name : value[value.length -1],
                                      title: value[value.length -1] })
    }


    //When cluster is selected
    const onClusterSelection = (value) => {
      dispatch(assetsActions.clusterSelected(value));
      setSelectedCluster(value);
      localState.selectedCluster = value;
    }

    //When the cluster id changes make a call and get all dropzones within that cluster
    useEffect(() => {
      if(selectedCluster){
        console.log("Selected cluster is <<<<", selectedCluster)
          fetch(`/api/hpcc/read/getDropzones?clusterId=${selectedCluster}&for=fileUpload`,{
            headers : authHeader()
          }).then(response => {
            if(response.ok){
              return response.json()
            }
            handleError(response);
          }).then(data =>{
              let newOptions = [];
              data.map(item => {
                  newOptions.push( {'value' : item.path, 'label' : item.name, isLeaf: false});
                  setMachines(item.machines[0]);
              })
              setOptions(newOptions);             
          }).catch(err =>{
              console.log(err)
          })
      }  
      }, [selectedCluster])


    //when dropzone is selected make call to get the dirs and files
    const loadData = ( selectedOptions) =>{      
      let path = selectedOptions.map(item => item.value);
      let pathToAsset = path.join("/");
      const host = clusters.filter(item => item.id === selectedCluster)
      const targetOption = selectedOptions[selectedOptions.length - 1];
      targetOption.loading = true;
     
          const data = JSON.stringify({
            Netaddr : machines.Netaddress,
            Path : pathToAsset,
            OS : machines.OS,
            rawxml_ : true,
            DirectoryOnly: false})
              fetch(`/api/hpcc/read/getDirectories?data=${data}&host=${host[0].thor_host}&port=${host[0].thor_port}`, {
                headers : authHeader()
              }).then(response =>{
                if(response.ok){
                  return response.json()
                }
                handleError(response)
              }).then(data =>{
                let children = [];
                 data.FileListResponse.files.PhysicalFileStruct.map(item =>{
                  let child = {};
                  child.value =item.name;
                  child.label = item.name;
                  child.isLeaf = !item.isDir;
                  children.push(child);
                });
                children=children.sort(function(a,b){
                  if(a.isLeaf < b.isLeaf){ return -1};
                })
                targetOption.loading= false;
                targetOption.children = children;
                setOptions([...options]);
              })
              .catch(err =>{
                console.log(err)
              })         
    }

    //JSX
    return (
        <>  
            {enableEdit ? 
             <Form.Item  label="Cluster" name="clusters">
                <Select placeholder="Select a Cluster" disabled={!editingAllowed} onChange={onClusterSelection} style={{ width: 190 }}>
                    {clusters.map(cluster => <Option key={cluster.id}>{cluster.name}</Option>)}
                </Select>
              </Form.Item>
           : null}

            {localState.isNew || enableEdit? 
            <Form.Item 
                label="File Path" 
                name="path"
                >
                <Cascader
                    showSearch={true}
                    options={options}
                    onChange={onFilePathChange}
                    loadData={loadData}
                    placeholder="Please select"
                    onChange={onFilePathChange}
                    className={enableEdit ? null : "read-only-input"}
                    className={enableEdit ? null : "read-only-input" }
                    allowClear
                />
            </Form.Item> : null}
       
            <Form.Item 
                label="Name" 
                name="name" 
                rules={[{ required: true, message: 'Please enter a Name!' }]}>
                <Input
                    id="job_name"
                    onChange={onChange}
                    placeholder="Name"
                    disabled={true}
                    disabled={!editingAllowed}
                    className={enableEdit ? null : "read-only-input"}
                    disabled />
            </Form.Item>

            <Form.Item label="Title" 
                name="title" 
                rules={[{ required: true, 
                    message: 'Please enter a title!' }, {
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
                <div className="read-only-markdown">
                <ReactMarkdown children={localState.job.description} />
             </div>
                }
            </Form.Item>
        
            <Form.Item  
                label="Contact" 
                name="contact" 
                rules={[{ type: 'email',
                    required : true,
                    message: 'Please enter a valid email address'}]}>
                <Input 
                    id="job_bkp_svc"
                    onChange={onChange}
                    placeholder="Contact"
                    disabled={!editingAllowed}
                    className={enableEdit ? null : "read-only-input"}
                />
            </Form.Item>         
      </>   
    )
}

export default BasicsTabManul

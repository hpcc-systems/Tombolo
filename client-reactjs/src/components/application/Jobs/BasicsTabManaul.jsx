import React, {useState, useEffect} from 'react'
import { authHeader, handleError } from "../../common/AuthHeader.js"
import { Form, Input, Select} from 'antd/lib';
import ReactMarkdown from 'react-markdown';
import { MarkdownEditor } from "../../common/MarkdownEditor.js";
import { useSelector,useDispatch } from "react-redux";
import { assetsActions } from '../../../redux/actions/Assets';
import { Cascader } from "antd";

function BasicsTabManul(props) {
    const {enableEdit, localState, editingAllowed,  onChange, formRef, addingNewAsset} = props;
    const assetReducer = useSelector(state => state.assetReducer);
    const applicationReducer = useSelector(state => state.applicationReducer);
    const readOnlyView = !enableEdit || !addingNewAsset;
    const [options, setOptions] = useState([]);
    // const [machines, setMachines] = useState({});
    const [selectedCluster, setSelectedCluster] = useState(assetReducer.clusterId);
    const [clusters, setClusters] = useState(applicationReducer.clusters)
    const { Option } = Select; 
    const dispatch = useDispatch();  

    useEffect(() => {
    // console.log("<<<<<<<<<<< Selected cluster", selectedCluster)
    }, [selectedCluster])

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
          fetch(`/api/hpcc/read/getDropzones?clusterId=${selectedCluster}&for=manualJobSerach`,{
            headers : authHeader()
          }).then(response => {
            if(response.ok){
              return response.json()
            }
            handleError(response);
          }).then(data =>{
              let newOptions = [];
              data.map(item => {
                  newOptions.push( {'value' : item.path, 'label' : item.name, machine: item.machines[0], isLeaf: false});
              })
              setOptions(newOptions);             
          }).catch(err =>{
              console.log(err)
          })
      }  
      }, [selectedCluster])

      //Clear error when on focus
      const clearError = (e) => {
        formRef.current.setFields([
          {
            name: e.target.id,
            errors: [],
          },
       ]);
      }


    //when dropzone is selected make call to get the dirs and files
    const loadData = (selectedOptions) =>{
      let pathOptions = [...selectedOptions];  // make a copy so the original array is not mutated
      pathOptions.splice(1,1); // Remove machine address
      const pathToAsset = pathOptions.map(item =>item.value).join("/") + "/"; // join options array with "/" to create a path
      const host = clusters.filter(item => item.id === selectedCluster)
      const targetOption = selectedOptions[selectedOptions.length - 1];

      targetOption.loading = true;
          const data = JSON.stringify({
            Netaddr : selectedOptions[0].machine.Netaddress,
            Path : pathToAsset,
            OS : selectedOptions[0].OS,
            rawxml_ : true,
            DirectoryOnly: false})
              fetch(`/api/hpcc/read/getDirectories?data=${data}&host=${host[0].thor_host}&port=${host[0].thor_port}&clusterId=${selectedCluster}`, {
                headers : authHeader()
              }).then(response =>{
                if(response.ok){
                  return response.json()
                }
                handleError(response)
              }).then(data =>{
                if(data.FileListResponse.files){
                let children = [];
                 data.FileListResponse.files.PhysicalFileStruct.map(item =>{
                  let child = {};
                  child.value =item.name;
                  child.label = item.name;
                  child.isLeaf = !item.isDir;
                  children.push(child);
                });

                //Sort the result so the dirs are always on top
                children.sort(function(a,b){
                  if(a.isLeaf < b.isLeaf){ return -1};
                })
                targetOption.loading= false;
                targetOption.children = children;
                setOptions([...options]);
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

    //Cascader initial value
    useEffect(() => {
      formRef.current.setFieldsValue({ manualJobFilePath : localState.job.manualJobFilePath})
    }, [])

    //JSX
    return (
        <>  
            {enableEdit ? 
             <Form.Item  label="Cluster" name="clusters" hidden={readOnlyView}>
                <Select placeholder="Select a Cluster" disabled={!editingAllowed} onChange={onClusterSelection} style={{ width: 190 }}>
                    {clusters.map(cluster => <Option key={cluster.id}>{cluster.name}</Option>)}
                </Select>
              </Form.Item>
           : null}

            {localState.isNew || enableEdit? 
            <Form.Item 
                label="File Path" 
                name="manualJobFilePath"
                >
                <Cascader
                    options={options}
                    onChange={onFilePathChange}
                    loadData={loadData}
                    placeholder="Please select"
                    className={enableEdit ? null : "read-only-input"}   
                    allowClear
                />
            </Form.Item> : null}
       
            <Form.Item 
                label="Name" 
                name="name" 
                validateTrigger= "onBlur"
                onFocus={clearError}
                rules={[{ required: true, message: 'Please enter a Name!' }]}>
                <Input
                    onChange={onChange}
                    placeholder="Name"
                    disabled={formRef.current.getFieldValue('path') && formRef.current.getFieldValue('path')?.length > 0? true : false}
                    className={enableEdit ? null : "read-only-input"}
                     />
            </Form.Item>

            <Form.Item label="Title" 
                name="title" 
                rules={[{ required: true, message: 'Please enter a title!' }]}
                onFocus={clearError}
                validateTrigger= "onBlur"
                >
                <Input
                    onChange={onChange}
                    placeholder="Title"
                    disabled={!editingAllowed}
                    className={enableEdit? null : "read-only-input"}
                />
            </Form.Item>

            <Form.Item label="Description" 
                name="description"
                >
                {enableEdit ?
                <MarkdownEditor
                    name="description"
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
                validateTrigger= "onBlur"
                onFocus={clearError}
                rules={[{ type: 'email',
                    required : true,
                    message: 'Please enter a valid email address'}]}>
                <Input 
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

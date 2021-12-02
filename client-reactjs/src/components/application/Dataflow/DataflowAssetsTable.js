import React, { useState, useEffect } from 'react'
import { Table, message, Popconfirm, Tooltip, Divider} from 'antd/lib';
import { authHeader, handleError } from "../../common/AuthHeader.js"
import { hasEditPermission } from "../../common/AuthUtil.js";
import useFileDetailsForm from '../../../hooks/useFileDetailsForm';
import { assetsActions } from "../../../redux/actions/Assets";
import { useSelector, useDispatch } from "react-redux";
import AssetDetailsDialog from "../AssetDetailsDialog"
import { EditOutlined  } from '@ant-design/icons';

function DataflowAssetsTable({applicationId, selectedDataflow, user, application}) {
	const [dataflowAssets, setDataflowAssets] = useState([]);
  const [dataflowGraph, setDataflowGraph] = useState({nodes:{}, edges:{}});
	const [selectedAsset, setSelectedAsset] = useState({id:'', type:''});
	const { isShowing, toggle, OpenDetailsForm } = useFileDetailsForm();
  const dispatch = useDispatch();

	useEffect(() => {
    async function fetchData () {
      if(applicationId) {
        fetchDataAndRenderTable();
      }
    }
    fetchData()
	}, []);

  const authReducer = useSelector(state => state.authenticationReducer);

	const fetchDataAndRenderTable = () => {
    return new Promise((resolve, reject) => {
      fetch("/api/dataflow/assets?app_id="+applicationId+"&dataflowId="+selectedDataflow.id, {
        headers: authHeader()
      })
      .then((response) => {
        if(response.ok) {
          return response.json();
        }
        handleError(response);
      })
      .then(data => {
        setDataflowAssets(data)
        resolve();
      }).catch(error => {
        reject();
        console.log(error);
      });
  
    })
  }

  const fetchDataflowGraph = () => {
    return new Promise((resolve, reject) => {
      fetch("/api/dataflowgraph?application_id="+applicationId+"&dataflowId="+selectedDataflow.id, {
        headers: authHeader()
      })
      .then((response) => {
        if(response.ok) {
          return response.json();
        }
        handleError(response);
      })
      .then(data => {
        setDataflowGraph({
          nodes: JSON.parse(data.nodes),
          edges: JSON.parse(data.edges)
        })
        resolve();
  
      }).catch(error => {
        console.log(error);
        reject();
      });
  
    })
  }

  const handleEdit = async (id, type) => {
    dispatch(assetsActions.assetSelected(
      id,
      applicationId,
      ''
    ));    
    await fetchDataflowGraph();
  	setSelectedAsset({id:id, type:type})
  	toggle();
  }

  const handleClose = async () => {
    await fetchDataAndRenderTable();
    toggle();
  }

  const editingAllowed = hasEditPermission(authReducer.user);

	const jobColumns = [
  {
    title: 'Name',
    dataIndex: 'name',
    width: '30%',
    ellipsis: true,
    render: (text, record) => <a href='#' onClick={(row) => handleEdit(record.id, record.objType)}>{text}</a>
  },
  {
    title: 'Description',
    dataIndex: 'description',
    width: '30%',
  },
  {
    title: 'Created Date',
    dataIndex: 'createdAt',
    width: '20%',
  },
  {
    title: 'Owner',
    dataIndex: 'contact',
    width: '20%',
  },
  {
    title: 'Type',
    dataIndex: 'objType',
    width: '15%',
  }];

  return (
	  <React.Fragment>
    <div style={{"height": "85%"}}>
		  <Table
        columns={jobColumns}
        rowKey={record => record.id}
        dataSource={dataflowAssets}
        pagination={dataflowAssets?.length > 10? { pageSize: 10 }:  false}
         scroll={{ y: 660 }}
			/>
			{isShowing ?
      <AssetDetailsDialog
        assetType={selectedAsset.type}
        assetId={selectedAsset.id}
        selectedAsset={selectedAsset}
        title={""}
        nodes={dataflowGraph.nodes}
        graph={dataflowGraph.graph}
        selectedDataflow={selectedDataflow}
        application={application}
        user={user}
        handleClose={handleClose}
      /> : null}				
		</div>
    </React.Fragment>
	)
}
export default DataflowAssetsTable
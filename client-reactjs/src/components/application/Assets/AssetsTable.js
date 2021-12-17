import React, { useState, useEffect } from "react";
import { Table, message, Popconfirm, Tooltip, Divider, Space , Typography, Button} from "antd/lib";
import { authHeader, handleError } from "../../common/AuthHeader.js";
// import FileDetailsForm from "../FileDetails";
import MoveAssetsDialog from "./MoveAssetsDialog";
import { hasEditPermission } from "../../common/AuthUtil.js";
import useFileDetailsForm from "../../../hooks/useFileDetailsForm";
import { useSelector, useDispatch } from "react-redux";
import { Constants } from "../../common/Constants";
import { assetsActions } from "../../../redux/actions/Assets";
import { useHistory } from "react-router";
import useModal from "../../../hooks/useModal";
import { DeleteOutlined, EditOutlined, QuestionCircleOutlined, FolderOpenOutlined, FilePdfOutlined, AreaChartOutlined } from "@ant-design/icons";
import { store } from "../../../redux/store/Store";
import SelectDetailsForPdfDialog from "../Assets/pdf/SelectDetailsForPdfDialog";
import { getNestedAssets} from "../Assets/pdf/downloadPdf";

function AssetsTable({ openGroup, handleEditGroup, refreshGroups }) {
  const [assets, setAssets] = useState([]);
  const { isShowing, toggle, OpenDetailsForm } = useFileDetailsForm();
  const { authReducer, applicationReducer, assetReducer, groupsMoveReducer, groupsReducer } = useSelector(
    (state) => ({
      groupsReducer:state.groupsReducer,
      authReducer: state.authenticationReducer,
      applicationReducer: state.applicationReducer,
      assetReducer: state.assetReducer,
      groupsMoveReducer: state.groupsMoveReducer
     }));
       
     
  const selectedGroup = groupsReducer

  const history = useHistory();
  const applicationId = applicationReducer?.application?.applicationId || ''

  const { showMoveDialog = isShowing, toggleMoveDialog = toggle } = useModal();
  const { assetTypeFilter, keywords } = assetReducer.searchParams;
  const [assetToMove, setAssetToMove] = useState({ id: "", type: "", title: "", selectedGroup: {}, });
  const [selectedAsset, setSelectedAsset] = useState();
  const [toPrintAssets, setToPrintAssets] = useState([])
  const [selectDetailsforPdfDialogVisibility, setSelectDetailsforPdfDialogVisibility] = useState(false);


  const dispatch = useDispatch();  
  const editingAllowed = hasEditPermission(authReducer.user);

  const fetchDataAndRenderTable = () => {
    if(applicationId) {
      let url =
        keywords != ""
          ? "/api/groups/assetsSearch?app_id=" + applicationId + ""
          : "/api/groups/assets?app_id=" + applicationId;
      if (selectedGroup?.selectedKeys?.id) {
        url += "&group_id=" + selectedGroup.selectedKeys.id;
      }
      if (assetTypeFilter != "") {
        url += "&assetTypeFilter=" + assetTypeFilter;
      }
      if (keywords != "") {
        url += "&keywords=" + keywords;
      }
      fetch(url, {
        headers: authHeader(),
      })
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
        handleError(response);
      })
      .then((data) => {  
          setAssets(data);
      })
      .catch((error) => {
        console.log(error);
      });
  }
}


  useEffect(() => {
    fetchDataAndRenderTable();

  }, [applicationId, assetTypeFilter, keywords, groupsMoveReducer, selectedGroup?.selectedKeys?.id]);

  //Execute generate pdf function after asset is selected
  useEffect(() => {
    if (selectedAsset) {
      generatePdf();
    }
  }, [selectedAsset]);


  //When edit icon is clicked
  const handleEdit = (id, type, action, vizUrl) => {
    if (action === "edit") {
      store.dispatch({
        type: Constants.ENABLE_EDIT,
        payload: true,
      });
    }

    dispatch(assetsActions.assetSelected(id, applicationId, ""));

    switch (type) {
      case "File":
        history.push("/" + applicationId + "/assets/file/" + id);
        break;
      case "Job":
        history.push("/" + applicationId + "/assets/job/" + id);
        break;
      case "Index":
        history.push("/" + applicationId + "/assets/index/" + id);
        break;
      case "Query":
        history.push("/" + applicationId + "/assets/query/" + id);
        break;
      case "RealBI Dashboard":
        window.open(vizUrl);
        break;  
      case "Group":
        if(action != 'edit') {
          openGroup(id);
        } else {
          handleEditGroup(id);
        }
        break;
      default:
        break;
    }
  };

  const handleClose = () => {
    //toggle();
  };

  const handleMoveAsset = (assetId, assetType, assetTitle) => {
    setAssetToMove({
      id: assetId,
      type: assetType,
      title: assetTitle,
      selectedGroup: selectedGroup,
    });
    toggleMoveDialog();
  };

  const handleDelete = (id, type) => {
    let deleteUrl = "",
      data = {},
      method = "post";
    message.config({ top: 130 });
    switch (type) {
      case "File":
        data = JSON.stringify({ fileId: id, application_id: applicationId });
        deleteUrl = "/api/file/read/delete";
        break;
      case "Index":
        data = JSON.stringify({ indexId: id, application_id: applicationId });
        deleteUrl = "/api/index/read/delete";
        break;
      case "Job":
        data = JSON.stringify({ jobId: id, application_id: applicationId });
        deleteUrl = "/api/job/delete";
        break;
      case "Query":
        data = JSON.stringify({ queryId: id, application_id: applicationId });
        deleteUrl = "/api/query/delete";
        break;
      case "Group":
        data = JSON.stringify({ group_id: id, app_id: applicationId });
        deleteUrl = "/api/groups";
        method = "delete";
        break;
      case "RealBI Dashboard":
        data = JSON.stringify({ id: id });
        deleteUrl = "/api/file/read/deleteVisualization";
        break;

    }
    fetch(deleteUrl, {
      method: method,
      headers: authHeader(),
      body: data,
    })
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
        handleError(response);
      })
      .then((result) => {
        fetchDataAndRenderTable();
        if (type == "Group") {
          refreshGroups();
        }
        message.success(type + " deleted sucessfully");
      })
      .catch((error) => {
        console.log(error);
        message.error("There was an error deleting the " + type);
      });
  };

  const handleGroupClick = (groupId) => {
    dispatch(assetsActions.assetInGroupSelected(groupId));
  };

  const handleCreateVisualization = (id, cluster_id) => {
    console.log(cluster_id);
    fetch("/api/file/read/visualization", {
      method: "post",
      headers: authHeader(),
      body: JSON.stringify({
        id: id,
        application_id: applicationId,
        email: authReducer.user.email,
        editingAllowed: editingAllowed
      }),
    })
    .then(function (response) {
      if (response.ok && response.status == 200) {
        return response.json();
      }
      handleError(response);
    })      
    .then(function (data) {
      if (data && data.success) {
        fetchDataAndRenderTable();
        window.open(data.url);
      }
    })
  }  

  const generateAssetIcon = (type) => {
    let icon = "";
    switch (type) {
      case "File":
        icon = <i className="fa fa-file"></i>;
        break;
      case "Index":
        icon = <i className="fa fa-indent"></i>;
        break;
      case "Query":
        icon = <i className="fa fa-search"></i>;
        break;
      case "Job":
        icon = <i className="fa fa-clock-o"></i>;
        break;
      case "Group":
        icon = <i className="fa fa-folder-o"></i>;
        break;
      case "RealBI Dashboard":
          icon = <i className="fa fa-area-chart"></i>;
          break;
      }
    return <React.Fragment>{icon}</React.Fragment>;
  };

  // -------------------- SORTING AND FILTERING --------------------------//
  const [filters, setFilters] = useState({});

  const createUniqueFiltersArr =(baseArr,column) =>{
    const columnsNames ={createdAt:'createdAt', name:"name", type:"type"}; 
    if(!baseArr || !column || !columnsNames[column]) return [];
    const dictionary = baseArr.reduce((acc,el)=> {
         let key = el[column] || 'empty';
        if (column === 'createdAt'){
           key = new Date(el.createdAt).toLocaleDateString('en-US', Constants.DATE_FORMAT_OPTIONS);
        }
        if (!acc[key]){
          acc[key] = true;
          acc.result.push({text: key, value: key })
        }
       return acc;
      },{result:[]});
      return dictionary.result;
    }

    const handleTablechange =(pagination, filters, sorter)=>{
      const activeFilters = {};
      for(const key in filters) filters[key] && (activeFilters[key] = filters[key]);
      setFilters(()=> activeFilters);
    }
  
    const handleClearFilters =(e)=>{
      e.stopPropagation();
      setFilters(()=>({}));
    }
    
  // -------------------- SORTING AND FILTERING END--------------------------//

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      width: "25%",
      ellipsis: {
        showTitle: false,
      },
      sorter: (a, b) => a.name.localeCompare(b.name),
      onFilter: (value, record) => record.name.includes(value),
      filters: createUniqueFiltersArr(assets,'name'),
      filteredValue: filters.name || null,
      shouldCellUpdate : 	(record, prevRecord) => record.title !== prevRecord.title,
      render: (text, record) => (
          <Tooltip placement="topLeft" title={record.name}>
            <Space>
              {generateAssetIcon(record.type)}
              <Typography.Link onClick={() => handleEdit(record.id, record.type, "view", record.url)}>{record.title ? record.title : text}</Typography.Link>
            </Space>
                {keywords && keywords.length > 0 ? 
                  ( <span className={"group-name"}>In Group: <Typography.Link onClick={() => handleGroupClick(record.groupId)}>{record.group_name ? record.group_name : "Groups"}</Typography.Link> </span> )
                    : null}
          </Tooltip>
      ),
    },
    {
      title: "Description",
      dataIndex: "description",
      width: "25%",
      ellipsis: true,
      shouldCellUpdate: (record, prevRecord) => record.description !== prevRecord.description,
      render: (text, record) => {
        const truncatedText = text?.substring(0,20).replace(/[`#/-]/g,'');
        return <Typography.Text>{truncatedText}</Typography.Text>
      }
    },
    {
      title: "Type",
      dataIndex: "type",
      width: "10%",
      sorter: (a, b) => a.type.localeCompare(b.type),
      onFilter: (value, record) => record.type.includes(value),
      filters: createUniqueFiltersArr(assets,'type'),
      filteredValue: filters.type || null,
      shouldCellUpdate : 	(record, prevRecord) => record.type !== prevRecord.type,
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      width: "20%",
      sorter: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      onFilter: (value, record) =>{
        const createdAt = new Date(record.createdAt).toLocaleDateString('en-US', Constants.DATE_FORMAT_OPTIONS);
        return createdAt.includes(value)},
      filters: createUniqueFiltersArr(assets,'createdAt'),
      filteredValue: filters.createdAt || null,
      shouldCellUpdate : (record, prevRecord) => record.createdAt !== prevRecord.createdAt ,
      render: (text, record) => {
        let createdAt = new Date(text);
        return ( createdAt.toLocaleDateString("en-US", Constants.DATE_FORMAT_OPTIONS) + " @ " + createdAt.toLocaleTimeString("en-US") );
      },
    },
    {
      width: "20%",
      title: "Action",
      dataJob: "",
      className: editingAllowed ? "show-column" : "hide-column",
      shouldCellUpdate : 	(record, prevRecord) => record.id !== prevRecord.id,
      render: (text, record) => (
       <Space split={<Divider type="vertical" />}>
          <Tooltip placement="right" title={"Edit"}>
            <EditOutlined className="asset-action-icon" onClick={() => handleEdit(record.id, record.type, "edit", record.url)}/>
          </Tooltip>

          <Popconfirm
            title="Deleting an asset will delete their metadata and make them unusable in workflows. Are you sure you want to delete this?"
            onConfirm={() => handleDelete(record.id, record.type)}
            icon={<QuestionCircleOutlined />}
          >
            <Tooltip placement="right" title={"Delete"}>
              <DeleteOutlined className="asset-action-icon" />
            </Tooltip>
          </Popconfirm>

          <Tooltip placement="right" title={"Move"}>
            <FolderOpenOutlined className="asset-action-icon" onClick={() => handleMoveAsset( record.id, record.type, record.name, selectedGroup ) } />
          </Tooltip>
         
          <Tooltip placement="right" title="Print">
            <FilePdfOutlined className="asset-action-icon" onClick={ () =>  getNestedAssets(applicationId, setSelectedAsset, setSelectDetailsforPdfDialogVisibility, record, setToPrintAssets)} />
          </Tooltip>

          {record.type === 'File'  ?
            record.visualization ? 
            ( <Tooltip placement="right" title={"RealBI Dashboard"}> <a href={record.visualization} target="_blank" rel="noreferrer"> <AreaChartOutlined className="asset-action-icon" /> </a> </Tooltip> ) :
            (
              <Popconfirm
                title="Are you sure you want to create a chart with this data?"
                onConfirm={() => handleCreateVisualization(record.id, record.cluster_id)}
                icon={<QuestionCircleOutlined />}
                >
                  <Tooltip placement="right" title={"RealBI Dashboard"}>
                    <AreaChartOutlined className="asset-action-icon" />
                  </Tooltip>
              </Popconfirm>  
            )
            : null}
        </Space>
      ),
    },
  ];

  //Generate PDF & printing task complete function
  const generatePdf = () => {
    setSelectDetailsforPdfDialogVisibility(true);
  };

  const printingTaskCompleted = () => {
    setSelectDetailsforPdfDialogVisibility(false);
  };

  return (
    <React.Fragment>
      <div style={{position:'relative'}}>
        <Button style={{display:!Object.keys(filters).length ? 'none': 'inline-block', position:'absolute', zIndex:'9999', left:"35%", top:'-15px'}} type='primary'  size='small' onClick={handleClearFilters} shape="round" >Remove Active Filters</Button>
        <Table
          columns={columns}
          rowKey={(record) => record.id}
          onChange={handleTablechange}
          dataSource={assets}
          pagination={assets?.length > 10 ? { pageSize: 10 }:  false}
          scroll={{ y: "70vh"}}
          hideOnSinglePage={true}
          />
      </div>
      {showMoveDialog ? (
        <MoveAssetsDialog
          isShowing={showMoveDialog}
          toggle={toggleMoveDialog}
          application={applicationReducer.application}
          assetToMove={assetToMove}
          reloadTable={fetchDataAndRenderTable}
          refreshGroups={refreshGroups}
        />
      ) : null}

      {/* Dialog box to select which element to export as PDF */}
      {selectDetailsforPdfDialogVisibility ? (
        <SelectDetailsForPdfDialog
          setVisiblity={setSelectDetailsforPdfDialogVisibility}
          visible={selectDetailsforPdfDialogVisibility}
          selectedAsset={selectedAsset}
          toPrintAssets={toPrintAssets}
          printingTaskCompleted={printingTaskCompleted}
        />
      ) : null}
    </React.Fragment>
  );
}

export default React.memo(AssetsTable);

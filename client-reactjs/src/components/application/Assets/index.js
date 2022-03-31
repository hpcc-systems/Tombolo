import React, { useState, useEffect, useRef, useCallback } from "react";
import { Tree, Menu, Button, Modal, Form, Input, Dropdown, Checkbox, message, Popover, } from "antd/lib";
import { debounce } from "lodash";
import BreadCrumbs from "../../common/BreadCrumbs";
import { authHeader, handleError } from "../../common/AuthHeader.js";
import { hasEditPermission } from "../../common/AuthUtil.js";
import { useSelector, useDispatch } from "react-redux";
import { useHistory } from "react-router";
import { assetsActions } from "../../../redux/actions/Assets";
import { getGroupsTree, selectGroup, expandGroups } from "../../../redux/actions/Groups";
import AssetsTable from "./AssetsTable";
import { MarkdownEditor } from "../../common/MarkdownEditor.js";

import { DeleteOutlined, FolderOutlined, DownOutlined, SettingOutlined, FilePdfOutlined, PlusOutlined, EyeOutlined } from "@ant-design/icons";
import ReactMarkdown from 'react-markdown'
import TitleRenderer from "./TitleRenderer.js";
import {  addingAssetMode } from "../../common/readOnlyUtil";
import MoveAssetsDialog from "./MoveAssetsDialog";

import useModal from "../../../hooks/useModal";
import SelectDetailsForPdfDialog from "../Assets/pdf/SelectDetailsForPdfDialog";
import { getNestedAssets} from "../Assets/pdf/downloadPdf"

const {  DirectoryTree } = Tree;
const { confirm } = Modal;
const { Search } = Input;
const CheckboxGroup = Checkbox.Group;

message.config({ top: 100 });

const Assets = () => {

  const [groupsReducer,groupsMoveReducer, authReducer, assetReducer,applicationReducer] = useSelector((state) => [
    state.groupsReducer,
    state.groupsMoveReducer,
    state.authenticationReducer,
    state.assetReducer,
    state.applicationReducer
  ]);
  const dispatch = useDispatch();

  const editingAllowed = hasEditPermission(authReducer.user);
  const application = applicationReducer.application;
  //id of the group clicked from Asset table after a search
   const { assetInGroupId } = assetReducer;
   // all data related to file explorer is in redux
   const {selectedKeys ,expandedKeys, tree, dataList } = groupsReducer;

  
  const { isShowing: showMoveDialog,  toggle: toggleMoveDialog } = useModal();

  const prevSelectedApplicationRef = useRef();



  const [itemToMove, setItemToMove] = useState({});

  const [newGroup, setNewGroup] = useState({ name: "", description: "", id: "", });
  const [newGroupForm, setNewGroupForm] = useState({ submitted: false });
  const [openCreateGroupDialog, setOpenCreateGroupDialog] = useState(false);
  const [rightClickNodeTreeItem, setRightClickNodeTreeItem] = useState({ visible: false, pageX: 0, pageY: 0, id: "", categoryName: "", });

  const [selectDetailsforPdfDialogVisibility, setSelectDetailsforPdfDialogVisibility] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState();
  const [toPrintAssets, setToPrintAssets] = useState([])
  const [readOnly, setReadOnly] = useState(false);

  const [form] = Form.useForm();
  
  const defaultAssetTypeFilter = ["File", "Job", "Query", "Indexes", "Groups"];
  const assetTypeFilter = useRef([...defaultAssetTypeFilter])
  const [searchKeyword, setSearchKeyword] = useState('');

  const history = useHistory();
  const searchOptions = ["File", "Job", "Query", "Indexes", "Groups"];

  //ref for More Options context menu
  const ref = useRef();

  const fetchGroups = async () => {
    await dispatch(getGroupsTree(application.applicationId));
    clearSearch();
  };
   
  //Re-render Directory Tree when the tree structure us chaged on modal
  useEffect(() => {
    //application changed
    if(application && prevSelectedApplicationRef.current && application.applicationId !== prevSelectedApplicationRef.current.applicationId) {      
      fetchGroups().then(() => {
        if (assetInGroupId){
          openGroup(assetInGroupId);
        } else{
          dispatch(expandGroups(["0-0"]));
          dispatch(selectGroup({ id: "", key: "0-0" }));
        }
      })
    }
    prevSelectedApplicationRef.current = application;

  }, [groupsMoveReducer, assetInGroupId, application])

  
  const clearSearch = () => {
    setSearchKeyword('')
    dispatch(assetsActions.searchAsset("", ""));
  };

  const onSelect = (keys, event) => {
    dispatch(selectGroup({ id: event.node.id, key: keys[0] }));
    clearSearch();
  };


  const onExpand = async (expandedKeys, event) => {
    dispatch(expandGroups(expandedKeys));
  };

  const getParent = (key, data) => {
    let parent;
    for (let i = 0; i < data.length; i++) {
      const node = data[i];
      if (node.children) {
        if (node.children.some((item) => item.key === key)) {
          parent = node;
        } else if (getParent(key, node.children)) {
          parent = getParent(key, node.children);
        }
      }
    }
    return parent;
  };

  const openGroup = (groupId) => {  
    if (groupId) {      
      const match = dataList.find((group) => group.id === groupId);
      if (match) {
            if(!expandedKeys.includes(match.parentKey)) {
              dispatch(expandGroups( [...expandedKeys, match.parentKey]));
            }

          
          dispatch(selectGroup({ id: match.id, key: match.key }));
      }
    } else if (groupId === "") {
      dispatch(expandGroups(["0-0"]));
    }
    dispatch(assetsActions.assetInGroupSelected(""));
    clearSearch();
  };

  const showMoreOptions = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const id =e.target.getAttribute("data-id");
    const key = e.target.getAttribute("data-key");
    const title = e.target.getAttribute("data-title");

    setItemToMove({ id, key, title, selectedKeys, type: "Group", });
  
    dispatch(selectGroup({ id, key}));

    setRightClickNodeTreeItem({
      visible: true,
      pageX: e.clientX,
      pageY: window.innerHeight - e.clientY > 150 ? e.clientY : e.clientY - 150,
    });
  };

  const openNewGroupDialog = () => {
    setOpenCreateGroupDialog(true);
    setReadOnly(false)
  };

  const closeCreateGroupDialog = () => {
    setOpenCreateGroupDialog(false);
    form.setFieldsValue({ name: "", description: "", id: "" });
    setNewGroup({ name: "", description: "", id: "" });
    setNewGroupForm({ submitted: false });
  };

  const handleMenuClick = (e) => {
    setRightClickNodeTreeItem({ visible: false });
    dispatch( assetsActions.newAsset(application.applicationId, selectedKeys.id) );

    switch (e.key) {
      case "File":
        history.push("/" + application.applicationId + "/assets/file");
        break;
      
      case "File Template":
      history.push("/" + application.applicationId + "/assets/fileTemplate");
      break;

      case "Index":
        history.push("/" + application.applicationId + "/assets/index");
        break;

      case "Query":
        history.push("/" + application.applicationId + "/assets/query");
        break;

      case "Job":
        history.push("/" + application.applicationId + "/assets/job");
        break;

      case "RealBI Dashboard":
          history.push("/" + application.applicationId + "/assets/visualizations");
          break;
  
      case "Group":
        openNewGroupDialog();
        break;

      case "Edit-Group":
        handleEditGroup();
        break;

      case "Delete-Group":
        handleDeleteGroup();
        break;

      case "Move-Group":
        toggleMoveDialog();
        break;

      case 'Print-Assets':
          selectedKeys.type = 'Group';
          getNestedAssets(
            application.applicationId,
            setSelectedAsset,
            setSelectDetailsforPdfDialogVisibility,
            selectedKeys,
            setToPrintAssets
          );
        break;
      default:
        break;
    }
  };


  const RightClickMenu = () => {
    const items = [
      {
        key: 'Edit-Group',
        name: 'View',
        icon: <EyeOutlined />,
      },
      {
        key: 'Delete-Group',
        name: 'Delete',
        icon: <DeleteOutlined />,
      },
      {
        key: 'Move-Group',
        name: 'Move',
        icon: <FolderOutlined />,
      },
      {
        key: 'Print-Assets',
        name: 'Print Assets',
        icon: <FilePdfOutlined />,
      },
    ];
    if (!rightClickNodeTreeItem.visible) return null;
  
    return (
      <div
        ref={ref}
        style={{ left: `${rightClickNodeTreeItem.pageX + 40}px`, top: `${rightClickNodeTreeItem.pageY}px` }}
        className="self-right-menu">
        <Menu style={{ width: 150 }} mode="vertical" theme="dark" onClick={handleMenuClick} ref={ref}>
          <Menu.Item key="Group" className="directorytree-rightclick-menuitem">
            <PlusOutlined /> New Group
          </Menu.Item>
          {selectedKeys?.id &&
            items.map((item) => {
              return (
                <Menu.Item key={item.key} className="directorytree-rightclick-menuitem">
                  {item.icon}
                  {item.name}
                </Menu.Item>
              );
            })}
        </Menu>
      </div>
    );
  };
  

  const handleCreateGroup = (e) => {
    form.validateFields().then((values) => {
      let isNew = newGroup.id && newGroup.id !== "" ? false : true;
    setNewGroupForm({ submitted: true });
    fetch("/api/groups", {
      method: "post",
      headers: authHeader(),
      body: JSON.stringify({
        isNew: isNew,
        parentGroupId: isNew ? selectedKeys.id : "",
        name: newGroup.name,
        applicationId: application.applicationId,
        description: newGroup.description,
        id: newGroup.id,
      }),
    })
    .then(function (response) {
      if (response.ok && response.status === 200) {
        return response.json();
      }
      // handleError(response);
      return response.json();
    })      
    .then(function (data) {
      if (data && data.success) {
        if(!expandedKeys.includes( selectedKeys.key )){
          dispatch(expandGroups([...expandedKeys, selectedKeys.key]));
        }

        
        closeCreateGroupDialog();
        fetchGroups();
      }
    })
    .catch((error) => {
      console.log(error);
      message.error(error.message)
    });
    }).catch((info) =>{
      console.log('Validate Failed:', info);
      message.error(info.message)
    })
  };

  //Handle Edit groups
  const handleEdit = () => {
    setReadOnly(false);
  }
  
  const handleDeleteGroup = () => {
    let parent = {};
    confirm({
      title: "Are you sure you want to delete this Group?",
      okText: "Yes",
      okType: "danger",
      cancelText: "No",
      onOk() {
        parent = getParent(selectedKeys.key, tree);
        fetch("/api/groups", {
          method: "delete",
          headers: authHeader(),
          body: JSON.stringify({
            group_id: selectedKeys.id,
            app_id: application.applicationId,
          }),
        })
          .then(function (response) {
            if (response.ok) {
              return response.json();
            }

            handleError(response);
          })
          .then(function (data) {
            dispatch(selectGroup({ id: parent.id, key: parent.key }));
            fetchGroups();
          })
          .catch((error) => {
            message.error(error.message)
            console.log(error);
          });
      },
      onCancel() {},
    });
  };

  const handleEditGroup = (groupIdFromAssetsView) => {
    let groupId =
      groupIdFromAssetsView && groupIdFromAssetsView !== ""
        ? groupIdFromAssetsView
        : selectedKeys.id;
    fetch(
      "/api/groups/details?app_id=" +
        application.applicationId +
        "&group_id=" +
        groupId,
      {
        headers: authHeader(),
      }
    )
      .then(function (response) {
        if (response.ok) {
          return response.json();
        }
        handleError(response);
      })
      .then(function (data) {
        form.setFieldsValue({
          name: data.name,
          description: data.description,
        });

        setNewGroup({
          name: data.name,
          description: data.description,
          id: data.id,
        });
      })
      .catch((error) => {
        message.error(error.message)
        console.log(error);
      });
    setOpenCreateGroupDialog(true);
    setReadOnly(true);
  };

  const handleDragEnter = (info) => {};

  const closeMoveAssetDialog= async ({refetch}) => {
    if (refetch){
      await fetchGroups();
    }
    toggleMoveDialog();
  };

  const handleDragDrop = (info) => {
    if (info.node != undefined && info.dragNode != undefined) {
      confirm({
        title:
          'Are you sure you want to move "' +
          info.dragNode.title +
          '" to "' +
          info.node.title +
          '" group?',
        okText: "Yes",
        okType: "danger",
        cancelText: "No",
        onOk() {
          const dropKey = info.node.props.eventKey;
          const dragKey = info.dragNode.props.eventKey;
          const dropPos = info.node.props.pos.split("-");
          fetch("/api/groups/move", {
            method: "put",
            headers: authHeader(),
            body: JSON.stringify({
              groupId: info.dragNode.id,
              destGroupId: info.node.id,
              app_id: application.applicationId,
            }),
          })
            .then(function (response) {
              if (response.ok) {
                return response.json();
              }

              handleError(response);
            })
            .then(function (data) {
              fetchGroups();
            })
            .catch((error) => {
              message.error(error.message)
              console.log(error);
            });
        },
      });
    }
  };

  const handleAssetSearch = useCallback(debounce((value, event) => {
    if (assetTypeFilter.current.length === 0) { return message.error("Please select at least one asset type"); }
    const assetFilter = assetTypeFilter.current.length !== searchOptions.length ? assetTypeFilter.current.join(",") : "";
    dispatch(assetsActions.searchAsset(assetFilter, value));
  },300) ,[assetTypeFilter.current]);
  
  const handleSearchKeywordChange = (e)=>{
    setSearchKeyword(e.target.value);
    handleAssetSearch(e.target.value); // this function is memoised and debounced, it will not on every keyhit
  };

  const titleRenderer = (nodeData) => {
    return (
      <TitleRenderer
        id={nodeData.id}
        title={nodeData.title}
        nodeKey={nodeData.key}
        showMoreOptions={showMoreOptions}
      />
    );
  };

  const onAssetTypeFilterChange = (selectedValues) => {
    assetTypeFilter.current = selectedValues;
  };

  const menu = (
    <Menu onClick={(e) => handleMenuClick(e)}>
      <Menu.Item key="File" onClick={addingAssetMode}>
        <i className="fa fa-lg fa-file"></i> File
      </Menu.Item>
      <Menu.Item key="File Template" onClick={addingAssetMode}>
        <i className="fa  fa-lg fa-file-text-o"></i> File Template
      </Menu.Item>
      <Menu.Item key="Index" onClick={addingAssetMode}>
        <i className="fa fa-lg fa-indent"></i> Index
      </Menu.Item>
      <Menu.Item key="Query" onClick={addingAssetMode}>
        <i className="fa fa-lg fa-search"></i> Query
      </Menu.Item>
      <Menu.Item key="Job" onClick={addingAssetMode}>
        <i className="fa fa-lg fa-clock-o"></i> Job
      </Menu.Item>
      <Menu.Item key="RealBI Dashboard" onClick={addingAssetMode}>
        <i className="fa fa-lg fa-area-chart"></i> RealBI Dashboard
      </Menu.Item>
    </Menu>
  );

  const selectBefore = (
  <Popover
    title="Search Filters" 
    placement="bottom"
    trigger="click"
    content={
        <CheckboxGroup 
        options={searchOptions}
        defaultValue={assetTypeFilter.current} 
        onChange={onAssetTypeFilterChange} 
        style={{display:"flex", flexDirection:'column'}}
        />
     } 
     >
      <SettingOutlined />  
  </Popover>
  );

  //Generate PDF & printing task complete function
 const printingTaskCompleted = () => {
    setSelectDetailsforPdfDialogVisibility(false);
  };

  //Layout for form
  const formItemLayout = 
  !readOnly ? {
  labelCol: {
    xs: { span: 2 },
    sm: { span: 8 },
  },
  wrapperCol: {
    xs: { span: 4 },
    sm: { span: 24 },
  }
} : 
{
  labelCol: {
    xs: { span: 3 },
    sm: { span: 5 },
  },
  wrapperCol: {
    xs: { span: 4 },
    sm: { span: 24 },
  }
}

  return (
    <React.Fragment>
      <div style={{ height: "100%", overflow: "hidden" }}>
        <div className="d-flex justify-content-end" style={{ margin: "5px" }}>
          <BreadCrumbs
            applicationId={application.applicationId}
            applicationTitle={application.applicationTitle}
          />
          <div className="ml-auto">
            {editingAllowed ? (
              <Dropdown overlay={menu}>
                <Button className="btn btn-secondary btn-sm">
                  Add Asset <DownOutlined />
                </Button>
              </Dropdown>
            ) : null}
          </div>
        </div>
        <div style={{ display: "flex", height: "100%" }}>
          <div className="groups-div">
            <Search
              id="search-field"
              addonBefore={selectBefore}
              placeholder="Search assets"
              allowClear
              value={searchKeyword}
              onChange={handleSearchKeywordChange}
              onSearch={handleAssetSearch}
            />

            <DirectoryTree
              className="draggable-tree"
              onSelect={onSelect}
              onExpand={onExpand}
              treeData={tree}
              selectedKeys={[selectedKeys.key]}
              expandedKeys={[...expandedKeys]}
              draggable
              blockNode={true} 
              autoExpandParent={true}
              onDragEnter={handleDragEnter}
              onDrop={handleDragDrop}
              titleRender={titleRenderer}
              onScroll={(e) => console.log(e)}
            />
            <RightClickMenu />
          </div>
          <div className="asset-table">
            <AssetsTable
              openGroup={openGroup}
              handleEditGroup={handleEditGroup}
              refreshGroups={fetchGroups}
            />
          </div>
        </div>
      </div>

      <div>
        <Modal
          title= "Group"
          onCancel={closeCreateGroupDialog}
          visible={openCreateGroupDialog}
          destroyOnClose={true}
          maskClosable={false}
          width={520}
          footer={readOnly ? <span><Button type="primary" onClick={handleEdit}>Edit</Button> <Button type="primary" ghost onClick={closeCreateGroupDialog}>Cancel</Button></span> : 
                            <span><Button type="primary" ghost onClick={closeCreateGroupDialog}>Cancel</Button> <Button type="primary" onClick={handleCreateGroup} >Save</Button></span>}>
          <Form
          form={form} 
          layout={readOnly ? "horizontal" : "vertical"}
          labelCol={{ span: 0 }}
          className="formInModal"
          >
            <div
              className={
                "form-group" +
                (newGroupForm.submitted && !newGroup.name ? " has-error" : "")
              }
            >
              <Form.Item
                label="Name : "
                name="name"
                {...formItemLayout}
                rules={readOnly ? false : [
                  {
                    required: true,
                    pattern: new RegExp(/^[a-zA-Z0-9_ -]*$/),
                    message: "Please enter a valid Name",
                  },
                ]}
              >
                <Input
                  id="name"
                  className={readOnly ? "read-only-input" : null}
                  name="name"
                  autoFocus={true}
                  onChange={(e) =>
                    setNewGroup({
                      ...newGroup,
                      [e.target.name]: e.target.value,
                    })
                  }
                  placeholder="Name"
                />
              </Form.Item>
            </div>
            <Form.Item
              label="Description"
              name="description"
              {...formItemLayout}
            >
              <span style={{fontWeight: "normal"}}>
              {readOnly ? <ReactMarkdown className="read-only-markdown" children={newGroup.description}></ReactMarkdown> : 
              <MarkdownEditor
                id="desc"
                name="description"
                onChange={(e) =>
                  setNewGroup({ ...newGroup, [e.target.name]: e.target.value })
                }
                targetDomId="fileDescr"
                value={newGroup.description}
                disabled={!editingAllowed}
              />}
              </span>
            </Form.Item>
          </Form>
        </Modal>
      </div>
      {showMoveDialog ? (
        <MoveAssetsDialog
          assetToMove={itemToMove}
          isShowing={showMoveDialog}
          toggle={closeMoveAssetDialog}
          application={applicationReducer.application}
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
};

export default Assets;

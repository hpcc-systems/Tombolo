import React, { useState, useEffect } from "react";
import { Space, Table, Badge, Tooltip, Tag } from "antd/lib";
import {useParams} from "react-router-dom";

import { Constants } from "../../common/Constants";
import  useWindowSize from "../../../hooks/useWindowSize";

function JobExecutionDetails({ workflowDetails, graphSize, manageJobExecutionFilters, setSelectedJobExecutionGroup, jobExecutionTableFilters, selectedJobExecutionGroup}) {
  const [parentTableData, setParentTableData] = useState([]);
  const [ windowHeight] = useWindowSize();
  const { executionGroupId} = useParams();

  // Unique filters
  const createUniqueFiltersArr = (baseArr, column) => {
    const columnsNames = { createdAt: "createdAt", name: "name", wuid: "wuid", status: "status" };
    if (!baseArr || !column || !columnsNames[column]) return [];
    const dictionary = baseArr.reduce(
      (acc, el) => {
        let key = el[column] || "empty";
        if (column === "createdAt") {
          key = new Date(el.createdAt).toLocaleDateString("en-US", Constants.DATE_FORMAT_OPTIONS);
        }
        if (!acc[key]) {
          acc[key] = true;
          acc.result.push({ text: key, value: key });
        }
        return acc;
      },
      { result: [] }
    );
    return dictionary.result;
  };

// when the table changes - eg : sorting, filtering, pagination etc
  const handleTableChange = (pagination, filters, sorter) => {
    const activeFilters = {};
    for (const key in filters) filters[key] && (activeFilters[key] = filters[key]);
    manageJobExecutionFilters(activeFilters);
  };

  //Badge color
  const setBadgeColor = (jonExecutionStatus) => {
    switch (jonExecutionStatus) {
      case "completed":
        return "#3bb44a";
      case "failed":
        return "#FF0000";
      case "blocked":
        return "#FFA500";
      case "some-failed":
        return "#FFA500";
      default:
        return "#808080";
    }
  };

  const jobExecutionGroupStatus = (groupStatus) => {
    const executionStatuses = [...new Set(groupStatus)];
    if (executionStatuses.length == 1 && executionStatuses[0] === "completed") {
      // all job executions in group completed
      return "completed";
    } else if (executionStatuses.length == 1 && ((executionStatuses[0] === "failed" || executionStatuses[0] === "error" ))) {
      // all job execution in group  failed
      return "failed";
    } else if (executionStatuses.includes("wait") || executionStatuses.includes("submitted")) {
      // some execution does not have result (eg: they have status submitted, wait etc.)
      return "in-progress";
    } else {
      return "some-failed"; // some execution failed and some were completed
    }
  };

  //Parent table columns
  const parentTableColumns = [
    {
      title: "Date",
      dataIndex: "createdAt",
      render: (text, record) => {
        let createdAt = new Date(record.createdAt);
        return (
          <Space size="small">
            <Badge color={setBadgeColor(record.status)}></Badge>
            {createdAt.toLocaleDateString("en-US", Constants.DATE_FORMAT_OPTIONS) + " @ " + createdAt.toLocaleTimeString("en-US")}
            <small> <b>[ {record.count} job{record.count > 1 ? "s" : ""} ]</b></small>
          </Space>
          )
      },
      sorter: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      defaultSortOrder: "ascend",
      onFilter: (value, record) => {
        const createdAt = new Date(record.createdAt).toLocaleDateString("en-US", Constants.DATE_FORMAT_OPTIONS);
        return createdAt === value;
      },
      filters: createUniqueFiltersArr(workflowDetails.wuDetails, "createdAt"),
      filteredValue: jobExecutionTableFilters.createdAt || null,
    },
  ];

  //When component loads, find the count of job execution with same job execution group ID and group them together
  useEffect(() => {
    if (workflowDetails?.wuDetails) {
      const workFlows = workflowDetails.wuDetails.sort((a,b) => {
        return new Date(a.createdAt) - new Date(b.createdAt)
      });

      const execution = {};
        workFlows?.forEach((item) => {
          if (!execution[item.jobExecutionGroupId]) {
            execution[item.jobExecutionGroupId] = { jobExecutionGroupId: item.jobExecutionGroupId, count: 1, createdAt: item.createdAt, statuses: [item.status] };
          } else {
            execution[item.jobExecutionGroupId].count += 1;
            execution[item.jobExecutionGroupId].statuses = [...execution[item.jobExecutionGroupId].statuses, item.status];
          }
          execution[item.jobExecutionGroupId].status = jobExecutionGroupStatus(execution[item.jobExecutionGroupId].statuses);
        });      
      setParentTableData(Object.values(execution));
        const executionKeys = Object.keys(execution);
      setSelectedJobExecutionGroup(executionGroupId ||  executionKeys.length > 0 ? executionKeys[executionKeys.length -1] : '') ;
  
    }
  }, [workflowDetails]);

  // Function that renders a child table when + icon is clicked
  const expandedRowRender = (record) => {
    //Nested table columns
    const nestedTableColumns = [
      { title: "Job", dataIndex: "name", width: "20%" },
      { title: "Wuid", dataIndex: "wuid", width: "20%" },
      { title: "Date", dataIndex: "createdAt", width: "20%", render : (text, record) =>{
        let createdAt = new Date(text);
        return createdAt.toLocaleDateString("en-US", Constants.DATE_FORMAT_OPTIONS) + " @ " + createdAt.toLocaleTimeString("en-US");
      },  
          sorter: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
          defaultSortOrder : "descend"
         },
      {
        title: "Status",
        dataIndex: "status",
        width: "20%",
        render: (text, record) => {
          return (
            <span>
              <Badge color={setBadgeColor(record.status)}></Badge>
              {record.status}
            </span>
          );
        },
      },
      { title: "Duration", dataIndex: "wu_duration", width: "20%" },
    ];

    //Nested table data
    const nestedTableData = workflowDetails.wuDetails.filter((item) => item.jobExecutionGroupId === record.jobExecutionGroupId);
    return <Table columns={nestedTableColumns} dataSource={nestedTableData} bordered pagination={false}   rowKey={(record) => record.id}
    />;
  };

  return (
    <React.Fragment>
      <Table
        size="small"
        columns={parentTableColumns}
        onChange={handleTableChange}
        rowKey={(record) => record.jobExecutionGroupId}
        dataSource={parentTableData}
        expandable={{ expandedRowRender }}
        pagination={{ pageSize: Math.abs(Math.round((windowHeight - graphSize.height) / 60 ))}}
        rowClassName={(record) => {
          if(selectedJobExecutionGroup === record.jobExecutionGroupId){
            return "jobExecutionDetails_antdTable_selectedRow"
          } }}
        onExpand={(expanded, record ) => {
          if(expanded){
            setSelectedJobExecutionGroup(record.jobExecutionGroupId)
          }else{
            setSelectedJobExecutionGroup('');
          }
        }}
        expandedRowClassName= { () =>{
          return "jobExecutionDetails_antdTable_child"
        } } 
        expandRowByClick={true}
        expandedRowKeys={[selectedJobExecutionGroup]}
      />
    </React.Fragment>
  );
}

export default JobExecutionDetails;
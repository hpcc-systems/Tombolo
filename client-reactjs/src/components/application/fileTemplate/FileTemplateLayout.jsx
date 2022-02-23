import React from 'react';
import {Table} from 'antd';

import  useWindowSize from "../../../hooks/useWindowSize";

const layoutColumns = [
      {
        title: "System Name",
        dataIndex: "name",
        sort: "asc",
        editable: false,
        width: "25%",
      },
      {
        title: "Name",
        dataIndex: "name",
        sort: "asc",
        editable: true,
        celleditor: "text",
        regEx: /^[a-zA-Z0-9.,:;()@&#*/$_ -]*$/,  
        width: "25%",
      },
      {
        title: "Type",
        dataIndex: "type",
        editable: false,
        celleditor: "select",
        celleditorparams: {
        //   values: eclTypes.sort(),
        },
        showdatadefinitioninfield: true,
        width: "18%",
      },
      {
        title: "Description",
        dataIndex: "description",
        // editable: editingAllowed,
        width: "15%",
      },
    ];

function FileTemplateLayout(props) {
    const [ windowHeight] = useWindowSize();
  return (
    <Table
                  columns={layoutColumns}
                  dataSource={props.layoutData}
                  size="small"
                  pagination={{ pageSize: Math.abs(Math.round((windowHeight) / 65 ))}}
                //   ref={(node) => (this.layoutTable = node)}
                //   fileType={this.state.file.fileType}
                //   editingAllowed={true} // should be conditional
                //   showDataDefinition={false}
                //   dataDefinitions={[]}
                //   setData={this.setLayoutData}
                //   enableEdit={this.state.enableEdit}
                />
  )
}

export default FileTemplateLayout
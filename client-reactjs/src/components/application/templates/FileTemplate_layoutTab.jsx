import React from 'react';
import EditableTable from '../../common/EditableTable';

const layoutColumns = [
      {
        title: "System Name",
        dataIndex: "name",
        sort: "asc",
        width: "25%",
        editable : true
      },
      {
        title: "Name",
        dataIndex: "name",
        regEx: /^[a-zA-Z0-9.,:;()@&#*/$_ -]*$/,  
        width: "25%",
      },
      {
        title: "Type",
        dataIndex: "type",
        width: "18%",
        editable: true
      },
      {
        title: "Description",
        dataIndex: "description",
        width: "15%",
        editable: true
      },
      
    ];

function FileTemplateLayout(props) {

  return (
     <EditableTable
                  columns={layoutColumns}
                  dataSource={props.layoutData}
                  editingAllowed={props.editingAllowed} // programmatically change 
                  showDataDefinition={false}
                  setData={props.setLayoutData}
                  enableEdit={props.enableEdit} // programmatically change 
                />
  )
}

export default FileTemplateLayout
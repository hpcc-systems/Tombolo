import React from 'react';
import EditableTable from '../../common/EditableTable';
import Text from '../../common/Text';

function FileTemplateLayout(props) {
  const layoutColumns = [
    {
      title: <Text text="Name" />,
      dataIndex: 'name',
      regEx: /^[a-zA-Z0-9.,:;()@&#*/$_ -]*$/,
      width: '25%',
    },
    {
      title: <Text text="Type" />,
      dataIndex: 'type',
      width: '18%',
      editable: true,
    },
    {
      title: <Text text="Description" />,
      dataIndex: 'description',
      width: '15%',
      editable: true,
    },
  ];

  return (
    <EditableTable
      columns={layoutColumns}
      dataSource={props.layoutData}
      editingAllowed={props.editingAllowed} // programmatically change
      showDataDefinition={false}
      setData={props.setLayoutData}
      enableEdit={props.enableEdit} // programmatically change
    />
  );
}

export default FileTemplateLayout;

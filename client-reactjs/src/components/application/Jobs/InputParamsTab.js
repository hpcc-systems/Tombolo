import React from 'react';
import { eclTypes } from '../../common/CommonUtil';
import EditableTable from '../../common/EditableTable';
import Text from '../../common/Text';

const InputParamsTab = ({ jobType, editingAllowed, inputParams, enableEdit, setInputParamsData }) => {
  const columns = [
    {
      title: <Text text="Name" />,
      dataIndex: 'name',
      editable: editingAllowed,
      celleditor: 'text',
      regEx: /^[a-zA-Z0-9.,:;()?!""@&#*/'$_ -]*$/,
    },
    {
      title: <Text text="Type" />,
      dataIndex: 'type',
      editable: editingAllowed,
      celleditor: 'select',
      showdatadefinitioninfield: true,
      celleditorparams: {
        values: eclTypes.sort(),
      },
    },
  ];

  const scriptInputParamscolumns = [
    {
      title: <Text text="Name" />,
      dataIndex: 'name',
      editable: editingAllowed,
    },
    {
      title: <Text text="Value" />,
      dataIndex: 'type',
      editable: editingAllowed,
    },
  ];

  return (
    <EditableTable
      columns={jobType !== 'Script' ? columns : scriptInputParamscolumns}
      dataSource={inputParams}
      editingAllowed={editingAllowed}
      dataDefinitions={[]}
      showDataDefinition={false}
      setData={setInputParamsData}
      enableEdit={enableEdit}
    />
  );
};

export default InputParamsTab;

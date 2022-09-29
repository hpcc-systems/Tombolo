import React from 'react';
import { eclTypes, omitDeep } from '../../common/CommonUtil';
import EditableTable from '../../common/EditableTable';
import Text from '../../common/Text';

const InputParamsTab = ({ editingAllowed, state, setState }) => {
  const { enableEdit, job } = state;
  const { jobType, inputParams } = job;

  const setInputParamsData = (data) => {
    let omitResults = omitDeep(data, 'id');
    setState({ job: { ...state.job, inputParams: omitResults } });
  };

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

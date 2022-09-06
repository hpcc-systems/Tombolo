import React, { useEffect, useState } from 'react';
import { message, Table } from 'antd';
import { useTranslation } from 'react-i18next';

import { authHeader, handleError } from '../../common/AuthHeader';

function FileTemplate_permissablePurpose(props) {
  const { enableEdit, editingAllowed, setSelectedLicenses, selectedLicenses, selectedAsset } = props;
  const [licenses, setLicenses] = useState([]);
  const { t } = useTranslation();

  //Table columns
  const columns = [
    {
      title: t('Name', { ns: 'common' }),
      dataIndex: 'name',
      render: (text, record) => (
        <a href={record.url} target="_blank" rel="noreferrer">
          {record.name}
        </a>
      ),
      width: '20%',
    },
    {
      title: t('Description', { ns: 'common' }),
      dataIndex: 'description',
    },
  ];

  // Get the licenses
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const allLicenses = await getLicenses();
        setLicenses(allLicenses);
        if (selectedAsset.id) {
          const associatedLicenses = await getAssociatedLicenses(selectedAsset);
          setSelectedLicenses(associatedLicenses);
        }
      } catch (err) {
        message.error('Unable to retrieve license information');
      }
    };
    fetchInitialData();
  }, []);

  // Fetch al available licenses func
  const getLicenses = () => {
    return fetch('/api/file/read/licenses', {
      headers: authHeader(),
    }).then((response) => {
      if (response.ok) {
        return response.json();
      }
      handleError(response);
    });
  };

  //Fetch licenses tied to this template
  const getAssociatedLicenses = (fileTemplate) => {
    return fetch('/api/fileTemplate/read/getAssociatedLicenses', {
      method: 'post',
      headers: authHeader(),
      body: JSON.stringify({
        fileTemplate_id: fileTemplate.id,
      }),
    }).then((response) => {
      if (response.ok) {
        return response.json();
      }
      handleError(response);
    });
  };

  //When row is selected or deselected
  let rowSelection = {
    selectedRowKeys: selectedLicenses.map((license) => license.id),
    onChange: (selectedRowKeys, selectedRows) => {
      setSelectedLicenses(selectedRows);
    },
    getCheckboxProps: (_record) => ({
      disabled: !editingAllowed || !enableEdit,
    }),
  };

  //JSX
  return (
    <Table
      columns={columns}
      dataSource={licenses}
      size={'small'}
      rowSelection={{
        type: 'checkbox',
        defaultSelectedRowKeys: selectedLicenses.map((license) => license.id),
        ...rowSelection,
      }}
      rowKey={(record) => record.id}
      pagination={false}
      bordered={true}
    />
  );
}

export default FileTemplate_permissablePurpose;

import React from 'react';
import { useTranslation } from 'react-i18next';
import EditableTable from '../../common/EditableTable';

function FileTemplateLayout(props) {
  const { t } = useTranslation(['common']);
  const layoutColumns = [
    {
      title: t('Name', { ns: 'common' }),
      dataIndex: 'name',
      regEx: /^[a-zA-Z0-9.,:;()@&#*/$_ -]*$/,
      width: '25%',
    },
    {
      title: t('Type', { ns: 'common' }),
      dataIndex: 'type',
      width: '18%',
      editable: true,
    },
    {
      title: t('Description', { ns: 'common' }),
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

import React, { useState } from 'react';
import { Modal, Space, Tag, Tooltip } from 'antd';
import { useSelector } from 'react-redux';
import ConstraintDescription from './ConstraintDescription';
import { i18n } from '../../../common/Text';

/**
 * ConstraintsTags - pass [] of { id: string} // constraint id;  and receive a clickable tag
 * @param {[]} list - Constraint[] ; Constraint: {id: uuid, from: fileName}
 * @param {boolean} showAll - will show all availailable constraints from redux store
 * @param {boolean} file - when present file level constraint shows different color  on tag
 */

const ConstraintsTags = ({ list, file, showAll }) => {
  const constraints = useSelector((state) => state.applicationReducer.constraints);
  // if no value is passed return list of all constraints
  if (showAll) return constraints.map((record) => <TagWithPopUp key={record.id} showAll={showAll} record={record} />);

  if (!list) return null;

  // const matchedConstraints = constraints.filter((el) => list.includes(el.id));
  const matchedConstraints = constraints.reduce((acc, constraint) => {
    const exists = list.find((el) => el.id === constraint.id);
    if (exists) acc.push({ ...constraint, inherited: exists?.from || '' });
    return acc;
  }, []);

  return (
    <Space wrap>
      {matchedConstraints.map((record) => (
        <TagWithPopUp key={record.id} file={file} record={record} />
      ))}
    </Space>
  );
};

export default ConstraintsTags;

const TagWithPopUp = ({ record, file, showAll }) => {
  // console.log('constraint', constraint);
  const [visible, setVisible] = useState(false);

  const getColor = () => {
    if (showAll) return 'cyan';
    if (file) return 'red';
    if (record.inherited) return 'blue';
    return 'green';
  };

  const getTitle = () => (record.inherited ? `${i18n('Inherited from')}: ${record.inherited}` : null);

  return (
    <>
      <Tooltip placement="top" title={getTitle()}>
        <Tag color={getColor(record)} onClick={() => setVisible(true)} style={{ cursor: 'pointer' }}>
          {record.name}
        </Tag>
      </Tooltip>
      <Modal
        centered
        width={1000}
        footer={null}
        closable={false}
        visible={visible}
        title={record.name}
        onCancel={() => setVisible(false)}>
        <ConstraintDescription record={record} />
      </Modal>
    </>
  );
};

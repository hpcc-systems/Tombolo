import React, { useState } from 'react';
import { Modal, Tag } from 'antd';
import { useSelector } from 'react-redux';
import ConstraintDescription from './ConstraintDescription';

const ConstraintsTags = ({ list, color = 'green', showAll }) => {
  const constraints = useSelector((state) => state.applicationReducer.constraints);
  // if no value is passed return list of all constraints
  if (showAll) return constraints.map((record) => <TagWithPopUp key={record.id} color={color} record={record} />);

  if (!list) return null;

  const matchedConstraints = constraints.filter((el) => list.includes(el.id));
  return matchedConstraints.map((record) => <TagWithPopUp key={record.id} color={color} record={record} />);
};

export default ConstraintsTags;

const TagWithPopUp = ({ record, color }) => {
  // console.log('constraint', constraint);
  const [visible, setVisible] = useState(false);
  return (
    <>
      <Tag color={color} onClick={() => setVisible(true)} style={{ cursor: 'pointer' }}>
        {record.name}
      </Tag>
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

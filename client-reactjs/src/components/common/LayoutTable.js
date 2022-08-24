/* eslint-disable unused-imports/no-unused-imports */
/* eslint-disable unused-imports/no-unused-vars */
import React, { useEffect, useState } from 'react';
import { Button, Collapse, Form, Input, message, Modal, Select, Space, Table, Tag, Typography } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { useSelector } from 'react-redux';
const { Option } = Select;

const LayoutTable = ({ dataSource, setData, fileConstraints }) => {
  const [modal, setModal] = useState({ isOpen: false, record: null });

  const edit = (record) => setModal(() => ({ isOpen: true, record }));
  const closeModal = () => setModal(() => ({ isOpen: false, record: null }));

  const columns = [
    {
      title: '',
      width: '3%',
      render: (text, record) => <Button type="link" onClick={() => edit(record)} block icon={<EditOutlined />} />,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      sort: 'asc',
      width: '20%',
      ellipsis: true,
      sorter: (a, b) => a.name.localeCompare(b.name),
      // onHeaderCell: (column) => ({ ...column, className: 'layout-table-headers' }),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      width: '10%',
      ellipsis: true,
      sorter: (a, b) => a.type.localeCompare(b.type),
      // onHeaderCell: (column) => ({ ...column, className: 'layout-table-headers' }),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      width: '25%',
      ellipsis: true,
    },
    {
      title: 'Constraints',
      // onHeaderCell: (column) => ({ ...column, className: 'layout-table-headers' }),
      render: (text, record) => {
        if (record.constraints) {
          return <ConstraintsTags value={record.constraints} />;
        }
        return null;
      },
    },
  ];

  return (
    <>
      <Table
        bordered
        size={'small'}
        columns={columns}
        pagination={false}
        dataSource={dataSource}
        rowKey={(record) => record.id}
        summary={(pageData) => <FileSummary fileConstraints={fileConstraints} pageData={pageData} />}
      />
      <ConstraintModal modal={modal} setData={setData} dataSource={dataSource} closeModal={closeModal} />
    </>
  );
};

export default LayoutTable;

const FileSummary = ({ pageData, fileConstraints }) => {
  console.log('pageData', pageData);
  let allConstraints = pageData.reduce((acc, el) => {
    if (el.constraints?.length > 0) acc.push(...el.constraints);
    return acc;
  }, []);
  allConstraints = [...new Set(allConstraints)];
  return (
    <>
      <Table.Summary.Row>
        <Table.Summary.Cell index={0}></Table.Summary.Cell>
        <Table.Summary.Cell index={1} colSpan={4}>
          <Typography.Text code>Fields constraints :</Typography.Text>{' '}
          <ConstraintsTags value={allConstraints} color={'green'} />
        </Table.Summary.Cell>
      </Table.Summary.Row>
      <Table.Summary.Row>
        <Table.Summary.Cell index={0}></Table.Summary.Cell>
        <Table.Summary.Cell index={1} colSpan={4}>
          <Typography.Text code>File constraints :</Typography.Text>{' '}
          <ConstraintsTags value={fileConstraints} color={'red'} />
        </Table.Summary.Cell>
      </Table.Summary.Row>
      <Table.Summary.Row>
        <Table.Summary.Cell index={0}></Table.Summary.Cell>
        <Table.Summary.Cell index={1} colSpan={4}>
          <Typography.Text code>Total :</Typography.Text>{' '}
          <ConstraintsTags value={[...new Set([...allConstraints, ...fileConstraints])]} color={'blue'} />
        </Table.Summary.Cell>
      </Table.Summary.Row>
    </>
  );
};

const ConstraintModal = ({ modal, setData, dataSource, closeModal }) => {
  const constraints = useSelector((state) => state.applicationReducer.constraints);

  const [editing, setEditing] = useState(false);

  const [form] = Form.useForm();

  useEffect(() => {
    const record = modal.record;
    if (!record) return;

    form.setFieldsValue({
      constraints: record.constraints,
      description: record.description,
    });

    return () => form.resetFields();
  }, [modal.isOpen, editing]);

  const addChanges = async () => {
    const values = await form.validateFields();
    const record = modal.record;
    const newDataSource = dataSource.map((el) => (el.id === record.id ? { ...el, ...values } : el));
    setData(newDataSource);
    setEditing(false);
    message.success('Success!');
    closeModal();
  };

  const onCancel = () => {
    setEditing(false);
    if (!editing) closeModal();
  };

  const getOKtext = () => (editing ? 'Add' : 'Edit');
  const handleOk = () => (editing ? addChanges() : setEditing(true));

  if (!modal.isOpen) return null;

  return (
    <Modal
      title={'Field: ' + modal.record.name}
      width={1000}
      destroyOnClose
      onOk={handleOk}
      cancelButtonProps={{ hidden: !editing }}
      onCancel={onCancel}
      okText={getOKtext()}
      visible={modal.isOpen}>
      <>
        <Form layout={editing ? 'vertical' : 'horizontal'} form={form}>
          <Form.Item name="constraints" label="Select constraints :">
            {editing ? (
              <Select mode="multiple" placeholder="Please select constaints">
                {constraints.map((el) => {
                  return (
                    <Option key={el.id} value={el.id}>
                      {el.name}
                    </Option>
                  );
                })}
              </Select>
            ) : (
              <ConstraintsTags />
            )}
          </Form.Item>

          <Form.Item label="Description :" name="description">
            {editing ? <Input.TextArea className="custom-scroll" allowClear cols={5} /> : <ReadOnlyField />}
          </Form.Item>
        </Form>
        <Collapse collapsible="header">
          <Collapse.Panel header="List of all available constraints, click on tag to see more">
            <ConstraintsTags showAll={true} color={'cyan'} />
          </Collapse.Panel>
        </Collapse>
      </>
    </Modal>
  );
};

const ReadOnlyField = ({ value }) => <span className="ant-form-text">{value}</span>;

export const ConstraintsTags = ({ value, color = 'green', showAll }) => {
  const constraints = useSelector((state) => state.applicationReducer.constraints);
  // if no value is passed return list of all constraints
  if (showAll)
    return constraints.map((constraint) => <TagWithPopUp key={constraint.id} color={color} constraint={constraint} />);

  if (!value) return null;

  const matchedConstraints = constraints.filter((el) => value.includes(el.id));
  return matchedConstraints.map((constraint) => (
    <TagWithPopUp key={constraint.id} color={color} constraint={constraint} />
  ));
};

const TagWithPopUp = ({ constraint, color }) => {
  // console.log('constraint', constraint);
  const [visible, setVisible] = useState(false);
  return (
    <>
      <Tag color={color} onClick={() => setVisible(true)} style={{ cursor: 'pointer' }}>
        {constraint.name}
      </Tag>
      <Modal
        title={constraint.name}
        centered
        visible={visible}
        closable={false}
        footer={null}
        onCancel={() => setVisible(false)}
        width={1000}>
        {/* description: "BR"
            id: "4efde558-fe46-421e-8f91-3d53f7466b5e"
            name: "Brazil"
            nature: "BR"
            permissible_purposes: "nature: 'BR'"
            scope: "BR"
            source: "BR" */}
        <ul>
          <li>Name: {constraint.name}</li>
          <li>Nature: {constraint.nature}</li>
          <li>Scope: {constraint.scope}</li>
          <li>Source: {constraint.source}</li>
          <li>Permissible purposes: {constraint.permissible_purposes}</li>
          <li>Description: {constraint.description}</li>
        </ul>
      </Modal>
    </>
  );
};

import React, { useEffect, useState } from 'react';
import { Button, Collapse, Form, Input, message, Modal, Select, Table } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { useSelector } from 'react-redux';
import ConstraintsTags from '../admin/Compliance/Constraints/ConstraintsTags';
const { Option } = Select;

const LayoutTable = ({ dataSource, setData, enableEdit }) => {
  const [modal, setModal] = useState({ isOpen: false, record: null });

  const edit = (record) => setModal(() => ({ isOpen: true, record }));
  const closeModal = () => setModal(() => ({ isOpen: false, record: null }));

  const columns = [
    {
      title: '',
      width: '3%',
      render: (text, record) =>
        enableEdit ? (
          <Button type="link" onClick={() => edit(record)} size="small" block icon={<EditOutlined />} />
        ) : null,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      sort: 'asc',
      width: '20%',
      ellipsis: true,
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      width: '10%',
      ellipsis: true,
      sorter: (a, b) => a.type.localeCompare(b.type),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      width: '25%',
      ellipsis: true,
    },
    {
      title: 'Constraints',
      children: [
        {
          title: 'Own',
          dataIndex: 'own',
          key: 'id',
          render: (text, record) => {
            return <ConstraintsTags list={record.constraints.own} />;
          },
        },
        {
          title: 'Inherited',
          dataIndex: 'inherited',
          key: 'id',
          render: (text, record) => {
            return <ConstraintsTags list={record.constraints.inherited} />;
          },
        },
      ],
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
      />
      <ConstraintModal modal={modal} setData={setData} dataSource={dataSource} closeModal={closeModal} />
    </>
  );
};

export default LayoutTable;

const ConstraintModal = ({ modal, setData, dataSource, closeModal }) => {
  const constraints = useSelector((state) => state.applicationReducer.constraints);

  const [editing, setEditing] = useState(false);

  const [form] = Form.useForm();

  useEffect(() => {
    const record = modal.record;
    if (!record) return;
    // Form will consume constraints[] as string[], we unpack constraints.own = [{id:string}] to [id:string]
    form.setFieldsValue({
      description: record.description,
      constraints: record.constraints.own.map(({ id }) => id),
    });

    return () => form.resetFields();
  }, [modal.isOpen, editing]);

  const addChanges = async () => {
    const values = await form.validateFields();
    const record = modal.record;

    const newDataSource = dataSource.map((el) => {
      if (el.id === record.id) {
        return {
          ...el,
          description: values.description,
          constraints: {
            ...el.constraints,
            // for consistency with our constraint model we will map constraints = [id:string] to [{id:string}]
            own: values.constraints.map((id) => ({ id })),
          },
        };
      }
      return el;
    });

    setData(newDataSource);
    setEditing(false);
    message.success('Success!');
    closeModal();
  };

  const onCancel = () => {
    setEditing(false);
    if (!editing) closeModal();
  };

  const getOKtext = () => (editing ? 'Submit' : 'Edit');
  const handleOk = () => (editing ? addChanges() : setEditing(true));

  const getConstraints = () => form.getFieldValue('constraints')?.map((id) => ({ id })) || [];

  if (!modal.isOpen) return null;

  return (
    <Modal
      title={'Field: ' + modal.record.name}
      width={1000}
      onOk={handleOk}
      cancelButtonProps={{ hidden: !editing }}
      onCancel={onCancel}
      okText={getOKtext()}
      visible={modal.isOpen}>
      <>
        <Form layout={editing ? 'vertical' : 'horizontal'} form={form}>
          <Form.Item noStyle shouldUpdate>
            {() => {
              return (
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
                    <ConstraintsTags list={getConstraints()} />
                  )}
                </Form.Item>
              );
            }}
          </Form.Item>

          <Form.Item label="Description :" name="description">
            {editing ? <Input.TextArea className="custom-scroll" allowClear cols={5} /> : <ReadOnlyField />}
          </Form.Item>
        </Form>

        <Collapse collapsible="header">
          <Collapse.Panel header="List of all available constraints, click on tag to see more">
            <ConstraintsTags showAll={true} />
          </Collapse.Panel>
        </Collapse>
      </>
    </Modal>
  );
};

const ReadOnlyField = ({ value }) => <span className="ant-form-text">{value}</span>;

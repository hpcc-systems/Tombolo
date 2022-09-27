import React, { useEffect, useState } from 'react';
import { Button, Collapse, Form, Input, message, Modal, Select, Table } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { useSelector } from 'react-redux';
import ConstraintsTags from '../admin/Compliance/Constraints/ConstraintsTags';
import Text, { i18n } from './Text';
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
      title: <Text>Name</Text>,
      dataIndex: 'name',
      sort: 'asc',
      width: '20%',
      ellipsis: true,
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: <Text>Type</Text>,
      dataIndex: 'type',
      width: '10%',
      ellipsis: true,
      sorter: (a, b) => a.type.localeCompare(b.type),
    },
    {
      title: <Text>Description</Text>,
      dataIndex: 'description',
      width: '25%',
      ellipsis: true,
    },
    {
      title: <Text>Constraints</Text>,
      children: [
        {
          title: <Text>Own</Text>,
          dataIndex: 'own',
          key: 'id',
          render: (text, record) => {
            return <ConstraintsTags list={record.constraints.own} />;
          },
        },
        {
          title: <Text>Inherited</Text>,
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

  const getOKtext = () => <Text>{editing ? 'Submit' : 'Edit'}</Text>;
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
                <Form.Item name="constraints" label={<Text>Select constraints</Text> + ':'}>
                  {editing ? (
                    <Select mode="multiple" placeholder={i18n('Please select constraints')}>
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

          <Form.Item label={<Text>Description</Text> + ':'} name="description">
            {editing ? <Input.TextArea className="custom-scroll" allowClear cols={5} /> : <ReadOnlyField />}
          </Form.Item>
        </Form>

        <Collapse collapsible="header">
          <Collapse.Panel header={<Text>List of all available constraints, click on tag to see more</Text>}>
            <ConstraintsTags showAll={true} />
          </Collapse.Panel>
        </Collapse>
      </>
    </Modal>
  );
};

const ReadOnlyField = ({ value }) => <span className="ant-form-text">{value}</span>;

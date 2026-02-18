import React, { useEffect, useState } from 'react';
import { Button, Collapse, Form, Input, Modal, Select, Table } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { useSelector } from 'react-redux';
import ConstraintsTags from '../admin/Compliance/Constraints/ConstraintsTags';
import { handleSuccess } from '@/components/common/handleResponse';
import Text from './Text';
import ReadOnlyField from './ReadOnlyField';

const { Option } = Select;

type Constraint = { id: string; name?: string };
type LayoutRecord = {
  id: string | number;
  name: string;
  type: string;
  description?: string;
  constraints: { own: Constraint[]; inherited?: Constraint[] };
};

type LayoutTableProps = {
  dataSource: LayoutRecord[];
  setData: (data: LayoutRecord[]) => void;
  enableEdit?: boolean;
};

const LayoutTable: React.FC<LayoutTableProps> = ({ dataSource, setData, enableEdit }) => {
  const [modal, setModal] = useState<{ isOpen: boolean; record: LayoutRecord | null }>({ isOpen: false, record: null });

  const edit = (record: LayoutRecord) => setModal(() => ({ isOpen: true, record }));
  const closeModal = () => setModal(() => ({ isOpen: false, record: null }));

  const columns: any[] = [
    {
      title: '',
      width: '3%',
      render: (_text: any, record: LayoutRecord) =>
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
      sorter: (a: LayoutRecord, b: LayoutRecord) => a.name.localeCompare(b.name),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      width: '10%',
      ellipsis: true,
      sorter: (a: LayoutRecord, b: LayoutRecord) => a.type.localeCompare(b.type),
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
          render: (_text: any, record: LayoutRecord) => {
            return <ConstraintsTags list={record.constraints.own} />;
          },
        },
        {
          title: 'Inherited',
          dataIndex: 'inherited',
          key: 'id_inherited',
          render: (_text: any, record: LayoutRecord) => {
            return <ConstraintsTags list={record.constraints.inherited || []} />;
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
        rowKey={record => record.id}
      />
      <ConstraintModal modal={modal} setData={setData} dataSource={dataSource} closeModal={closeModal} />
    </>
  );
};

export default LayoutTable;

const ConstraintModal: React.FC<any> = ({ modal, setData, dataSource, closeModal }) => {
  const constraints: Constraint[] = useSelector((state: any) => state.application.constraints || []);

  const [editing, setEditing] = useState(false);

  const [form] = Form.useForm();

  useEffect(() => {
    const record: LayoutRecord | null = modal.record;
    if (!record) return;
    form.setFieldsValue({ description: record.description, constraints: record.constraints.own.map(({ id }) => id) });

    return () => form.resetFields();
  }, [modal.isOpen, editing]);

  const addChanges = async () => {
    const values = await form.validateFields();
    const record: LayoutRecord = modal.record as LayoutRecord;

    const newDataSource = dataSource.map(el => {
      if (el.id === record.id) {
        return {
          ...el,
          description: values.description,
          constraints: {
            ...el.constraints,
            own: values.constraints.map((id: string) => ({ id })),
          },
        };
      }
      return el;
    });

    setData(newDataSource);
    setEditing(false);
    handleSuccess('Success!');
    closeModal();
  };

  const onCancel = () => {
    setEditing(false);
    if (!editing) closeModal();
  };

  const getOKtext = () => (editing ? 'Submit' : 'Edit');
  const handleOk = () => (editing ? addChanges() : setEditing(true));

  const getConstraints = () => form.getFieldValue('constraints')?.map((id: string) => ({ id })) || [];

  if (!modal.isOpen) return null;

  return (
    <Modal
      title={'Field: ' + modal.record.name}
      width={1000}
      onOk={handleOk}
      cancelButtonProps={{ hidden: !editing }}
      onCancel={onCancel}
      okText={getOKtext()}
      open={modal.isOpen}>
      <>
        <Form layout={editing ? 'vertical' : 'horizontal'} form={form}>
          <Form.Item noStyle shouldUpdate>
            {() => {
              return (
                <Form.Item name="constraints" label={'Select constraints' + ':'}>
                  {editing ? (
                    <Select mode="multiple" placeholder={'Please select constraints'}>
                      {constraints.map(el => {
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

          <Form.Item label={'Description' + ':'} name="description">
            {editing ? <Input.TextArea className="custom-scroll" allowClear cols={5} /> : <ReadOnlyField />}
          </Form.Item>
        </Form>

        <Collapse collapsible="header">
          <Collapse.Panel key="constraints-all" header={'List of all available constraints, click on tag to see more'}>
            <ConstraintsTags showAll={true} />
          </Collapse.Panel>
        </Collapse>
      </>
    </Modal>
  );
};

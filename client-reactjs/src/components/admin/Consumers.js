/* eslint-disable unused-imports/no-unused-vars */
import { DeleteOutlined, EditOutlined, QuestionCircleOutlined, SearchOutlined } from '@ant-design/icons';
import {
  AutoComplete,
  Button,
  Checkbox,
  Divider,
  Form,
  Input,
  message,
  Modal,
  notification,
  Popconfirm,
  Select,
  Table,
  Tooltip,
  Typography,
} from 'antd';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withTranslation } from 'react-i18next';

import { applicationActions } from '../../redux/actions/Application';
import { authHeader, handleError } from '../common/AuthHeader.js';
import BreadCrumbs from '../common/BreadCrumbs';

const Option = Select.Option;
const { Paragraph } = Typography;

class Consumers extends Component {
  state = {
    consumers: [],
    selectedConsumer: '',
    removeDisabled: true,
    showAddConsumer: false,
    confirmLoading: false,
    isEditing: false,
    type: '',
    newConsumer: {
      name: '',
      type: '',
      contact_name: '',
      contact_email: '',
      ad_group: '',
      assetType: [],
      transferType: '',
    },
    showAdGroupField: false,
    adGroupSearchResults: [],
    openShareAppDialog: false,
    appId: '',
    appTitle: '',
    submitted: false,
  };

  componentDidMount() {
    //this.getConsumers();
  }

  onSelectedRowKeysChange = (selectedRowKeys, selectedRows) => {
    var appsSelected = this.state.selectedApplications,
      removeDisabled = true;
    appsSelected = selectedRows;
    this.setState({
      selectedApplications: appsSelected,
    });
    removeDisabled = selectedRows.length > 0 ? false : true;
    this.setState({
      removeDisabled: removeDisabled,
    });
  };

  getConsumers() {
    var url = '/api/consumer/consumers';
    fetch(url, {
      headers: authHeader(),
    })
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
        handleError(response);
      })
      .then((data) => {
        this.setState({
          consumers: data,
        });
      })
      .catch((error) => {
        console.log(error);
      });
  }

  handleEditConsumer(consumer_id) {
    this.setState({
      isEditing: true,
    });
    fetch('/api/consumer/consumer?consumer_id=' + consumer_id, {
      headers: authHeader(),
    })
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
        handleError(response);
      })
      .then((data) => {
        console.log(JSON.stringify(data));
        this.setState({
          ...this.state,
          newConsumer: {
            ...this.state.newConsumer,
            id: data.consumer.id,
            name: data.consumer.name,
            type: data.consumer.type,
            assetType: data.consumer.assetType.split(','),
            contact_name: data.consumer.contact_name,
            contact_email: data.consumer.contact_email,
            ad_group: data.consumer.ad_group,
            transferType: data.consumer.transferType,
          },
        });
        this.setState({
          showAddConsumer: true,
          showAdGroupField: data.consumer.type == 'Internal' ? true : false,
        });
      })
      .catch((error) => {
        console.log(error);
      });
  }

  handleRemove = (consumer_id) => {
    var data = JSON.stringify({ consumerToDelete: consumer_id });
    fetch('/api/consumer/delete', {
      method: 'post',
      headers: authHeader(),
      body: data,
    })
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
        handleError(response);
      })
      .then((suggestions) => {
        notification.open({
          message: 'Consumer Removed',
          description: 'The Consumer has been removed.',
          onClick: () => {
            console.log('Closed!');
          },
        });
        this.props.dispatch(applicationActions.getConsumers());
      })
      .catch((error) => {
        console.log(error);
      });
  };

  handleAdd = () => {
    this.setState({
      showAddConsumer: true,
      isEditing: false,
    });
  };

  handleAddConsumerCancel = () => {
    this.setState({
      ...this.state,
      newConsumer: {
        ...this.state.newConsumer,
        id: '',
        name: '',
        type: '',
        contact_name: '',
        contact_email: '',
        ad_group: '',
        assetType: [],
      },
      showAddConsumer: false,
      showAdGroupField: false,
      confirmLoading: false,
      submitted: false,
    });
  };

  searchADGroups(searchString) {
    if (searchString.length <= 2) return;
    fetch('/api/ldap/groupSearch?groupName=' + searchString, {
      method: 'get',
      headers: authHeader(),
    })
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
        handleError(response);
      })
      .then((groupSearchResults) => {
        this.setState({
          ...this.state,
          adGroupSearchResults: groupSearchResults,
        });
      })
      .catch((error) => {
        console.log(error.text);
        message.error('There was error while searching active directory');
      });
  }

  async onGroupSelected(selectedGroup) {
    this.setState({
      ...this.state,
      newConsumer: {
        ...this.state.newConsumer,
        ad_group: selectedGroup,
      },
    });
  }

  onChange = (e) => {
    this.setState({
      ...this.state,
      confirmLoading: false,
      newConsumer: { ...this.state.newConsumer, [e.target.name]: e.target.value },
    });
  };

  onConsumerSupplierChange = (e) => {
    let newAssetType = this.state.newConsumer.assetType;
    newAssetType = e;
    this.setState({
      ...this.state,
      newConsumer: {
        ...this.state.newConsumer,
        assetType: newAssetType,
      },
    });
  };

  handleDataTransferChange = (e) => {
    this.setState({
      ...this.state,
      newConsumer: {
        ...this.state.newConsumer,
        transferType: e,
      },
    });
  };

  handleAddConsumerOk = () => {
    let consumer = [];
    consumer = this.props.consumers.map((consumer) => {
      return this.state.newConsumer.name === consumer.name;
    });
    if (consumer[0] && !this.state.isEditing) {
      return message.error('Consumer name must be unique');
    }
    this.setState({
      confirmLoading: true,
      submitted: true,
    });
    if (this.state.newConsumer.name) {
      let data = JSON.stringify({
        name: this.state.newConsumer.name,
        type: this.state.newConsumer.type,
        contact_name: this.state.newConsumer.contact_name,
        contact_email: this.state.newConsumer.contact_email,
        ad_group: this.state.newConsumer.ad_group,
        assetType: this.state.newConsumer.assetType.join(','),
        transferType: this.state.newConsumer.transferType,
      });

      console.log('data: ' + data);
      fetch('/api/consumer/consumer', {
        method: 'post',
        headers: authHeader(),
        body: data,
      })
        .then((response) => {
          if (response.ok) {
            return response.json();
          }
          handleError(response);
        })
        .then(() => {
          this.setState({
            ...this.state,
            type: 'Consumer',
            newConsumer: {
              ...this.state.newConsumer,
              id: '',
              name: '',
              type: '',
              contact_name: '',
              contact_email: '',
              ad_group: '',
            },
            showAddConsumer: false,
            confirmLoading: false,
            isEditing: false,
            submitted: false,
          });
          //this.getConsumers();
          this.props.dispatch(applicationActions.getConsumers());
        })
        .catch((error) => {
          console.log(error);
        });
    }
  };

  handleClose = () => {
    this.setState({
      openShareAppDialog: false,
    });
  };

  handleTypeChange = (value) => {
    var showADGroupField = false;
    console.log(process.env.REACT_APP_LDAP_SEARCH_ENABLED);
    if (value == 'Internal' && process.env.REACT_APP_LDAP_SEARCH_ENABLED == 'true') {
      showADGroupField = true;
    }

    this.setState({ ...this.state, newConsumer: { ...this.state.newConsumer, type: value } });

    this.setState({
      showAdGroupField: showADGroupField,
    });
  };

  render() {
    const { t } = this.props; // translation
    var isNameDisabled = false;
    const { confirmLoading, isEditing, adGroupSearchResults } = this.state;

    if (isEditing) {
      isNameDisabled = true;
    }

    //Collaborator type options
    const options = [
      { label: t('Supplier', { ns: 'collaborator' }), value: 'Supplier' },
      { label: t('Consumer', { ns: 'collaborator' }), value: 'Consumer' },
      { label: t('Owner', { ns: 'collaborator' }), value: 'Owner' },
    ];

    //Table columns
    const consumerColumns = [
      {
        width: '15%',
        title: t('Name', { ns: 'common' }),
        dataIndex: 'name',
      },
      {
        width: '15%',
        title: t('Contact', { ns: 'common' }),
        dataIndex: 'contact_name',
      },
      {
        width: '15%',
        title: t('E-mail', { ns: 'common' }),
        dataIndex: 'contact_email',
        rules: [
          {
            required: true,
            pattern: new RegExp(/^[a-zA-Z0-9_-]*$/),
            message: 'Please enter a valid Name',
          },
        ],
      },
      {
        width: '10%',
        title: t('Consumer/Supplier', { ns: 'collaborator' }),
        dataIndex: 'assetType',
      },
      {
        width: '5%',
        title: t('Type', { ns: 'common' }),
        dataIndex: 'type',
      },
      {
        width: '15%',
        title: t('AD Group', { ns: 'collaborator' }),
        dataIndex: 'ad_group',
      },
      {
        width: '5%',
        title: t('Action', { ns: 'common' }),
        dataIndex: '',
        render: (text, record) => (
          <span>
            <a href="#" onClick={(row) => this.handleEditConsumer(record.id)}>
              <Tooltip placement="right" title={t('Edit', { ns: 'common' })}>
                <EditOutlined />
              </Tooltip>
            </a>
            <Divider type="vertical" />
            <Popconfirm
              title={t('Are you sure you want to delete this Consumer?', { ns: 'collaborator' })}
              onConfirm={() => this.handleRemove(record.id)}
              icon={<QuestionCircleOutlined />}>
              <a href="#">
                <Tooltip placement="right" title={'Delete Consumer'}>
                  <DeleteOutlined />
                </Tooltip>
              </a>
            </Popconfirm>
          </span>
        ),
      },
    ];

    return (
      <React.Fragment>
        <BreadCrumbs
          extraContent={
            <Tooltip placement="bottom">
              <Button type="primary" onClick={() => this.handleAdd()}>
                {t('Add Collaborator', { ns: 'collaborator' })}
              </Button>
            </Tooltip>
          }
        />

        <div style={{ padding: '15px' }}>
          <Table
            columns={consumerColumns}
            rowKey={(record) => record.id}
            dataSource={this.props.consumers}
            pagination={this.props.consumers?.length > 10 ? { pageSize: 10 } : false}
          />
        </div>

        <div>
          <Modal
            title={t('Add Consumer/Supplier', { ns: 'collaborator' })}
            visible={this.state.showAddConsumer}
            onOk={this.handleAddConsumerOk.bind(this)}
            onCancel={this.handleAddConsumerCancel}
            confirmLoading={confirmLoading}
            destroyOnClose={true}>
            <Form layout="vertical">
              <Paragraph>
                {t('Consumer - Product/Application/Group consuming the asset', { ns: 'collaborator' })}
              </Paragraph>
              <Paragraph>
                {t('Supplied - Supplier of the asset data (DMV, Insurance company etc)', { ns: 'collaborator' })}
              </Paragraph>
              <Paragraph>{t('Owner - Contact Person/Group for an asset', { ns: 'collaborator' })}</Paragraph>

              <Form.Item label={t('Type', { ns: 'common' })} name="assetType" required>
                <Checkbox.Group options={options} onChange={this.onConsumerSupplierChange} />
              </Form.Item>

              <Form.Item
                label={t('Name', { ns: 'common' })}
                name="name"
                rules={[{ required: true, message: 'Consumer Name is required' }]}>
                <Input
                  id="consumer_title"
                  name="name"
                  onChange={this.onChange}
                  value={this.state.newConsumer.name}
                  disabled={isNameDisabled}
                />
              </Form.Item>

              <Form.Item label={t('Type', { ns: 'common' })} name="type" required>
                <Select
                  name="type"
                  id="consumer_type"
                  onSelect={this.handleTypeChange}
                  value={this.state.newConsumer.type}>
                  <Option value=""></Option>
                  <Option value="Api">API</Option>
                  <Option value="External">{t('External', { ns: 'common' })}</Option>
                  <Option value="Internal">{t('Internal', { ns: 'common' })}</Option>
                </Select>
              </Form.Item>

              {this.state.newConsumer.assetType.includes('Supplier') ? (
                <Form.Item label="Data Transfer">
                  <Select
                    name="type"
                    id="data_transfer"
                    onSelect={this.handleDataTransferChange}
                    value={this.state.newConsumer.transferType}>
                    <Option value=""></Option>
                    <Option value="API">API</Option>
                    <Option value="Batch">Batch</Option>
                    <Option value="SFTP">SFTP</Option>
                  </Select>
                </Form.Item>
              ) : null}

              <Form.Item label={t('Contact Name', { ns: 'common' })} name="contact_name" required>
                <Input
                  id="consumer_contact"
                  name="contact_name"
                  onChange={this.onChange}
                  value={this.state.newConsumer.contact_name}
                />
              </Form.Item>

              <Form.Item label={t('E-mail', { ns: 'common' })} name="contact_email" required>
                <Input
                  id="consumer_contact_email"
                  name="contact_email"
                  onChange={this.onChange}
                  value={this.state.newConsumer.contact_email}
                />
              </Form.Item>

              {this.state.showAdGroupField ? (
                <Form.Item label="AD Group">
                  <AutoComplete
                    className="certain-category-search"
                    dropdownClassName="certain-category-search-dropdown"
                    dropdownMatchSelectWidth={false}
                    dropdownStyle={{ width: 300 }}
                    size="large"
                    style={{ width: '100%' }}
                    dataSource={adGroupSearchResults}
                    onSearch={(value) => this.searchADGroups(value)}
                    onSelect={(value) => this.onGroupSelected(value)}
                    placeholder="Search AD groups"
                    optionLabelProp="value"
                    defaultValue={this.state.newConsumer.ad_group}>
                    <Input suffix={<SearchOutlined />} />
                  </AutoComplete>
                </Form.Item>
              ) : null}
            </Form>
          </Modal>
        </div>
      </React.Fragment>
    );
  }
}

function mapStateToProps(state) {
  const { user } = state.authenticationReducer;
  const { consumers } = state.applicationReducer;
  return {
    user,
    consumers,
  };
}
let connectedApp = connect(mapStateToProps)(Consumers);
connectedApp = withTranslation(['common', 'collaborator'])(connectedApp);

export default connectedApp;

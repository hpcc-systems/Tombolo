import React, { useState } from 'react';
import { Form, Select, DatePicker, Button, Checkbox, Drawer } from 'antd';
import { useHistory } from 'react-router-dom';
import { handleError } from '../../../common/AuthHeader.js';
import '../common/css/index.css';
import { FilterOutlined } from '@ant-design/icons';

// Form layout
const layout = {
  labelCol: { span: 24 },
  wrapperCol: { span: 24 },
};
function Filters({ groupDataBy, setGroupDataBy, dashboardFilters, setDashboardFilters }) {
  const [form] = Form.useForm();
  const history = useHistory();
  const [open, setOpen] = useState(false);

  const showDrawer = () => {
    setOpen(true);
  };

  const onClose = () => {
    setOpen(false);
  };

  // When form is submitted
  const onFinish = () => {
    try {
      form.validateFields();
    } catch (err) {
      handleError(err);
    }
  };

  // Disable future dates
  const disabledDate = (current) => {
    const date = new Date();
    const todaysDate = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
    return current && current >= todaysDate;
  };

  // When filters are changed - add to url params to persist on page refresh
  const updateParams = (param) => {
    const newParams = new URLSearchParams();
    const allFilters = { ...dashboardFilters, ...param };
    const allowedURLParams = ['initialStatus', 'finalStatus', 'severity', 'dateRange', 'groupDataBy'];
    for (let key in allFilters) {
      //only allow certain params to be added to url
      if (allowedURLParams.includes(key)) {
        newParams.set(key, allFilters[key]);
      }
    }
    history.push(`?${newParams.toString()}`);
  };

  //function to select or clear all when select all boxes are checked
  const selectAll = (e, option) => {
    //concatenate so we can dyanmically call the correct state variable to avoid case/switch
    const optionConcat = option + 'Options';

    if (e.target.checked) {
      form.setFieldsValue({ [option]: dashboardFilters[optionConcat].map((option) => option.value) });
      setDashboardFilters((prev) => ({
        ...prev,
        [option]: dashboardFilters[optionConcat].map((option) => option.value),
      }));
      updateParams({ [option]: dashboardFilters[optionConcat].map((option) => option.value) });
    } else {
      form.setFieldsValue({ [option]: [] });
      setDashboardFilters((prev) => ({ ...prev, [option]: [] }));
      updateParams({ [option]: [] });
    }
  };

  return (
    <>
      <Button type="primary" onClick={showDrawer}>
        <FilterOutlined />
        Filters
      </Button>
      <Drawer title="Dashboard Filters & Slicers" placement="right" onClose={onClose} open={open}>
        <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
          <Form {...layout} onFinish={onFinish} className="filters__form" form={form} initialValues={dashboardFilters}>
            <h2>Workunit Filters</h2>
            <Form.Item
              label={
                dashboardFilters?.initialStatus?.length === dashboardFilters?.initialStatusOptions?.length
                  ? 'Initial Status (all)'
                  : 'Initial Status'
              }
              name="initialStatus"
              style={{ display: 'inline-block', width: '100%' }}>
              <Select
                options={dashboardFilters?.initialStatusOptions}
                mode="multiple"
                maxTagCount={1}
                placeholder="Search"
                autoClearSearchValue={false}
                onChange={(values) => {
                  setDashboardFilters((prev) => ({ ...prev, initialStatus: values }));
                  updateParams({ initialStatus: values });
                }}
                dropdownRender={(menu) => (
                  <>
                    <div style={{ padding: '.5rem' }}>
                      <Checkbox
                        defaultChecked={
                          dashboardFilters?.initialStatus.length === dashboardFilters?.initialStatusOptions.length
                        }
                        style={{ marginBottom: '1rem' }}
                        onChange={(e) => selectAll(e, 'initialStatus')}>
                        Select All
                      </Checkbox>

                      {menu}
                    </div>
                  </>
                )}
              />
            </Form.Item>
            <Form.Item
              label={
                dashboardFilters?.finalStatus?.length === dashboardFilters?.finalStatusOptions?.length
                  ? 'Final Status (all)'
                  : 'Final Status'
              }
              name="finalStatus"
              style={{ display: 'inline-block', width: '100%' }}>
              <Select
                options={dashboardFilters?.finalStatusOptions}
                mode="multiple"
                maxTagCount={1}
                placeholder="Search"
                autoClearSearchValue={false}
                onChange={(values) => {
                  setDashboardFilters((prev) => ({ ...prev, finalStatus: values }));
                  updateParams({ finalStatus: values });
                }}
                dropdownRender={(menu) => (
                  <>
                    <div style={{ padding: '.5rem' }}>
                      <Checkbox
                        defaultChecked={
                          dashboardFilters?.finalStatus.length === dashboardFilters.finalStatusOptions.length
                        }
                        style={{ marginBottom: '1rem' }}
                        onChange={(e) => selectAll(e, 'finalStatus')}>
                        Select All
                      </Checkbox>

                      {menu}
                    </div>
                  </>
                )}
              />
            </Form.Item>

            <Form.Item
              name={'version'}
              label={
                dashboardFilters?.version?.length === dashboardFilters?.versionOptions?.length
                  ? 'Version (all)'
                  : 'Version'
              }
              style={{ display: 'inline-block', width: '100%' }}>
              <Select
                options={dashboardFilters?.versionOptions}
                mode="multiple"
                maxTagCount={1}
                onChange={(values) => {
                  setDashboardFilters((prev) => ({ ...prev, version: values }));
                }}
                dropdownRender={(menu) => (
                  <>
                    <div style={{ padding: '.5rem' }}>
                      <Checkbox
                        defaultChecked={dashboardFilters?.version.length === dashboardFilters.versionOptions.length}
                        style={{ marginBottom: '1rem' }}
                        onChange={(e) => selectAll(e, 'version')}>
                        Select All
                      </Checkbox>

                      {menu}
                    </div>
                  </>
                )}></Select>
            </Form.Item>

            <Form.Item
              name={'wuid'}
              label={dashboardFilters?.wuid?.length === dashboardFilters?.wuidOptions?.length ? 'WUIDs (all)' : 'WUIDs'}
              style={{ display: 'inline-block', width: '100%' }}>
              <Select
                options={dashboardFilters?.wuidOptions}
                mode="multiple"
                maxTagCount={1}
                onChange={(values) => {
                  setDashboardFilters((prev) => ({ ...prev, wuid: values }));
                }}
                dropdownRender={(menu) => (
                  <>
                    <div style={{ padding: '.5rem' }}>
                      <Checkbox
                        defaultChecked={dashboardFilters?.wuid.length === dashboardFilters.wuidOptions.length}
                        style={{ marginBottom: '1rem' }}
                        onChange={(e) => selectAll(e, 'wuid')}>
                        Select All
                      </Checkbox>

                      {menu}
                    </div>
                  </>
                )}></Select>
            </Form.Item>

            <h2 style={{ marginTop: '2rem' }}>Build Filters</h2>
            <Form.Item
              name={'builds'}
              label={
                dashboardFilters?.builds?.length === dashboardFilters?.buildsOptions?.length ? 'Builds (all)' : 'Builds'
              }
              style={{ display: 'inline-block', width: '100%' }}>
              <Select
                options={dashboardFilters?.buildsOptions}
                mode="multiple"
                maxTagCount={0}
                onChange={(values) => {
                  setDashboardFilters((prev) => ({ ...prev, builds: values }));
                }}></Select>
            </Form.Item>
            <Form.Item
              name={'businessUnits'}
              label={
                dashboardFilters?.businessUnits?.length === dashboardFilters?.businessUnitsOptions?.length
                  ? 'Owners (all)'
                  : 'Owners'
              }
              style={{ display: 'inline-block', width: '100%' }}>
              <Select
                options={dashboardFilters?.businessUnitsOptions}
                mode="multiple"
                maxTagCount={0}
                onChange={(values) => {
                  setDashboardFilters((prev) => ({ ...prev, businessUnits: values }));
                  updateParams({ businessUnits: values });
                }}></Select>
            </Form.Item>
            <Form.Item
              name={'products'}
              label={
                dashboardFilters?.products?.length === dashboardFilters?.productsOptions?.length
                  ? 'Products (all)'
                  : 'Products'
              }
              style={{ display: 'inline-block', width: '100%' }}>
              <Select
                options={dashboardFilters?.productsOptions}
                mode="multiple"
                maxTagCount={0}
                onChange={(values) => {
                  setDashboardFilters((prev) => ({ ...prev, products: values }));
                  updateParams({ products: values });
                }}></Select>
            </Form.Item>
            <Form.Item
              name={'severity'}
              label={
                dashboardFilters?.severity?.length === dashboardFilters?.severityOptions?.length
                  ? 'Severity (all)'
                  : 'Severity'
              }
              style={{ display: 'inline-block', width: '100%' }}>
              <Select
                options={dashboardFilters?.severityOptions}
                mode="multiple"
                maxTagCount={1}
                onChange={(values) => {
                  setDashboardFilters((prev) => ({ ...prev, severity: values }));
                }}></Select>
            </Form.Item>

            <h2 style={{ marginTop: '2rem' }}>Chart Slicers</h2>

            <Form.Item label="Date range" name="dateRange" style={{ display: 'inline-block', width: '100%' }}>
              <DatePicker.RangePicker
                disabledDate={disabledDate}
                allowClear={true}
                onChange={(value) => {
                  setDashboardFilters((prev) => ({ ...prev, dateRange: value }));
                  updateParams({ dateRange: value });
                  const numberOfDays = Math.ceil(Math.abs(value[0] - value[1]) / (1000 * 60 * 60 * 24) + 1);
                  let suggestedFilterByOption;
                  if (numberOfDays <= 15) {
                    setGroupDataBy('day');
                    suggestedFilterByOption = 'day';
                  } else if (numberOfDays > 15 && numberOfDays <= 105) {
                    setGroupDataBy('week');
                    suggestedFilterByOption = 'week';
                  } else if (numberOfDays > 105 && numberOfDays <= 548) {
                    setGroupDataBy('month');
                    suggestedFilterByOption = 'month';
                  } else {
                    suggestedFilterByOption = 'year';
                    setGroupDataBy('year');
                  }
                  form.setFieldsValue({ groupDataBy: suggestedFilterByOption });
                }}
              />
            </Form.Item>

            <Form.Item name={'groupDataBy'} label="Group By" style={{ display: 'inline-block', width: '100%' }}>
              <Select
                options={dashboardFilters.groupByOptions}
                value={groupDataBy}
                onSelect={(value) => {
                  setGroupDataBy(value);
                  setDashboardFilters((prev) => ({ ...prev, groupDataBy: value }));
                  updateParams({ groupDataBy: value });
                }}></Select>
            </Form.Item>

            <Form.Item
              className="hide_formItem_label"
              label="button"
              style={{ display: 'inline-block', width: '100%' }}>
              <Button type="primary" htmlType="submit">
                Go
              </Button>
            </Form.Item>
          </Form>
        </div>
      </Drawer>
    </>
  );
}
export default Filters;

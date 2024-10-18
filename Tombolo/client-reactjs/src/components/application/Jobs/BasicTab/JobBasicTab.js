import React from 'react';
import { Col, Form, Row, Select } from 'antd';
import Text from '../../../common/Text';
import WithSpinner from '../../../common/WithSpinner';
import ReadOnlyField from '../../../common/ReadOnlyField';
// import { hasEditPermission } from '../../../common/AuthUtil';

import BasicsTabSpray from './BasicsTabSpray';
import BasicsTabManul from './BasicsTabManaul';
import BasicsTabScript from './BasicsTabScript';
import BasicsTabGeneral from './BasicsTabGeneral';

const jobTypes = [
  'Data Profile',
  'ETL',
  'Job',
  'Manual',
  'Query Publish',
  'Modeling',
  'Query Build',
  'Scoring',
  'Script',
  'Spray',
];

function JobBasicTab({ state, setState, form, props }) {
  const isAssociated = form.current?.getFieldValue('isAssociated'); // this value is assign only at the time of saving job. if it is true - user can not change it.

  const { clusters, application, inTabView } = props;
  const { addingNewAsset, enableEdit, initialDataLoading, job } = state;
  const { jobType } = job;
  // const user = JSON.parse(localStorage.getItem('user'));
  //TODO, get this from user roles to check if editing is allowed
  const editingAllowed = true;

  const onChange = (e) => setState({ job: { ...state.job, [e.target.name]: e.target.value } });
  const onJobTypeChange = (value) => setState({ job: { ...state.job, jobType: value } });

  const onClusterSelection = (value) => setState({ selectedCluster: value });

  const setJobDetails = (jobDetails) => {
    setState({
      ...state,
      job: {
        ...state.job,
        id: jobDetails.id,
        groupId: jobDetails.groupId,
        ecl: jobDetails.ecl,
        inputFiles: jobDetails.jobfiles.filter((jobFile) => jobFile.file_type === 'input'),
        outputFiles: jobDetails.jobfiles.filter((jobFile) => jobFile.file_type === 'output'),
      },
    });
  };

  const clearState = () => {
    setState({
      ...state,
      sourceFiles: [],
      selectedInputFile: '',
      selectedTab: 0,
      clusters: [],
      selectedCluster: '',
      jobSearchSuggestions: [],
      job: {
        id: '',
        groupId: '',
        dataflowId: props.selectedDataflow ? props.selectedDataflow.id : '',
        ecl: '',
        entryBWR: '',
        jobType: props?.selectedAsset?.type || '',
        gitRepo: '',
        contact: '',
        inputParams: [],
        inputFiles: [],
        outputFiles: [],
      },
    });

    form.current.resetFields();
  };

  return (
    <>
      {inTabView ? null : (
        <Form.Item label={<Text text="Job Type" />} className={enableEdit ? null : 'read-only-input'}>
          <Row gutter={[8, 8]}>
            <Col span={12}>
              <Form.Item noStyle name="jobType">
                {!enableEdit ? (
                  <ReadOnlyField />
                ) : (
                  <Select disabled={isAssociated} placeholder="Job Type" onChange={onJobTypeChange}>
                    {jobTypes.map((d) => (
                      <Select.Option key={d}>{d}</Select.Option>
                    ))}
                  </Select>
                )}
              </Form.Item>
            </Col>
          </Row>
        </Form.Item>
      )}

      <WithSpinner loading={initialDataLoading}>
        <Form.Item shouldUpdate noStyle>
          {() => {
            const options = {
              Spray: BasicsTabSpray,
              Manual: BasicsTabManul,
              Script: BasicsTabScript,
              default: BasicsTabGeneral,
            };

            const Component = options[jobType] || options.default;

            const props = {
              clusters,
              jobType,
              inTabView,
              enableEdit,
              addingNewAsset,
              editingAllowed,
              formRef: form,
              localState: state,
              applicationId: application.applicationId,
              onChange,
              clearState,
              setJobDetails,
              onJobTypeChange,
              onClusterSelection,
            };

            return <Component {...props} />;
          }}
        </Form.Item>
      </WithSpinner>
    </>
  );
}

export default JobBasicTab;

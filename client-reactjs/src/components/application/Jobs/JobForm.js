import React from 'react';
import { Form } from 'antd';
import { formItemLayout } from '../../common/CommonUtil';
import Text from '../../common/Text';

const JobForm = ({ children, state, setState, form, props }) => {
  const { addingNewAsset, enableEdit, job } = state;
  const { displayingInModal, inTabView } = props;

  //When input field value is changed update JobDetails state
  const onFieldsChange = (changedFields, allFields) => {
    const inputErrors = allFields.filter((item) => item.errors.length > 0);
    setState({ dataAltered: true, errors: inputErrors.length > 0 });
  };

  return (
    <>
      {displayingInModal || addingNewAsset ? null : (
        <div className="assetTitle">
          <Text text="Job" /> : {job.name}
        </div>
      )}
      <div
        className={
          displayingInModal ? 'assetDetails-content-wrapper-modal' : !inTabView ? '' : 'assetDetails-content-wrapper'
        }>
        <Form
          enableEdit={enableEdit}
          {...formItemLayout}
          initialValues={{
            selectedFile: null,
            notify: 'Never',
            jobType: 'Job',
            isStoredOnGithub: false,
          }}
          labelAlign="left"
          ref={form}
          scrollToFirstError
          onFieldsChange={onFieldsChange}>
          {children}
        </Form>
      </div>
    </>
  );
};

export default JobForm;

import React from 'react';
import { Form } from 'antd';
import { formItemLayout } from '../../common/CommonUtil';
import Text from '../../common/Text';

const JobForm = ({ children, inModal, newAsset, colon, inTab, jobName, formRef, setState }) => {
  //When input field value is changed update JobDetails state
  const onFieldsChange = (changedFields, allFields) => {
    const inputErrors = allFields.filter((item) => item.errors.length > 0);
    setState({ dataAltered: true, errors: inputErrors.length > 0 });
  };

  return (
    <>
      {inModal || newAsset ? null : (
        <div className="assetTitle">
          <Text text="Job" /> : {jobName}
        </div>
      )}
      <div className={inModal ? 'assetDetails-content-wrapper-modal' : !inTab ? '' : 'assetDetails-content-wrapper'}>
        <Form
          colon={colon}
          {...formItemLayout}
          initialValues={{
            selectedFile: null,
            notify: 'Never',
            jobType: 'Job',
            isStoredOnGithub: false,
          }}
          labelAlign="left"
          ref={formRef}
          scrollToFirstError
          onFieldsChange={onFieldsChange}>
          {children}
        </Form>
      </div>
    </>
  );
};

export default JobForm;

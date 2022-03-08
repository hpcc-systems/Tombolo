import React, { useState } from 'react';

import RadioButtons from './RadioButtons';
import TextAreaField from './TextAreaField';
import UserSearch from '../../../common/UserSearch';
import { formItemLayoutWithOutLabel, formItemLayout } from '../../../common/CommonUtil';

const Notifications = ({ enableEdit, formRef }) => {
  const [showDetails, setShowDetails] = useState(false);
  const notifyStatus = formRef.current?.getFieldValue('notify');

  const commonProps= { enableEdit, showDetails };

  return (
    <>
      <RadioButtons
        {...commonProps}
        notifyStatus={notifyStatus}
        setShowDetails={setShowDetails} 
      />

      {(notifyStatus === 'Always' || notifyStatus === 'Only on success') && (
        <TextAreaField
          {...commonProps}
          label="On Success"
          placeholder="Success message"
          name="notificationSuccessMessage"
          errorMessage="Success Message Required"
        />
      )}

      {(notifyStatus === 'Always' || notifyStatus === 'Only on failure') && (
        <TextAreaField
          {...commonProps}
          label="On Failure"
          placeholder="Failure message"
          name="notificationFailureMessage"
          errorMessage="Failure Message Required"
        />
      )}

      {notifyStatus !== 'Never' &&
        <UserSearch 
         {...commonProps}
        layout={formItemLayout} 
        noLabelLayout={formItemLayoutWithOutLabel}
        />
      }
    </>
  );
};

export default Notifications;

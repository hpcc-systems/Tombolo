import React from 'react';
import EmailTagInput from '../EmailTagInput';

function AsrSpecificNotificationsDetails() {
  return (
    <>
      <EmailTagInput label="Secondary Contact(s)" name="secondaryContacts" required={false} />
      <EmailTagInput label="Notify Contact(s)" name="notifyContacts" required={false} />
    </>
  );
}

export default AsrSpecificNotificationsDetails;

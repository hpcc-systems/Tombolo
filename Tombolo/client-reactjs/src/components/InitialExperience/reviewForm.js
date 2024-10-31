import React, { useEffect, useState } from 'react';

const ReviewForm = ({ instanceForm, userForm, current }) => {
  const [instanceFormValues, setInstanceFormValues] = useState(instanceForm.getFieldsValue());
  const [userFormValues, setUserFormValues] = useState(userForm.getFieldsValue());

  useEffect(() => {
    if (current === 2) {
      setInstanceFormValues(instanceForm.getFieldsValue());
      setUserFormValues(userForm.getFieldsValue());
    }
  }, [current]);
  return (
    <>
      <h2>Instance Information</h2>
      <p>Instance Name: {instanceFormValues?.name}</p>
      <p>Instance Description: {instanceFormValues?.description}</p>
      <p>Contact Email: {instanceFormValues?.contactEmail}</p>

      <h2>Owner Account Information</h2>
      <p>First Name: {userFormValues?.firstName}</p>
      <p>Last Name: {userFormValues?.lastName}</p>
      <p>Email: {userFormValues?.email}</p>
    </>
  );
};

export default ReviewForm;

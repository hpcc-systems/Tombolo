import React, { useEffect, useState } from 'react';
import { FormInstance } from 'antd';

interface Props {
  instanceForm: FormInstance<any>;
  userForm: FormInstance<any>;
  current?: number;
  currentStep?: number;
}

const ReviewForm: React.FC<Props> = ({ instanceForm, userForm, current, currentStep }) => {
  const currentIndex = current ?? currentStep;
  const [instanceFormValues, setInstanceFormValues] = useState(instanceForm.getFieldsValue());
  const [userFormValues, setUserFormValues] = useState(userForm.getFieldsValue());

  useEffect(() => {
    if (currentIndex === 2) {
      setInstanceFormValues(instanceForm.getFieldsValue());
      setUserFormValues(userForm.getFieldsValue());
    }
  }, [currentIndex]);

  return (
    <>
      <h2>Instance Information</h2>
      <p>Instance Name: {instanceFormValues?.name}</p>
      <p>Instance Description: {instanceFormValues?.description}</p>

      <h2>Owner Account Information</h2>
      <p>First Name: {userFormValues?.firstName}</p>
      <p>Last Name: {userFormValues?.lastName}</p>
      <p>Email: {userFormValues?.email}</p>
    </>
  );
};

export default ReviewForm;

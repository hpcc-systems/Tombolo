import { Button } from 'antd';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

const SaveAllJobsButton = ({ jobDetailsList }) => {
  const [saveJobs, setSaveJobs] = useState({ error: '', loading: false, result: {} });
  const { t } = useTranslation(['common']); // t for translate -> getting namespaces relevant to this file

  const handleSaveAllJobs = async () => {
    setSaveJobs((prev) => ({ ...prev, loading: true, error: '' }));

    const promises = [];

    for (const key in jobDetailsList.current) {
      const jobDetails = jobDetailsList.current[key];
      promises.push(jobDetails.handleOk());
    }

    const result = await Promise.all(promises);
    console.log('-result-----------------------------------------');
    console.dir({ result }, { depth: null });
    console.log('------------------------------------------');

    setSaveJobs((prev) => ({ ...prev, loading: false, error: '' }));
  };

  return (
    <Button type="primary" loading={saveJobs.loading} onClick={handleSaveAllJobs}>
      {t('Save All Jobs', { ns: 'common' })}
    </Button>
  );
};

export default SaveAllJobsButton;

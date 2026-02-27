import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Descriptions, Form, Tag } from 'antd';
import { handleError, handleSuccess } from '@/components/common/handleResponse';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import MonitoringActionButton from '../../common/Monitoring/ActionButton';
import AddEditJobMonitoringModal from './AddEditJobMonitoringModal';
import {
  checkScheduleValidity,
  identifyErroneousTabs,
  isScheduleUpdated,
  handleJobMonitoringEvaluation,
} from './jobMonitoringUtils';
import jobMonitoringService from '@/services/jobMonitoring.service';

import { getRoleNameArray } from '../../common/AuthUtil';
import JobMonitoringTable from './JobMonitoringTable';
import MonitoringDetailsModal from '../../common/Monitoring/MonitoringDetailsModal';
import ApproveRejectModal from '../../common/Monitoring/ApproveRejectModal';
import BulkUpdateModal from './BulkUpdateModal';
import BreadCrumbs from '../../common/BreadCrumbs';
import JobMonitoringFilters from './JobMonitoringFilters';
import { useMonitorType } from '@/hooks/useMonitoringType';
import { useDomainAndCategories } from '@/hooks/useDomainsAndProductCategories';
import { useMonitoringsAndAllProductCategories } from '@/hooks/useMonitoringsAndAllProductCategories';
import capitalize from 'lodash/capitalize';
import { getDateLabel, getDayLabel, getMonthLabel, getWeekLabel } from '../../common/scheduleOptions';
import cronstrue from 'cronstrue';
import { APPROVAL_STATUS, Constants } from '@/components/common/Constants';
import { JobMonitoringDTO } from '@tombolo/shared';

const monitoringTypeName = 'Job Monitoring';

const JobMonitoring: React.FC = () => {
  const applicationId = useSelector((state: any) => state.application.application.applicationId);
  const clusters = useSelector((state: any) => state.application.clusters);

  const roleArray = getRoleNameArray();
  const isReader = roleArray.includes('reader') && roleArray.length === 1;

  const [displayAddJobMonitoringModal, setDisplayAddJobMonitoringModal] = useState(false);
  const [intermittentScheduling, setIntermittentScheduling] = useState<any>({
    frequency: 'daily',
    id: uuidv4(),
    runWindow: 'daily',
  });
  const [completeSchedule, setCompleteSchedule] = useState<any[]>([]);
  const [cron, setCron] = useState('');
  const [cronMessage, setCronMessage] = useState<any>(null);
  const [erroneousScheduling, setErroneousScheduling] = useState(false);
  const [filteredJobMonitoring, setFilteredJobMonitoring] = useState<JobMonitoringDTO[]>([]);
  const [displayMonitoringDetailsModal, setDisplayMonitoringDetailsModal] = useState(false);
  const [selectedMonitoring, setSelectedMonitoring] = useState<any>(null);
  const [editingData, setEditingData] = useState<any>({ isEditing: false });
  const [duplicatingData, setDuplicatingData] = useState<any>({ isDuplicating: false });
  const [monitoringScope, setMonitoringScope] = useState<any>(null);
  const [displayAddRejectModal, setDisplayAddRejectModal] = useState(false);
  const [savingJobMonitoring, setSavingJobMonitoring] = useState(false);
  const [erroneousTabs, setErroneousTabs] = useState<string[]>([]);
  const [selectedCluster, setSelectedCluster] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>('0');
  const [selectedRows, setSelectedRows] = useState<any[]>([]);
  const [bulkEditModalVisibility, setBulkEditModalVisibility] = useState(false);
  const [filters, setFilters] = useState<any>({});
  const [filtersVisible, setFiltersVisible] = useState(true);
  const [filteringJobs, setFilteringJobs] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [matchCount, setMatchCount] = useState(0);

  const [form] = Form.useForm();

  const {
    monitorings: jobMonitorings,
    setMonitorings: setJobMonitorings,
    allProductCategories,
  } = useMonitoringsAndAllProductCategories(applicationId, jobMonitoringService.getAll);

  useEffect(() => {
    if (editingData?.isEditing || duplicatingData?.isDuplicating) {
      form.setFieldsValue(selectedMonitoring);
      setMonitoringScope(selectedMonitoring.monitoringScope);
      setSelectedCluster(clusters.find((c: any) => c.id === selectedMonitoring.clusterId));

      let expectedCompletionTime = selectedMonitoring?.metaData?.expectedCompletionTime;
      let expectedStartTime = selectedMonitoring?.metaData?.expectedStartTime;
      expectedCompletionTime = dayjs(expectedCompletionTime, 'HH:mm');
      expectedStartTime = dayjs(expectedStartTime, 'HH:mm');

      form.setFieldsValue({
        ...selectedMonitoring?.metaData?.asrSpecificMetaData,
        ...selectedMonitoring?.metaData?.notificationMetaData,
        requireComplete: selectedMonitoring.metaData.requireComplete,
        maxExecutionTime: selectedMonitoring.metaData.maxExecutionTime,
        expectedCompletionTime,
        expectedStartTime,
      });
      if (selectedMonitoring.metaData.schedule) {
        const { schedule } = selectedMonitoring.metaData;
        if (schedule.length > 0) {
          const { frequency } = schedule[0];
          if (frequency === 'cron') {
            setCron(schedule[0].cron);
            setIntermittentScheduling({ frequency: schedule[0].frequency });
          } else if (frequency === 'daily' || frequency === 'weekly' || frequency === 'anytime') {
            setIntermittentScheduling(schedule[0]);
          } else {
            setCompleteSchedule(schedule);
            setIntermittentScheduling({ frequency: schedule[0].frequency, scheduleBy: schedule[0].scheduleBy });
          }
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingData, duplicatingData, form, selectedMonitoring, clusters]);

  const { monitoringTypeId } = useMonitorType(monitoringTypeName);
  const { domains, productCategories, setProductCategories, selectedDomain, setSelectedDomain } =
    useDomainAndCategories(monitoringTypeId, selectedMonitoring);

  useEffect(() => {
    setFilteringJobs(true);
    if (jobMonitorings.length === 0) {
      setFilteringJobs(false);
    }
    const { approvalStatus, activeStatus, domain, frequency, product } = filters;

    let activeStatusBool: boolean | undefined;
    if (activeStatus === 'Active') activeStatusBool = true;
    else if (activeStatus === 'Inactive') activeStatusBool = false;

    let filteredJm = jobMonitorings.filter((jobMonitoring: any) => {
      let include = true;
      const currentDomain = jobMonitoring?.metaData?.asrSpecificMetaData?.domain;
      const currentProduct = jobMonitoring?.metaData?.asrSpecificMetaData?.productCategory;
      const currentFrequency = jobMonitoring?.metaData?.schedule[0]?.frequency;

      if (approvalStatus && jobMonitoring.approvalStatus !== approvalStatus) include = false;
      if (activeStatusBool !== undefined && jobMonitoring.isActive !== activeStatusBool) include = false;
      if (domain && currentDomain !== domain) include = false;
      if (product && currentProduct !== product) include = false;
      if (frequency && currentFrequency !== frequency) include = false;

      return include;
    });

    const matchedJobIds: any[] = [];

    if (searchTerm) {
      let instanceCount = 0;
      filteredJm.forEach((job: any) => {
        const jobName = job.jobName.toLowerCase();
        const monitoringName = job.monitoringName.toLowerCase();

        if (jobName.includes(searchTerm)) {
          matchedJobIds.push(job.id);
          instanceCount++;
        }

        if (monitoringName.includes(searchTerm)) {
          matchedJobIds.push(job.id);
          instanceCount++;
        }
      });

      setMatchCount(instanceCount);
    } else {
      setMatchCount(0);
    }

    if (matchedJobIds.length > 0) {
      filteredJm = filteredJm.filter(job => matchedJobIds.includes(job.id));
    } else if (matchedJobIds.length === 0 && searchTerm) {
      filteredJm = [];
    }

    setFilteredJobMonitoring(filteredJm);
    setFilteringJobs(false);
  }, [filters, jobMonitorings, searchTerm]);

  const handleBulkDeleteSelectedJobMonitorings = async (ids: any[]) => {
    try {
      await jobMonitoringService.bulkDelete({ ids });
      setJobMonitorings((prev: any[]) => prev.filter((jm: any) => !ids.includes(jm.id)));
      setSelectedRows([]);
    } catch (_) {
      handleError('Unable to delete selected job monitorings');
    }
  };

  const handleBulkStartPauseJobMonitorings = async ({ ids, action }: { ids: any[]; action: string }) => {
    try {
      // Monitoring service expects boolean `action` representing target isActive state.
      const isActive = action === 'start';
      const response: any = await jobMonitoringService.toggle({ ids, action: isActive });
      const updatedMonitorings = response.updatedJobMonitorings;
      setJobMonitorings((prev: any[]) =>
        prev.map((monitoring: any) => updatedMonitorings.find((u: any) => u.id === monitoring.id) || monitoring)
      );
    } catch (_) {
      handleError('Unable to start/pause selected job monitorings');
    }
  };

  const resetStates = () => {
    setIntermittentScheduling({ frequency: 'daily', id: uuidv4(), runWindow: 'daily' });
    setCompleteSchedule([]);
    setDisplayAddJobMonitoringModal(false);
    setSelectedMonitoring(null);
    setEditingData({ isEditing: false });
    setDuplicatingData({ isDuplicating: false });
    setMonitoringScope(null);
    setErroneousTabs([]);
    setErroneousScheduling(false);
    setSelectedCluster(null);
    setProductCategories([]);
    setActiveTab('0');
    setCron('');
    form.resetFields();
  };

  const handleOpenBulkEdit = () => setBulkEditModalVisibility(true);
  const handleOpenApproveReject = () => setDisplayAddRejectModal(true);
  const handleToggleFilters = () => setFiltersVisible(prev => !prev);
  const handleAddJobMonitoringButtonClick = () => setDisplayAddJobMonitoringModal(true);

  const handleSaveJobMonitoring = async () => {
    setSavingJobMonitoring(true);
    let validForm = true;
    try {
      await form.validateFields();
    } catch (err) {
      validForm = false;
    }

    const jobSchedule = checkScheduleValidity({ intermittentScheduling, completeSchedule, cron, cronMessage });

    if (!jobSchedule.valid) {
      setErroneousScheduling(true);
      validForm = false;
    } else {
      setErroneousScheduling(false);
    }

    const erroneousFields = form
      .getFieldsError()
      .filter((f: any) => f.errors.length > 0)
      .map((f: any) => f.name[0]);
    const badTabs = identifyErroneousTabs({ erroneousFields });
    if (!badTabs.includes('1') && !jobSchedule.valid) badTabs.push('1');
    if (badTabs.length > 0) setErroneousTabs(badTabs);

    if (!validForm) {
      setSavingJobMonitoring(false);
      return;
    }

    try {
      let allInputs: any = form.getFieldsValue();

      Object.entries(allInputs).forEach(([key, value]) => {
        if (typeof value === 'string') allInputs[key] = value.trim();
      });

      const { monitoringScope } = allInputs;
      if (monitoringScope === 'ClusterWideMonitoring') allInputs.jobName = '*';

      const asrSpecificMetaData: any = {};
      const { domain, productCategory, jobMonitorType, severity, requireComplete } = allInputs;
      const asrSpecificFields: any = { domain, productCategory, jobMonitorType, severity };
      for (let key in asrSpecificFields) {
        if (asrSpecificFields[key] !== undefined) asrSpecificMetaData[key] = asrSpecificFields[key];
        delete allInputs[key as keyof typeof allInputs];
      }

      const notificationMetaData: any = {};
      const { notificationCondition, primaryContacts, secondaryContacts, notifyContacts } = allInputs;
      const notificationSpecificFields: any = {
        notificationCondition,
        primaryContacts,
        secondaryContacts,
        notifyContacts,
      };
      for (let key in notificationSpecificFields) {
        if (notificationSpecificFields[key] !== undefined) notificationMetaData[key] = notificationSpecificFields[key];
        delete allInputs[key as keyof typeof allInputs];
      }

      const metaData: any = {};
      let { expectedStartTime, expectedCompletionTime } = allInputs;
      metaData.requireComplete = requireComplete;
      delete allInputs.requireComplete;

      if (expectedCompletionTime) {
        metaData.expectedCompletionTime = expectedCompletionTime.format('HH:mm');
        delete allInputs.expectedCompletionTime;
      }
      if (expectedStartTime) {
        metaData.expectedStartTime = expectedStartTime.format('HH:mm');
        delete allInputs.expectedStartTime;
      }
      metaData.maxExecutionTime = allInputs.maxExecutionTime;
      delete allInputs.maxExecutionTime;

      if (jobSchedule.schedule.length > 0 && monitoringScope !== 'ClusterWideMonitoring') {
        metaData.schedule = jobSchedule.schedule;
      }

      allInputs.applicationId = applicationId;
      metaData.asrSpecificMetaData = asrSpecificMetaData;
      metaData.notificationMetaData = notificationMetaData;
      allInputs = { ...allInputs, metaData };

      const responseData: any = await jobMonitoringService.create({ inputData: allInputs });

      setJobMonitorings([responseData, ...jobMonitorings]);
      handleSuccess('Job monitoring saved successfully');

      resetStates();
      setDisplayAddJobMonitoringModal(false);
    } catch (err: any) {
      handleError(err.message);
    } finally {
      setSavingJobMonitoring(false);
    }
  };

  const handleUpdateJobMonitoring = async () => {
    setSavingJobMonitoring(true);
    try {
      let validForm = true;
      try {
        await form.validateFields();
      } catch (err) {
        validForm = false;
      }

      const jobSchedule = checkScheduleValidity({ intermittentScheduling, completeSchedule, cron, cronMessage });
      if (!jobSchedule.valid) {
        setErroneousScheduling(true);
        validForm = false;
      } else {
        setErroneousScheduling(false);
      }

      const erroneousFields = form
        .getFieldsError()
        .filter((f: any) => f.errors.length > 0)
        .map((f: any) => f.name[0]);
      const badTabs = identifyErroneousTabs({ erroneousFields });
      if (!badTabs.includes('1') && !jobSchedule.valid) badTabs.push('1');
      if (badTabs.length > 0) setErroneousTabs(badTabs);

      if (!validForm) {
        setSavingJobMonitoring(false);
        return;
      }

      const formFields = form.getFieldsValue();
      const fields = Object.keys(formFields);

      const asrSpecificFields = ['domain', 'productCategory', 'severity'];
      const metaDataFields = ['expectedCompletionTime', 'expectedStartTime', 'requireComplete'];
      const notificationMetaDataFields = [
        'primaryContacts',
        'secondaryContacts',
        'notifyContacts',
        'notificationCondition',
      ];

      const touchedFields: string[] = [];
      fields.forEach(field => {
        if (form.isFieldTouched(field)) touchedFields.push(field);
      });

      const existingSchedule = selectedMonitoring?.metaData?.schedule || [];
      const scheduleChanged = isScheduleUpdated({ existingSchedule, newSchedule: jobSchedule.schedule });
      if (scheduleChanged) touchedFields.push('schedule');

      if (touchedFields.length === 0) {
        return handleError('No changes detected');
      }

      let updatedData: any = { ...selectedMonitoring };
      if (touchedFields.includes('schedule')) updatedData.metaData.schedule = jobSchedule.schedule;

      const touchedAsrFields = touchedFields.filter(field => asrSpecificFields.includes(field));
      const touchedMetaDataFields = touchedFields.filter(field => metaDataFields.includes(field));
      const touchedNotificationMetaDataFields = touchedFields.filter(field =>
        notificationMetaDataFields.includes(field)
      );

      if (touchedAsrFields.length > 0) {
        let existingAsrSpecificMetaData = selectedMonitoring?.metaData?.asrSpecificMetaData || {};
        const upDatedAsrSpecificMetaData = form.getFieldsValue(touchedAsrFields);
        updatedData.metaData.asrSpecificMetaData = { ...existingAsrSpecificMetaData, ...upDatedAsrSpecificMetaData };
      }

      if (touchedMetaDataFields.length > 0) {
        if (touchedMetaDataFields.includes('expectedCompletionTime')) {
          const expectedCompletionTime = form.getFieldValue('expectedCompletionTime');
          updatedData.metaData.expectedCompletionTime = expectedCompletionTime.format('HH:mm');
        }

        if (touchedMetaDataFields.includes('expectedStartTime')) {
          const expectedStartTime = form.getFieldValue('expectedStartTime');
          updatedData.metaData.expectedStartTime = expectedStartTime.format('HH:mm');
        }

        if (touchedMetaDataFields.includes('requireComplete')) {
          updatedData.metaData.requireComplete = form.getFieldValue('requireComplete');
        }

        if (touchedMetaDataFields.includes('maxExecutionTime')) {
          updatedData.metaData.maxExecutionTime = form.getFieldValue('maxExecutionTime');
        }
      }

      if (touchedNotificationMetaDataFields.length > 0) {
        const existingNotificationMetaData = selectedMonitoring.metaData.notificationMetaData || {};
        const updatedNotificationMetaData = form.getFieldsValue(touchedNotificationMetaDataFields);
        updatedData.metaData.notificationMetaData = { ...existingNotificationMetaData, ...updatedNotificationMetaData };
      }

      const otherFields = fields.filter(
        field =>
          !asrSpecificFields.includes(field) &&
          !metaDataFields.includes(field) &&
          !notificationMetaDataFields.includes(field)
      );
      const otherFieldsValues = form.getFieldsValue(otherFields);
      const newOtherFields = { ...selectedMonitoring, ...otherFieldsValues };
      updatedData = { ...updatedData, ...newOtherFields };

      await jobMonitoringService.updateOne({ updatedData });

      setJobMonitorings((prev: any[]) =>
        prev.map((jobMonitoring: any) => {
          updatedData.approvalStatus = APPROVAL_STATUS.PENDING;
          updatedData.isActive = false;
          if (jobMonitoring.id === updatedData.id) return updatedData;
          return jobMonitoring;
        })
      );
      resetStates();
    } catch (err) {
      handleError('Failed to update job monitoring');
    } finally {
      setSavingJobMonitoring(false);
    }
  };

  const interpretRunWindow = (schedule: any[]) => {
    const runWindow = schedule[0].runWindow || '';
    if (runWindow === '') return '';
    if (runWindow === 'daily') return 'Anytime';
    return capitalize(runWindow);
  };

  const generateTagsForSchedule = (schedule: any[]) => {
    const tags: string[] = [];
    schedule.forEach((s: any) => {
      if (s.frequency === 'daily') tags.push(interpretRunWindow(schedule));
      if (s.frequency === 'weekly') {
        let tempData = `Every Week ${interpretRunWindow(schedule)} on`;
        s.days.forEach((d: any, i: number) => {
          tempData += ` ${getDayLabel(d)} ${i < s.days.length - 1 ? ',' : ''}`;
        });
        tags.push(tempData);
      }
      if (s.scheduleBy === 'dates') {
        let tempData = `Every month ${interpretRunWindow(schedule)}`;
        s.dates.forEach((d: any, i: number) => {
          tempData += ` ${getDateLabel(d)} ${i < s.dates.length - 1 ? ',' : ''}`;
        });
        tags.push(tempData);
      }
      if (s.scheduleBy === 'weeks-day') {
        let tempData = '';
        tempData += s.weeks.map((w: any) => ` ${getWeekLabel(w)}`).join(',');
        tempData += ` - ${getDayLabel(s.day)} each month`;
        tags.push(tempData);
      }
      if (s.scheduleBy === 'month-date') {
        let tempData = '';
        tempData += getMonthLabel(s.month);
        tempData += ` ${getDateLabel(s.date)}`;
        tags.push(tempData);
      }
      if (s.scheduleBy === 'week-day-month') {
        let tempData = '';
        tempData += getWeekLabel(s.week);
        tempData += ` ${getDayLabel(s.day)}`;
        tempData += ` of ${getMonthLabel(s.month)}`;
        tags.push(tempData);
      }
      if (s.frequency === 'cron') {
        tags.push(cronstrue.toString(s.cron));
      }
    });

    return tags;
  };

  return (
    <>
      <BreadCrumbs
        extraContent={
          <MonitoringActionButton
            label="Job Monitoring Actions"
            isReader={isReader}
            selectedRows={selectedRows}
            onAdd={handleAddJobMonitoringButtonClick}
            onBulkEdit={handleOpenBulkEdit}
            onBulkApproveReject={handleOpenApproveReject}
            onToggleFilters={handleToggleFilters}
            showBulkApproveReject={true}
            showFiltersToggle={true}
            filtersStorageKey={Constants.JM_FILTERS_VS_KEY}
            onBulkDelete={handleBulkDeleteSelectedJobMonitorings}
            onBulkStartPause={handleBulkStartPauseJobMonitorings}
          />
        }
      />
      <JobMonitoringFilters
        jobMonitorings={jobMonitorings}
        setFilters={setFilters}
        filters={filters}
        domains={domains}
        productCategories={productCategories}
        allProductCategories={allProductCategories}
        setProductCategories={setProductCategories}
        selectedDomain={selectedDomain}
        setSelectedDomain={setSelectedDomain}
        filtersVisible={filtersVisible}
        setFiltersVisible={setFiltersVisible}
        isReader={isReader}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        matchCount={matchCount}
      />
      <AddEditJobMonitoringModal
        displayAddJobMonitoringModal={displayAddJobMonitoringModal}
        setDisplayAddJobMonitoringModal={setDisplayAddJobMonitoringModal}
        handleSaveJobMonitoring={handleSaveJobMonitoring}
        handleUpdateJobMonitoring={handleUpdateJobMonitoring}
        form={form}
        intermittentScheduling={intermittentScheduling}
        setIntermittentScheduling={setIntermittentScheduling}
        setCompleteSchedule={setCompleteSchedule}
        completeSchedule={completeSchedule}
        cron={cron}
        setCron={setCron}
        cronMessage={cronMessage}
        setCronMessage={setCronMessage}
        erroneousScheduling={erroneousScheduling}
        clusters={clusters}
        setSelectedMonitoring={setSelectedMonitoring}
        monitoringScope={monitoringScope}
        setMonitoringScope={setMonitoringScope}
        savingJobMonitoring={savingJobMonitoring}
        jobMonitorings={jobMonitorings}
        setEditingData={setEditingData}
        isEditing={editingData?.isEditing}
        isDuplicating={duplicatingData?.isDuplicating}
        erroneousTabs={erroneousTabs}
        setErroneousTabs={setErroneousTabs}
        setErroneousScheduling={setErroneousScheduling}
        selectedCluster={selectedCluster}
        setSelectedCluster={setSelectedCluster}
        resetStates={resetStates}
        domains={domains}
        productCategories={productCategories}
        setSelectedDomain={setSelectedDomain}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
      <JobMonitoringTable
        jobMonitorings={filteredJobMonitoring}
        setJobMonitorings={setJobMonitorings}
        setDisplayMonitoringDetailsModal={setDisplayMonitoringDetailsModal}
        setSelectedMonitoring={setSelectedMonitoring}
        setDisplayAddJobMonitoringModal={setDisplayAddJobMonitoringModal}
        setEditingData={setEditingData}
        setDuplicatingData={setDuplicatingData}
        setDisplayAddRejectModal={setDisplayAddRejectModal}
        applicationId={applicationId}
        setSelectedRows={setSelectedRows}
        selectedRows={selectedRows}
        domains={domains}
        productCategories={productCategories}
        allProductCategories={allProductCategories}
        filteringJobs={filteringJobs}
        isReader={isReader}
        clusters={clusters}
        searchTerm={searchTerm}
      />
      {displayMonitoringDetailsModal && (
        <MonitoringDetailsModal
          monitoringTypeName={monitoringTypeName}
          displayMonitoringDetailsModal={displayMonitoringDetailsModal}
          setDisplayMonitoringDetailsModal={setDisplayMonitoringDetailsModal}
          selectedMonitoring={selectedMonitoring}
          setSelectedMonitoring={setSelectedMonitoring}
          clusters={clusters}
          domains={domains}
          productCategories={productCategories}>
          <Descriptions.Item label="Monitoring scope">
            {selectedMonitoring.monitoringScope?.replace(/([A-Z])/g, ' $1').trim()}
          </Descriptions.Item>
          {selectedMonitoring.jobName && (
            <Descriptions.Item label="Job name / pattern">{selectedMonitoring.jobName}</Descriptions.Item>
          )}
          {selectedMonitoring.metaData.schedule && (
            <Descriptions.Item label="Frequency">
              {capitalize(selectedMonitoring.metaData.schedule[0].frequency)}
            </Descriptions.Item>
          )}
          {selectedMonitoring.metaData.schedule && selectedMonitoring.metaData.schedule.length > 0 && (
            <Descriptions.Item label="Job Schedule">
              {generateTagsForSchedule(selectedMonitoring.metaData.schedule).map((s, i) => (
                <Tag key={i}>{s}</Tag>
              ))}
            </Descriptions.Item>
          )}

          {selectedMonitoring.metaData?.expectedStartTime && (
            <Descriptions.Item label="Expected Start Time">
              {selectedMonitoring.metaData.expectedStartTime}
            </Descriptions.Item>
          )}
          {selectedMonitoring.metaData?.expectedCompletionTime && (
            <Descriptions.Item label="Expected Completion Time">
              {selectedMonitoring.metaData.expectedCompletionTime}
            </Descriptions.Item>
          )}
          {selectedMonitoring.metaData?.maxExecutionTime && (
            <Descriptions.Item label="Max Execution Time ( in mins ) ">
              {selectedMonitoring.metaData.maxExecutionTime}
            </Descriptions.Item>
          )}
          <Descriptions.Item label="Require complete">
            {selectedMonitoring.metaData.requireComplete ? 'Yes' : 'No'}
          </Descriptions.Item>
        </MonitoringDetailsModal>
      )}

      {displayAddRejectModal && (
        <ApproveRejectModal
          visible={displayAddRejectModal}
          onCancel={() => setDisplayAddRejectModal(false)}
          selectedMonitoring={selectedMonitoring}
          setSelectedMonitoring={setSelectedMonitoring}
          selectedRows={selectedRows}
          setMonitoring={setJobMonitorings}
          monitoringTypeLabel={monitoringTypeName}
          evaluateMonitoring={jobMonitoringService.evaluate}
          onSubmit={(formData: any) =>
            handleJobMonitoringEvaluation({
              formData,
              jobMonitoringService,
              handleSuccess,
              handleError,
              applicationId,
              setJobMonitorings,
              setDisplayAddRejectModal,
            })
          }
        />
      )}

      {bulkEditModalVisibility && (
        <BulkUpdateModal
          bulkEditModalVisibility={bulkEditModalVisibility}
          setBulkEditModalVisibility={setBulkEditModalVisibility}
          jobMonitorings={jobMonitorings}
          setJobMonitorings={setJobMonitorings}
          selectedRows={selectedRows}
          setSelectedRows={setSelectedRows}
        />
      )}
    </>
  );
};

export default JobMonitoring;

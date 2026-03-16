import React, { useEffect } from 'react';
import { Card, Spin } from 'antd';
import { Loading3QuartersOutlined } from '@ant-design/icons';
import { allStepsToAddCluster } from '@/services/clusters.service';

interface AddClusterStepsProps {
  completedSteps: Array<{ step: number; message?: string }>;
  currentStep: number;
  setCurrentStep: (n: number) => void;
  completedAndRemainingSteps: Array<{ step: number; message?: string }>;
  setCompletedAndRemainingSteps: (arr: Array<{ step: number; message?: string }>) => void;
  errorEncountered: boolean;
}

const AddClusterSteps: React.FC<AddClusterStepsProps> = ({
  completedSteps,
  currentStep,
  setCurrentStep,
  completedAndRemainingSteps,
  setCompletedAndRemainingSteps,
  errorEncountered,
}) => {
  useEffect(() => {
    let lastExecutedStep = currentStep;

    completedSteps.forEach(completedStep => {
      if (completedStep.step !== 99) lastExecutedStep = completedStep.step;
    });

    setCurrentStep(lastExecutedStep);

    const indexOfLastCompletedStep = allStepsToAddCluster.findIndex(
      stepToAddCluster => stepToAddCluster.step === lastExecutedStep
    );

    const remainingSteps = allStepsToAddCluster.slice(indexOfLastCompletedStep + 1);

    const combinedSteps = [...completedSteps, ...remainingSteps];
    setCompletedAndRemainingSteps(combinedSteps);

    const combinedUniqueSteps = combinedSteps.reduce((acc: any[], step) => {
      if (!acc.find(item => item.step === step.step)) {
        acc.push(step);
      } else {
        acc = acc.map(item => (item.step === step.step ? step : item));
      }
      return acc;
    }, [] as any[]);

    setCompletedAndRemainingSteps(combinedUniqueSteps as Array<{ step: number; message?: string }>);
  }, [completedSteps]);

  return (
    <Card style={{ background: 'var(--dark)' }}>
      {completedAndRemainingSteps.map((completedAndRemainingStep, index) => {
        return (
          <div
            key={index}
            style={{
              color: messageColor({ stepNumberForThisIteration: completedAndRemainingStep?.step, currentStep }),
              display: 'flex',
              alignItems: 'center',
            }}>
            {displayLoadingIndicator({
              stepNumberForThisIteration: completedAndRemainingStep?.step,
              currentStep,
              errorEncountered,
            }) && (
              <span style={{ display: 'flex', alignItems: 'center' }}>
                <Spin
                  indicator={<Loading3QuartersOutlined spin style={{ color: 'var(--light)', fontSize: '12px' }} />}
                  size="small"
                />
                {'\u00A0\u00A0'}
              </span>
            )}
            <strong>
              {completedAndRemainingStep.step === 99 ? 'Error' : 'Step'}
              {completedAndRemainingStep.step === 99 ? '' : `${'\u00A0'}  ${completedAndRemainingStep.step}`}
              {'\u00A0'} : {'\u00A0'}
            </strong>{' '}
            {completedAndRemainingStep.message}
          </div>
        );
      })}
    </Card>
  );
};

export default AddClusterSteps;

const displayLoadingIndicator = ({
  stepNumberForThisIteration,
  currentStep,
  errorEncountered,
}: {
  stepNumberForThisIteration: number;
  currentStep: number;
  errorEncountered: boolean;
}) => {
  if (errorEncountered) {
    return false;
  } else if (stepNumberForThisIteration === currentStep) {
    return true;
  } else {
    return false;
  }
};

const messageColor = ({
  stepNumberForThisIteration,
  currentStep,
}: {
  stepNumberForThisIteration: number;
  currentStep: number;
}) => {
  if (stepNumberForThisIteration === 99) {
    return 'var(--danger)';
  } else if (currentStep > stepNumberForThisIteration) {
    return 'var(--success)';
  } else if (stepNumberForThisIteration === currentStep) {
    return 'var(--light)';
  } else {
    return 'var(--secondary)';
  }
};

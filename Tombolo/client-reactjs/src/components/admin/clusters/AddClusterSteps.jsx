import React, { useEffect } from 'react';
import { Card, Spin } from 'antd';
import { Loading3QuartersOutlined } from '@ant-design/icons';
import { allStepsToAddCluster } from '@/services/clusters.service';

function AddClusterSteps({
  completedSteps,
  currentStep,
  setCurrentStep,
  completedAndRemainingSteps,
  setCompletedAndRemainingSteps,
  errorEncountered,
}) {
  // Effects
  useEffect(() => {
    let lastExecutedStep = currentStep;

    // Find the last executed step
    completedSteps.forEach((completedStep) => {
      if (completedStep.step !== 99) {
        lastExecutedStep = completedStep.step;
      }
    });

    // Set the current step
    setCurrentStep(lastExecutedStep);

    // Find index of last executed step in allStepsToAddCluster
    const indexOfLastCompletedStep = allStepsToAddCluster.findIndex(
      (stepToAddCluster) => stepToAddCluster.step === lastExecutedStep
    );

    // Find the remaining steps
    const remainingSteps = allStepsToAddCluster.slice(indexOfLastCompletedStep + 1);

    // Combined steps - all executed plus remaining
    const combinedSteps = [...completedSteps, ...remainingSteps];
    setCompletedAndRemainingSteps(combinedSteps);

    // Iterate through combined steps , if you find item with duplicate step number, keep the one with larger index
    const combinedUniqueSteps = combinedSteps.reduce((acc, step) => {
      if (!acc.find((item) => item.step === step.step)) {
        acc.push(step);
      } else {
        acc = acc.map((item) => (item.step === step.step ? step : item));
      }
      return acc;
    }, []);

    // set unique set of completed and remaining steps
    setCompletedAndRemainingSteps(combinedUniqueSteps);
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
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                }}>
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
}

export default AddClusterSteps;

const displayLoadingIndicator = ({ stepNumberForThisIteration, currentStep, errorEncountered }) => {
  if (errorEncountered) {
    console.log('Error encountered - no need to load');
    return false;
  } else if (stepNumberForThisIteration === currentStep) {
    console.log('Matched show loading here');
    return true;
  } else {
    return false;
  }
};

const messageColor = ({ stepNumberForThisIteration, currentStep }) => {
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

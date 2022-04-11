import React, { useEffect, useState } from 'react';

import { Modal, Spin, Alert, Collapse } from 'antd/lib';
import { authHeader, handleError } from '../AuthHeader';

const { Panel } = Collapse;

const DeleteAssetModal = ({ asset, show, hide, onDelete }) => {
  const [isInDataflow, setIsInDataflow] = useState({ error: '', loading: false, data: [] });

  useEffect(() => {
    if (!show) return;
    (async () => {
      try {
        setIsInDataflow((prev) => ({ ...prev, loading: true, error: '' }));
        if (asset.type === 'Group') return; // dont do fetch data if we deleting folder

        const response = await fetch(`/api/dataflow/checkAssetDataflows?assetId=${asset.id}`, { headers: authHeader(), });
        if (!response.ok) handleError(response);

        const data = await response.json();    

        setIsInDataflow((prev) => ({ ...prev, data }));
      } catch (error) {
        console.log('-err failed to check asset in dataflows-------');
        console.dir({ error }, { depth: null });
        console.log('----------------------------------------------');

        setIsInDataflow((prev) => ({ ...prev, error: 'Something went wrong, can not delete asset' }));
      } finally {
        setIsInDataflow((prev) => ({ ...prev, loading: false }));
      }
    })();
  }, [show]);

  const getText = () => {
    if (isInDataflow.error) return isInDataflow.error;
    
    const groupDeleteText = `Deleting a group will delete all assets within a group and make them unusable in workflows  Are you sure you want to delete "${asset.name}" ?`;
    const assetDeleteText = `Deleting a ${ asset.type } will delete their metadata and make them unusable in workflows. Are you sure you want to delete "${ asset.title || asset.name }"?`
    
    if (isInDataflow.data.length > 0) {
      return (
        <>
          <Alert
            showIcon
            type="info"
            message={`${asset.type} can not be deleted at this time`}
            description="Asset is currently used in dataflows, please remove asset from all dataflows before deleting it."
          />
          <Collapse ghost>
            <Panel header="List of dataflows" key="1">
              <ul>
                {isInDataflow.data.map((flow) => {
                  console.log('flow', flow)
                  return <li key={flow.dataflowId}>{flow.title}</li>;
                })}
              </ul>
            </Panel>
          </Collapse>
        </>
      );
    } else {
      return (
        <Alert
          showIcon
          type="warning"
          message="Warning"
          description={asset.type === 'Group' ? groupDeleteText : assetDeleteText } // Groups dont have Title, use name instead
        />
      );
    }
  };
  
  const dissableOk = isInDataflow.data.length > 0 || isInDataflow.error || isInDataflow.loading;

  if (!show) return null;
  
  return (
    <Modal
      title={`Deleting "${asset.title || asset.name}"`}
      visible={show}
      onOk={() => onDelete(asset.id, asset.type)}
      okButtonProps={{ disabled: dissableOk }}
      onCancel={hide}
      closable={false}
      destroyOnClose={true}
    >
      <Spin tip="Loading..." spinning={isInDataflow.loading}>
        {getText()}
      </Spin>
    </Modal>
  );
};

export default DeleteAssetModal;

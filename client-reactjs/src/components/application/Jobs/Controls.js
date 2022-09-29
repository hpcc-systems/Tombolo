import { Button } from 'antd';
import React from 'react';
import DeleteAsset from '../../common/DeleteAsset';
import Text from '../../common/Text';

function Controls({
  form,
  state,
  props,
  setState,
  handleOk,
  executeJob,
  handleDelete,
  handleCancel,
  editingAllowed,
  modalControls = false,
}) {
  const { job, dataAltered, errors, confirmLoading, enableEdit, selectedTabPaneKey } = state;
  const { viewMode, selectedDataflow, displayingInModal, inTabView, isNew } = props;

  //Function to make fields editable
  const makeFieldsEditable = () => setState({ enableEdit: !enableEdit, editing: true });
  const switchToViewOnly = () => setState({ enableEdit: !enableEdit, editing: false, dataAltered: true });

  const getExecuteJobBtn = () => {
    // if opened in not LIVE dataflow - hide execute button;
    if (displayingInModal && !selectedDataflow?.versionId) return null;
    // if opened in LIVE dataflow - show execute button inside grey frame wrapper;
    if (displayingInModal && selectedDataflow?.versionId) {
      return (
        <div className="assetDetail-buttons-wrapper-modal">
          <Button disabled={!editingAllowed} type="primary" onClick={executeJob}>
            <Text text="Execute Job" />
          </Button>
        </div>
      );
    }
    // if opened in main view show button as dissabled (click edit to enable)
    return inTabView ? null : (
      <Button disabled={!editingAllowed || !enableEdit} type="primary" onClick={executeJob}>
        <Text text="Execute Job" />
      </Button>
    );
  };

  if (displayingInModal && !modalControls) return null;

  // show control buttons at the bottom of modal
  if (modalControls) {
    // if on "Schedule Tab" (#6) hide controls
    if (selectedTabPaneKey === '6') return null;
    // if read only show only execute button or nothing
    if (viewMode) return getExecuteJobBtn();
    // if not readonly show controls for editing and deleting;
  }

  return (
    <div className={displayingInModal ? 'assetDetail-buttons-wrapper-modal' : 'assetDetail-buttons-wrapper '}>
      <span style={{ float: 'left' }}>{getExecuteJobBtn()}</span>

      <span className="button-container">
        {!enableEdit && editingAllowed ? (
          <Button type="primary" onClick={makeFieldsEditable}>
            <Text text="Edit" />
          </Button>
        ) : null}

        {dataAltered && enableEdit ? (
          <Button onClick={switchToViewOnly}>
            <Text text="View Changes" />
          </Button>
        ) : null}

        {enableEdit ? (
          <span>
            {isNew ? null : (
              <DeleteAsset
                asset={{
                  id: job.id,
                  type: 'Job',
                  title: form.current.getFieldValue('title') || form.current.getFieldValue('name'),
                }}
                style={{ display: 'inline-block' }}
                onDelete={handleDelete}
                component={
                  <Button key="danger" type="danger">
                    {<Text text="Delete" />}
                  </Button>
                }
              />
            )}

            <span style={{ marginLeft: '25px' }}>
              {inTabView ? null : (
                <Button key="back" onClick={handleCancel} type="primary" ghost>
                  <Text text="Cancel" />
                </Button>
              )}
              <Button
                key="submit"
                htmlType="submit"
                disabled={!editingAllowed || errors}
                type="primary"
                loading={confirmLoading}
                onClick={handleOk}
                style={{ background: 'var(--success)' }}>
                <Text text="Save" />
              </Button>
            </span>
          </span>
        ) : (
          <span>
            {dataAltered ? (
              <span style={{ marginLeft: '25px' }}>
                {inTabView ? null : (
                  <Button key="back" onClick={handleCancel} type="primary" ghost>
                    <Text text="Cancel" />
                  </Button>
                )}
                <Button
                  key="submit"
                  disabled={!editingAllowed || errors}
                  type="primary"
                  loading={confirmLoading}
                  onClick={handleOk}
                  style={{ background: 'var(--success)' }}>
                  <Text text="Save" />
                </Button>
              </span>
            ) : (
              <span>
                {inTabView ? null : (
                  <Button key="back" onClick={handleCancel} type="primary" ghost>
                    <Text text="Cancel" />
                  </Button>
                )}
              </span>
            )}
          </span>
        )}
      </span>
    </div>
  );
}

export default Controls;

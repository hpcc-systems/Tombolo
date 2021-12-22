import { Form } from 'antd';
import React from 'react';
import GHCredentials from './GHCredentials';
import GHMainFile from './GHMainFile';
import GHSearchAndBranches from './GHSearchAndBranches';
import GHTable from './GHTable';

function GitHubForm({ form, enableEdit }) {
  const getAuthorizationHeaders = () => {
    const gitHubUserAccessToken = form?.current.getFieldValue(['gitHubFiles', 'gitHubUserAccessToken']);
    const headers = { Accept: 'application/json', 'Content-Type': 'application/json' };
    if (gitHubUserAccessToken) headers.Authorization = `token ${gitHubUserAccessToken}`;
    return headers;
  };

const updateFields= (prevValues, curValues) =>{
return prevValues.gitHubFiles?.reposList !== curValues.gitHubFiles?.reposList
};

  return (
    <>
      {enableEdit ? (
        <>
          <GHCredentials enableEdit={enableEdit} />
          <GHSearchAndBranches form={form} enableEdit={enableEdit} getAuthorizationHeaders={getAuthorizationHeaders} />
          <Form.Item shouldUpdate={updateFields} noStyle>
            {() => (
              <>
                <GHTable form={form} enableEdit={enableEdit} />
                <GHMainFile form={form} enableEdit={enableEdit} getAuthorizationHeaders={getAuthorizationHeaders} />
              </>
            )}
          </Form.Item>
        </>
      ) : null}
    </>
  );
}

export default GitHubForm;

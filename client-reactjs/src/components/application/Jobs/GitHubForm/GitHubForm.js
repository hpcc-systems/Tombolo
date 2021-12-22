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

  const repoList = form.current?.getFieldValue(['gitHubFiles', 'reposList']) || [];
  return (
    <>
      {enableEdit ? (
        <>
          <GHCredentials enableEdit={enableEdit} />
          <GHSearchAndBranches form={form} enableEdit={enableEdit} getAuthorizationHeaders={getAuthorizationHeaders} />
          <Form.Item hidden={repoList.length === 0} shouldUpdate wrapperCol={{ offset: 2, span: 11 }}>
            {() => <GHTable form={form} enableEdit={enableEdit} />}
          </Form.Item>
          <GHMainFile form={form} enableEdit={enableEdit} getAuthorizationHeaders={getAuthorizationHeaders} />
        </>
      ) : null}
    </>
  );
}

export default GitHubForm;

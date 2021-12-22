import React from 'react';
import GHCredentials from './GHCredentials';
import GHFormFields from './GHFormFields';

function GitHubForm({ form, enableEdit }) {
  return (
    <>
      {enableEdit ? (
        <>
          <GHCredentials enableEdit={enableEdit} />
          <GHFormFields form={form} enableEdit={enableEdit} />
        </>
      ) : null}
    </>
  );
}

export default GitHubForm;

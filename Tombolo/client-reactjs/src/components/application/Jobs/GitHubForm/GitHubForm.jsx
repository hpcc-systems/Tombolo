import React, { useState } from 'react';
import GHMainFile from './GHMainFile';
import GHRepoSelect from './GHRepoSelect';
import useGitHubProjectList from '@/hooks/useGitHubProjectList';

function GitHubForm({ form, enableEdit }) {
  const [projects] = useGitHubProjectList();
  const [ghBranchOrTag, setGhBrachOrTag] = useState('');

  return (
    <>
      <GHRepoSelect enableEdit={enableEdit} form={form} projects={projects.data} setGhBrachOrTag={setGhBrachOrTag} />
      <GHMainFile enableEdit={enableEdit} form={form} branchOrTagName={ghBranchOrTag} />
    </>
  );
}

export default GitHubForm;

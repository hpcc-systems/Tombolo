import { useEffect, useState } from 'react';
import { authHeader, handleError } from '../components/common/AuthHeader';
import { message } from 'antd';
import { useSelector } from 'react-redux';

const useGitHubProjectList = () => {
  const [projects, setProjects] = useState({ error: '', loading: false, data: [] });
  const applicationId = useSelector((state) => state.applicationReducer?.application?.applicationId);

  useEffect(() => {
    (async () => {
      try {
        if (!applicationId) throw new Error('Can not find applicationId');

        setProjects((prev) => ({ ...prev, loading: true, error: '' }));
        const response = await fetch(`/api/gh_projects?application_id=${applicationId}`, {
          headers: authHeader(),
        });

        if (!response.ok) handleError(response);
        const projectsList = await response.json();
        const projectsWithKeys = projectsList.map((project, index) => ({ ...project, key: index })); // we need keys for editing

        setProjects((prev) => ({ ...prev, loading: false, data: projectsWithKeys }));
      } catch (error) {
        console.log('-error-/api/gh_projects----------------------------------------');
        console.dir({ error }, { depth: null });
        console.log('------------------------------------------');
        setProjects((prev) => ({ ...prev, loading: false, error: error.message }));
        message.error(error.message);
      }
    })();
  }, []);

  return [projects, setProjects];
};

export default useGitHubProjectList;

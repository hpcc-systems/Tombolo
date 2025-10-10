import { useEffect, useState } from 'react';
import { authHeader, handleError as authHandleError } from '../components/common/AuthHeader';
import { handleError } from '@/components/common/handleResponse';
import { useSelector } from 'react-redux';

const useGitHubProjectList = () => {
  const [projects, setProjects] = useState({ error: '', loading: false, data: [] });
  const applicationId = useSelector((state) => state.application?.application?.applicationId);

  useEffect(() => {
    (async () => {
      try {
        if (!applicationId) throw new Error('Can not find applicationId');

        setProjects((prev) => ({ ...prev, loading: true, error: '' }));
        const response = await fetch(`/api/gh_projects?application_id=${applicationId}`, {
          headers: authHeader(),
        });

        if (!response.ok) authHandleError(response);
        const projectsList = await response.json();
        const projectsWithKeys = projectsList.map((project, index) => ({ ...project, key: index })); // we need keys for editing

        setProjects((prev) => ({ ...prev, loading: false, data: projectsWithKeys }));
      } catch (error) {
        setProjects((prev) => ({ ...prev, loading: false, error: error.message }));
        handleError(error.message);
      }
    })();
  }, []);

  return [projects, setProjects];
};

export default useGitHubProjectList;

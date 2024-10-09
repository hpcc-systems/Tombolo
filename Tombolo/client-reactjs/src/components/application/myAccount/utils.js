import { authHeader, handleError } from '../../common/AuthHeader';

export const changeBasicUserPassword = async (values) => {
  const payload = {
    method: 'PATCH',
    headers: authHeader(),
    body: JSON.stringify(values),
  };

  //get user from local storage
  const user = JSON.parse(localStorage.getItem('user'));

  const response = await fetch(`/api/user/change-password/${user?.id}`, payload);
  if (!response.ok) {
    handleError(response);
    return null;
  }

  const data = await response.json();

  return data;
};

export const changeBasicUserInfo = async (values) => {
  const payload = {
    method: 'PATCH',
    headers: authHeader(),
    body: JSON.stringify(values),
  };

  //get user from local storage
  const user = JSON.parse(localStorage.getItem('user'));

  const response = await fetch(`/api/user/update/${user?.id}`, payload);
  if (!response.ok) {
    handleError(response);
    return null;
  }

  const data = await response.json();

  if (data) {
    //update user in local storage
    localStorage.setItem('user', JSON.stringify(data));
  }

  return data;
};

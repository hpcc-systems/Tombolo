const getUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user'));
  } catch {
    return null;
  }
};

const setUser = user => {
  try {
    //if typeof user is json, convert to string
    if (typeof user === 'object') {
      user = JSON.stringify(user);
    }
    localStorage.setItem('user', user);
    return true;
  } catch {
    return false;
  }
};

export { getUser, setUser };

export const roleStringBuilder = (roles = []) => {
  let roleString = '';
  roles.forEach((role, index) => {
    roleString += role.role_details.roleName;
    if (index < roles.length - 1) {
      roleString += ', ';
    }
  });
  return roleString;
};

export const deviceInfoStringBuilder = (deviceInfo) => {
  if (!deviceInfo) {
    return 'Unknown';
  }

  const returnString = ` ${deviceInfo.os ? deviceInfo.os : 'Unknown'}/${
    deviceInfo.browser ? deviceInfo.browser : 'Unknown'
  }`;

  return returnString;
};

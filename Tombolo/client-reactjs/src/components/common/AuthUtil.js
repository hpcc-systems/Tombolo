// const { Constants } = require('./Constants');
// let hasPermissionToViewPII = false;

// export function hasAdminRole(user) {
//   if (process.env.REACT_APP_APP_AUTH_METHOD === 'azure_ad') {
//     return user.roles && user.roles.some((role) => role === Constants.TOMBOLO_ADMIN);
//   }
//   return user.role && user.role.filter((role) => role.name == Constants.TOMBOLO_ADMIN).length > 0;
// }

// export function hasEditPermission(user) {
//   if (process.env.REACT_APP_APP_AUTH_METHOD === 'azure_ad') {
//     if (user.roles) {
//       user.roles.forEach((role) => {
//         if (role === Constants.TOMBOLO_ADMIN) {
//           hasPermissionToViewPII = true;
//         }
//       });
//     }
//     return (
//       user.roles && user.roles.some((role) => role === Constants.TOMBOLO_ADMIN || role === Constants.TOMBOLO_CREATOR)
//     );
//   }
//   return (
//     user.role &&
//     user.role.filter((role) => role.name == Constants.TOMBOLO_ADMIN || role.name == Constants.TOMBOLO_CREATOR).length >
//       0
//   );
// }

// export function canViewPII(user) {
//   if (user.role) {
//     user.role.forEach((role) => {
//       if (role.permissions && 'View PII' in role.permissions && role.permissions['View PII'] === 'allow') {
//         hasPermissionToViewPII = true;
//         return;
//       }
//     });
//   }
//   return hasPermissionToViewPII;
// }

export const getRoleNameArray = () => {
  try {
    //get role Array to control options available in actions
    const user = JSON.parse(localStorage.getItem('user'));

    if (!user) {
      return [];
    }
    let roles = [];
    //roleName is nested inside of role_details in the role array, build a list of roles
    roles = user?.roles?.map((role) => role.role_details.roleName);

    return roles;
  } catch (e) {
    console.log(e);
    return [];
  }
};

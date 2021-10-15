import { Constants } from './Constants';

export function hasAdminRole(user) {
	// return (user.role && user.role.filter(role => role.name == Constants.TOMBOLO_ADMIN).length > 0)
  console.log("<<<<<<<<<<<<<<<<<<<<<<< Auth Util", user)
}

export function hasEditPermission(user) {
	// return (user.role && user.role.filter(role => (role.name == Constants.TOMBOLO_ADMIN || role.name == Constants.TOMBOLO_CREATOR)).length > 0)
   console.log("<<<<<<<<<<<<<<<<<<<<<<< Auth Util", user)
  
}

export function canViewPII(user) {
  let canViewPII = false;
  if(user.role) {
    user.role.forEach((role) => {
      if(role.permissions && 'View PII' in role.permissions && role.permissions['View PII'] === 'allow') {
        canViewPII = true;
        return;
      }
    })
  }
  return canViewPII;
}
import { Constants } from './Constants';

export function hasAdminRole(user) {
	return (user.role && user.role.filter(role => role.name == Constants.TOMBOLO_ADMIN).length > 0)
}

export function hasEditPermission(user) {
	return (user.role && user.role.filter(role => (role.name == Constants.TOMBOLO_ADMIN || role.name == Constants.TOMBOLO_CREATOR)).length > 0)
}

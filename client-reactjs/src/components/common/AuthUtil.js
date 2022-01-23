require("dotenv").config();
const { Constants } = require("./Constants");

export function hasAdminRole(user) {
  if (process.env.REACT_APP_APP_AUTH_METHOD === "azure_ad") {
    return (
      user.roles && user.roles.some((role) => role === Constants.TOMBOLO_ADMIN)
    );
  }
  return (
    user.role &&
    user.role.filter((role) => role.name == Constants.TOMBOLO_ADMIN).length > 0
  );
}

export function hasEditPermission(user) {
  if (process.env.REACT_APP_APP_AUTH_METHOD === "azure_ad") {
    return (
      user.roles && user.roles.some((role) => role === Constants.TOMBOLO_ADMIN || role === Constants.TOMBOLO_CREATOR)
    );
  }
  return (
    user.role &&
    user.role.filter(
      (role) =>
        role.name == Constants.TOMBOLO_ADMIN ||
        role.name == Constants.TOMBOLO_CREATOR
    ).length > 0
  );
}

export function canViewPII(user) {
  let canViewPII = false;
  if (user.role) {
    user.role.forEach((role) => {
      if (
        role.permissions &&
        "View PII" in role.permissions &&
        role.permissions["View PII"] === "allow"
      ) {
        canViewPII = true;
        return;
      }
    });
  }
  return canViewPII;
}
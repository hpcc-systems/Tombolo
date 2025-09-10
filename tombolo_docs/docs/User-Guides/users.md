---
sidebar_position: 9
label: "Users"
title: "Users"
---

# Users

Tombolo has a robust set of features that allow instance owners and admins to control who can access the instance, applications within the instance, and create, edit, view, or delete resources. We also offer two different methods for users to register their accounts depending on your team's desired configuration.

## Registration and Authentication

Tombolo currently offer's two methods to register and authenticate your users, traditional, and Azure AD. In order to enable or disable either of these methods, please see information about how to set up your environment files in the [Configurations Page](/docs/Install/Configurations).

### Traditional

Traditional Authentication and Registration uses Tombolo's built in Authentication and Registration resources. Users will register their account on the register page, and then be sent a confirmation email that they will need to with a confirmation link to confirm their email address that must be accessed within 24 hours. They are free to set their own password, first name, and last name to be associated with the account.

In order to prevent spam, we have limited the ability to receive a confirmation email to one email per account each 24 hour period. If this period elapses, the user will be removed from the database and will be forced to re-register their account.

Once succesfully registered and verified, users will log in with their email and password that they have set.

### Azure AD

Azure AD allows users to Authenticate using their Microsoft account. For this method, users will not have a seperate "register" screen, simply a login button that redirects to a Microsoft Authentication page. Once logged in, the users email will be assumed to be verified and Tombolo will register their account with the details provided by the Microsoft account that they authenticated with, including first name, last name, and email address.

## Authorization and Roles

Once users are succesfully Registered and Authenticated, they will need to be granted Authorization to the set of applications and features desired to be granted to them. If they do not have both a Role and an Application, they will be presented with a screen that allows them to send an email message to the contact email provided by the owner in the initial experience Wizard upon first launch, requesting access.

If a request for authorization is received, somebody with the Owner or Administrator role will need to access the User Management screen on the Left Navigation, and grant the user a role and application.

Tombolo currently offer 4 standard roles out of the box. Users do not have the ability to change their own role, unless they have the Administrator or Owner role.

### Owner

Owners have access to all functionalities inside of Tombolo, including the ability to remove other Owner's roles if multiple exist. They also get access to every application inside of the instance.

### Administrator

Administrators also have access to all functionalities inside of Tombolo. The only capability that an administrator does not have is the ability to unassign or change the Owner role on users. As with Owners, they also get access to every application inside of the instance.

### Contributor

Contributors have access to view, create, edit, and delete all types of monitoring and dashboards. They also only have access to the applications that are assigned to them by the Administrator's or Owner's.

### Reader

Contributors have access to view all types of monitoring and dashboards. They also only have access to the applications that are assigned to them by the Administrator's or Owner's.

"use strict";(self.webpackChunktombolo_docs=self.webpackChunktombolo_docs||[]).push([[239],{7662:(e,t,n)=>{n.r(t),n.d(t,{assets:()=>l,contentTitle:()=>a,default:()=>h,frontMatter:()=>s,metadata:()=>r,toc:()=>d});var i=n(4848),o=n(8453);const s={sidebar_position:9,label:"Users",title:"Users",pagination_prev:null,pagination_next:null},a="Users",r={id:"User-Guides/users",title:"Users",description:"Tombolo has a robust set of features that allow instance owners and admins to control who can access the instance, applications within the instance, and create, edit, view, or delete resources. We also offer two different methods for users to register their accounts depending on your team's desired configuration.",source:"@site/docs/User-Guides/users.md",sourceDirName:"User-Guides",slug:"/User-Guides/users",permalink:"/Tombolo/docs/User-Guides/users",draft:!1,unlisted:!1,tags:[],version:"current",sidebarPosition:9,frontMatter:{sidebar_position:9,label:"Users",title:"Users",pagination_prev:null,pagination_next:null},sidebar:"tutorialSidebar"},l={},d=[{value:"Registration and Authentication",id:"registration-and-authentication",level:2},{value:"Traditional",id:"traditional",level:3},{value:"Azure AD",id:"azure-ad",level:3},{value:"Authorization and Roles",id:"authorization-and-roles",level:2},{value:"Owner",id:"owner",level:3},{value:"Administrator",id:"administrator",level:3},{value:"Contributor",id:"contributor",level:3},{value:"Reader",id:"reader",level:3}];function c(e){const t={a:"a",h1:"h1",h2:"h2",h3:"h3",p:"p",...(0,o.R)(),...e.components};return(0,i.jsxs)(i.Fragment,{children:[(0,i.jsx)(t.h1,{id:"users",children:"Users"}),"\n",(0,i.jsx)(t.p,{children:"Tombolo has a robust set of features that allow instance owners and admins to control who can access the instance, applications within the instance, and create, edit, view, or delete resources. We also offer two different methods for users to register their accounts depending on your team's desired configuration."}),"\n",(0,i.jsx)(t.h2,{id:"registration-and-authentication",children:"Registration and Authentication"}),"\n",(0,i.jsxs)(t.p,{children:["Tombolo currently offer's two methods to register and authenticate your users, traditional, and Azure AD. In order to enable or disable either of these methods, please see information about how to set up your environment files in the ",(0,i.jsx)(t.a,{href:"/docs/Install/Configurations",children:"Configurations Page"}),"."]}),"\n",(0,i.jsx)(t.h3,{id:"traditional",children:"Traditional"}),"\n",(0,i.jsx)(t.p,{children:"Traditional Authentication and Registration uses Tombolo's built in Authentication and Registration resources. Users will register their account on the register page, and then be sent a confirmation email that they will need to with a confirmation link to confirm their email address that must be accessed within 24 hours. They are free to set their own password, first name, and last name to be associated with the account."}),"\n",(0,i.jsx)(t.p,{children:"In order to prevent spam, we have limited the ability to receive a confirmation email to one email per account each 24 hour period. If this period elapses, the user will be removed from the database and will be forced to re-register their account."}),"\n",(0,i.jsx)(t.p,{children:"Once succesfully registered and verified, users will log in with their email and password that they have set."}),"\n",(0,i.jsx)(t.h3,{id:"azure-ad",children:"Azure AD"}),"\n",(0,i.jsx)(t.p,{children:'Azure AD allows users to Authenticate using their Microsoft account. For this method, users will not have a seperate "register" screen, simply a login button that redirects to a Microsoft Authentication page. Once logged in, the users email will be assumed to be verified and Tombolo will register their account with the details provided by the Microsoft account that they authenticated with, including first name, last name, and email address.'}),"\n",(0,i.jsx)(t.h2,{id:"authorization-and-roles",children:"Authorization and Roles"}),"\n",(0,i.jsx)(t.p,{children:"Once users are succesfully Registered and Authenticated, they will need to be granted Authorization to the set of applications and features desired to be granted to them. If they do not have both a Role and an Application, they will be presented with a screen that allows them to send an email message to the contact email provided by the owner in the initial experience Wizard upon first launch, requesting access."}),"\n",(0,i.jsx)(t.p,{children:"If a request for authorization is received, somebody with the Owner or Administrator role will need to access the User Management screen on the Left Navigation, and grant the user a role and application."}),"\n",(0,i.jsx)(t.p,{children:"Tombolo currently offer 4 standard roles out of the box. Users do not have the ability to change their own role, unless they have the Administrator or Owner role."}),"\n",(0,i.jsx)(t.h3,{id:"owner",children:"Owner"}),"\n",(0,i.jsx)(t.p,{children:"Owners have access to all functionalities inside of Tombolo, including the ability to remove other Owner's roles if multiple exist. They also get access to every application inside of the instance."}),"\n",(0,i.jsx)(t.h3,{id:"administrator",children:"Administrator"}),"\n",(0,i.jsx)(t.p,{children:"Administrators also have access to all functionalities inside of Tombolo. The only capability that an administrator does not have is the ability to unassign or change the Owner role on users. As with Owners, they also get access to every application inside of the instance."}),"\n",(0,i.jsx)(t.h3,{id:"contributor",children:"Contributor"}),"\n",(0,i.jsx)(t.p,{children:"Contributors have access to view, create, edit, and delete all types of monitoring, workflows, assets, and dashboards. They also only have access to the applications that are assigned to them by the Administrator's or Owner's."}),"\n",(0,i.jsx)(t.h3,{id:"reader",children:"Reader"}),"\n",(0,i.jsx)(t.p,{children:"Contributors have access to view all types of monitoring, workflows, assets, and dashboards. They also only have access to the applications that are assigned to them by the Administrator's or Owner's."})]})}function h(e={}){const{wrapper:t}={...(0,o.R)(),...e.components};return t?(0,i.jsx)(t,{...e,children:(0,i.jsx)(c,{...e})}):c(e)}},8453:(e,t,n)=>{n.d(t,{R:()=>a,x:()=>r});var i=n(6540);const o={},s=i.createContext(o);function a(e){const t=i.useContext(s);return i.useMemo((function(){return"function"==typeof e?e(t):{...t,...e}}),[t,e])}function r(e){let t;return t=e.disableParentContext?"function"==typeof e.components?e.components(o):e.components||o:a(e.components),i.createElement(s.Provider,{value:t},e.children)}}}]);
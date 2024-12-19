"use strict";(self.webpackChunktombolo_docs=self.webpackChunktombolo_docs||[]).push([[948],{8913:(e,n,i)=>{i.r(n),i.d(n,{assets:()=>a,contentTitle:()=>r,default:()=>f,frontMatter:()=>s,metadata:()=>l,toc:()=>c});var t=i(4848),o=i(8453);const s={sidebar_position:4,label:"Superfiles Monitoring",title:"Superfiles Monitoring",pagination_prev:null,pagination_next:null},r=void 0,l={id:"User-Guides/monitoring/SuperFilesMonitoring",title:"Superfiles Monitoring",description:"Superfiles are collections of files inside of an HPCC cluster, and can be thought of as similar to a folder inside of an operating system. Tombolo currently provides a few different monitoring paramters for these collections of files.",source:"@site/docs/User-Guides/monitoring/SuperFilesMonitoring.md",sourceDirName:"User-Guides/monitoring",slug:"/User-Guides/monitoring/SuperFilesMonitoring",permalink:"/Tombolo/fr/docs/User-Guides/monitoring/SuperFilesMonitoring",draft:!1,unlisted:!1,tags:[],version:"current",sidebarPosition:4,frontMatter:{sidebar_position:4,label:"Superfiles Monitoring",title:"Superfiles Monitoring",pagination_prev:null,pagination_next:null},sidebar:"tutorialSidebar"},a={},c=[];function d(e){const n={a:"a",li:"li",ol:"ol",p:"p",...(0,o.R)(),...e.components};return(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)(n.p,{children:"Superfiles are collections of files inside of an HPCC cluster, and can be thought of as similar to a folder inside of an operating system. Tombolo currently provides a few different monitoring paramters for these collections of files."}),"\n",(0,t.jsxs)(n.ol,{children:["\n",(0,t.jsxs)(n.li,{children:["\n",(0,t.jsxs)(n.p,{children:["Search File - This can be a singular superfile name or use any eligible ",(0,t.jsx)(n.a,{href:"/docs/User-Guides/Wildcards",children:"wildcards"})," to select anything matching a pattern."]}),"\n"]}),"\n",(0,t.jsxs)(n.li,{children:["\n",(0,t.jsx)(n.p,{children:"Cron - The schedule by which tombolo will run the monitoring to check the user provided parameters."}),"\n"]}),"\n",(0,t.jsxs)(n.li,{children:["\n",(0,t.jsx)(n.p,{children:"Notify When -"}),"\n",(0,t.jsxs)(n.p,{children:["a. File Size Changes - When the size of the superfile, which is the sum of the size of all of the logical files inside of it, changes from the last detected value.",(0,t.jsx)("br",{}),"\nb. Total size not in range - When the size of the superfile is not in the specified range",(0,t.jsx)("br",{}),"\nc. Subfile count changes - When the number of files within the superfile changes",(0,t.jsx)("br",{}),"\nd. Subfile count not in range - When the number of files within the superfile is not in range",(0,t.jsx)("br",{}),"\ne. Update interval not followed - When the file doesn't recieve an update during the specified interval from it's last detected update.",(0,t.jsx)("br",{}),"\nf. File deleted - When the superfile is deleted",(0,t.jsx)("br",{})]}),"\n"]}),"\n",(0,t.jsxs)(n.li,{children:["\n",(0,t.jsx)(n.p,{children:"Notification Channel - this allows users to provide a set of MS Teams webhooks and/or emails that will be notified when the user provided parameters are met."}),"\n"]}),"\n"]})]})}function f(e={}){const{wrapper:n}={...(0,o.R)(),...e.components};return n?(0,t.jsx)(n,{...e,children:(0,t.jsx)(d,{...e})}):d(e)}},8453:(e,n,i)=>{i.d(n,{R:()=>r,x:()=>l});var t=i(6540);const o={},s=t.createContext(o);function r(e){const n=t.useContext(s);return t.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function l(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(o):e.components||o:r(e.components),t.createElement(s.Provider,{value:n},e.children)}}}]);
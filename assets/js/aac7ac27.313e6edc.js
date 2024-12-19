"use strict";(self.webpackChunktombolo_docs=self.webpackChunktombolo_docs||[]).push([[390],{8216:(e,o,n)=>{n.r(o),n.d(o,{assets:()=>a,contentTitle:()=>s,default:()=>h,frontMatter:()=>i,metadata:()=>l,toc:()=>c});var t=n(4848),r=n(8453);const i={sidebar_position:4,pagination_prev:null,pagination_next:null},s="Uninstall Instructions",l={id:"Install/Uninstall",title:"Uninstall Instructions",description:"There are three potential steps that need to be completed in order to remove Tombolo from your system. It is easiest to follow the order given here.",source:"@site/docs/Install/Uninstall.md",sourceDirName:"Install",slug:"/Install/Uninstall",permalink:"/Tombolo/docs/Install/Uninstall",draft:!1,unlisted:!1,tags:[],version:"current",sidebarPosition:4,frontMatter:{sidebar_position:4,pagination_prev:null,pagination_next:null},sidebar:"tutorialSidebar"},a={},c=[{value:"Docker",id:"docker",level:2},{value:"Automated using Git Repository",id:"automated-using-git-repository",level:3},{value:"Manual",id:"manual",level:3},{value:"MySQL",id:"mysql",level:2},{value:"Git",id:"git",level:2}];function d(e){const o={a:"a",code:"code",h1:"h1",h2:"h2",h3:"h3",li:"li",ol:"ol",p:"p",pre:"pre",...(0,r.R)(),...e.components};return(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)(o.h1,{id:"uninstall-instructions",children:"Uninstall Instructions"}),"\n",(0,t.jsx)(o.p,{children:"There are three potential steps that need to be completed in order to remove Tombolo from your system. It is easiest to follow the order given here."}),"\n",(0,t.jsxs)(o.ol,{children:["\n",(0,t.jsxs)(o.li,{children:["Stop and remove any ",(0,t.jsx)(o.a,{href:"#docker",children:"Docker Containers"}),"."]}),"\n",(0,t.jsxs)(o.li,{children:["Delete or drop the ",(0,t.jsx)(o.a,{href:"#mysql",children:"MySQL Database"})]}),"\n",(0,t.jsxs)(o.li,{children:["Remove your local ",(0,t.jsx)(o.a,{href:"#git",children:"git repository"}),"."]}),"\n"]}),"\n",(0,t.jsx)(o.h2,{id:"docker",children:"Docker"}),"\n",(0,t.jsxs)(o.p,{children:["If you have chosen to build and run Tombolo inside of a Docker, you will need to stop and remove your local containers. If you still have the local copy of your git repository installed, use the ",(0,t.jsx)(o.a,{href:"#automated-using-git-repository",children:"Automated"})," instructions. If you have removed them, you can still remove them using the ",(0,t.jsx)(o.a,{href:"#manual",children:"Manual"})," instructions below."]}),"\n",(0,t.jsx)(o.h3,{id:"automated-using-git-repository",children:"Automated using Git Repository"}),"\n",(0,t.jsx)(o.p,{children:"Run the following commands from the root directory of your installation in your preferred terminal or integrated IDE"}),"\n",(0,t.jsx)(o.pre,{children:(0,t.jsx)(o.code,{className:"language-bash",children:"cd Tombolo\n"})}),"\n",(0,t.jsx)(o.pre,{children:(0,t.jsx)(o.code,{className:"language-bash",children:"docker-compose down -v\n"})}),"\n",(0,t.jsxs)(o.p,{children:["The ",(0,t.jsx)(o.code,{children:"cd"})," command changes the directory you're working inside of."]}),"\n",(0,t.jsxs)(o.p,{children:["The ",(0,t.jsx)(o.code,{children:"docker-compose down -v"})," command stops, and removes any containers that were created utilizing the local docker-compose file. More information can be found in dockers ",(0,t.jsx)(o.a,{href:"https://docs.docker.com/reference/cli/docker/compose/down/",children:"documentation"}),"."]}),"\n",(0,t.jsx)(o.h3,{id:"manual",children:"Manual"}),"\n",(0,t.jsx)(o.p,{children:"If utilizing the Docker CLI, simply run the commands below from an integrated terminal or IDE."}),"\n",(0,t.jsx)(o.pre,{children:(0,t.jsx)(o.code,{className:"language-bash",children:"docker ps\n"})}),"\n",(0,t.jsx)(o.p,{children:"This command will list all of your running containers and their ID's. Find the ID's of the related containers your would like to remove and run the following command with each ID."}),"\n",(0,t.jsx)(o.pre,{children:(0,t.jsx)(o.code,{className:"language-bash",children:"docker rm -f -v {container id}\n"})}),"\n",(0,t.jsxs)(o.p,{children:["More information can be found in the ",(0,t.jsx)(o.a,{href:"https://docs.docker.com/reference/cli/docker/container/rm/",children:"docker documentations"}),"."]}),"\n",(0,t.jsx)(o.p,{children:"If you are utilizing the Docker Desktop, or another GUI, please refer to the GUI or their associated documentation to stop and remove the containers."}),"\n",(0,t.jsx)(o.h2,{id:"mysql",children:"MySQL"}),"\n",(0,t.jsx)(o.p,{children:"If you still have your local copy of the Tombolo Git Repository in your system, we have provided a simple command to drop and remove the database."}),"\n",(0,t.jsx)(o.p,{children:"Run the following commands from the root directory of your git repository in your preferred terminal or integrated IDE"}),"\n",(0,t.jsx)(o.pre,{children:(0,t.jsx)(o.code,{className:"language-bash",children:"cd Tombolo/server\n"})}),"\n",(0,t.jsx)(o.pre,{children:(0,t.jsx)(o.code,{className:"language-bash",children:"npm run dropSchema\n"})}),"\n",(0,t.jsxs)(o.p,{children:["The ",(0,t.jsx)(o.code,{children:"cd"})," command changes the directory you're working with."]}),"\n",(0,t.jsxs)(o.p,{children:["The ",(0,t.jsx)(o.code,{children:"npm run dropSchema"})," command will run the associated command located in the package.json necessary to delete the database on your local system."]}),"\n",(0,t.jsxs)(o.p,{children:["If you do not have your local copy of the Tombolo Git Repository, and do not wish to place it back on your system, you will need to drop your database manually. ",(0,t.jsx)(o.a,{href:"https://www.mysqltutorial.org/mysql-basics/mysql-drop-database/",children:"This Link"})," may be of assistance, walking you through options utilizing MySQL Workbench, or the MySQL CLI, depending on your system."]}),"\n",(0,t.jsx)(o.h2,{id:"git",children:"Git"}),"\n",(0,t.jsx)(o.p,{children:"Simply delete the files and folders from your installation location."}),"\n",(0,t.jsx)(o.p,{children:"If you wish to keep the files and folders, but remove the git repository, run the following command from the root directory of your repository."}),"\n",(0,t.jsx)(o.pre,{children:(0,t.jsx)(o.code,{className:"language-bash",children:"rm -rf .git*\n"})}),"\n",(0,t.jsxs)(o.p,{children:["The ",(0,t.jsx)(o.code,{children:"rm -rf .git*"})," command will remove any file or folder that begins with .git, including the .gitignore, .gitmodules, .git, etc."]})]})}function h(e={}){const{wrapper:o}={...(0,r.R)(),...e.components};return o?(0,t.jsx)(o,{...e,children:(0,t.jsx)(d,{...e})}):d(e)}},8453:(e,o,n)=>{n.d(o,{R:()=>s,x:()=>l});var t=n(6540);const r={},i=t.createContext(r);function s(e){const o=t.useContext(i);return t.useMemo((function(){return"function"==typeof e?e(o):{...o,...e}}),[o,e])}function l(e){let o;return o=e.disableParentContext?"function"==typeof e.components?e.components(r):e.components||r:s(e.components),t.createElement(i.Provider,{value:o},e.children)}}}]);
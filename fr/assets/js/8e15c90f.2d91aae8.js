"use strict";(self.webpackChunktombolo_docs=self.webpackChunktombolo_docs||[]).push([[558],{2091:(e,t,n)=>{n.r(t),n.d(t,{assets:()=>l,contentTitle:()=>o,default:()=>h,frontMatter:()=>r,metadata:()=>a,toc:()=>d});var s=n(4848),i=n(8453);const r={sidebar_position:2,pagination_next:null,pagination_prev:null,title:"Backend Testing"},o="Backend Testing",a={id:"Developer/Testing",title:"Backend Testing",description:"Tombolo uses Jest and Supertest for its testing framework. Jest provides a flexible environment for writing and running tests, while Supertest allows us to easily test our API endpoints. By combining these tools, we ensure our tests are both reliable and effective.",source:"@site/docs/Developer/Testing.md",sourceDirName:"Developer",slug:"/Developer/Testing",permalink:"/Tombolo/fr/docs/Developer/Testing",draft:!1,unlisted:!1,tags:[],version:"current",sidebarPosition:2,frontMatter:{sidebar_position:2,pagination_next:null,pagination_prev:null,title:"Backend Testing"},sidebar:"tutorialSidebar"},l={},d=[{value:"Starting Tests",id:"starting-tests",level:3},{value:"Adding Tests",id:"adding-tests",level:3},{value:"Comprehensive Test Lifecycle",id:"comprehensive-test-lifecycle",level:3},{value:"Pull Request Guidelines",id:"pull-request-guidelines",level:3}];function c(e){const t={code:"code",h1:"h1",h3:"h3",hr:"hr",li:"li",ol:"ol",p:"p",pre:"pre",strong:"strong",...(0,i.R)(),...e.components};return(0,s.jsxs)(s.Fragment,{children:[(0,s.jsx)(t.h1,{id:"backend-testing",children:"Backend Testing"}),"\n",(0,s.jsx)(t.p,{children:"Tombolo uses Jest and Supertest for its testing framework. Jest provides a flexible environment for writing and running tests, while Supertest allows us to easily test our API endpoints. By combining these tools, we ensure our tests are both reliable and effective."}),"\n",(0,s.jsx)(t.p,{children:"Our testing strategy is designed to closely resemble the production environment. This helps us catch potential issues early, ensuring the stability and consistency of our application as we continue development."}),"\n",(0,s.jsxs)(t.p,{children:["Before running or writing tests, please add the following environment variables to the backend ",(0,s.jsx)(t.code,{children:".env"})," file. The values provided are examples:"]}),"\n",(0,s.jsx)(t.pre,{children:(0,s.jsx)(t.code,{children:"TEST_SERVER_PORT: Port for the test server (e.g., 3002)\nTEST_DB_HOSTNAME: Hostname for the test database (e.g., localhost)\nTEST_DB_USERNAME: Username for the test database (e.g., root)\nTEST_DB_PASSWORD: Password for the test database (e.g., root)\nTEST_DB_PORT: Port for the test database (e.g., 3306)\nTEST_DB_NAME: Name of the test database (e.g., tombolo_test)\n"})}),"\n",(0,s.jsx)(t.hr,{}),"\n",(0,s.jsx)(t.h3,{id:"starting-tests",children:"Starting Tests"}),"\n",(0,s.jsx)(t.p,{children:"To start the tests, use the following command, defined in the package.json scripts. This will set up the test environment, execute the tests, and then properly tear down the test environment, ensuring a clean and isolated test process"}),"\n",(0,s.jsx)(t.pre,{children:(0,s.jsx)(t.code,{className:"language-bash",children:"npm run test\n"})}),"\n",(0,s.jsx)(t.hr,{}),"\n",(0,s.jsx)(t.h3,{id:"adding-tests",children:"Adding Tests"}),"\n",(0,s.jsxs)(t.p,{children:["All tests and test-related configurations are in the ",(0,s.jsx)(t.code,{children:"tests"})," directory inside ",(0,s.jsx)(t.code,{children:"server"}),". To add a test, create a new file with a ",(0,s.jsx)(t.code,{children:".test.js"})," extension in the appropriate ",(0,s.jsx)(t.code,{children:"tests"})," subdirectory. For example, if you are writing a test for a piece of function, you might want to do that inside the ",(0,s.jsx)(t.code,{children:"unit-tests"})," subdirectory. If the matching or relevant subdirectory does not exist, you may create one."]}),"\n",(0,s.jsx)(t.p,{children:"Ensure that the file names are descriptive, reflecting the functionality being tested. This makes it easier to identify and manage individual test cases. For consistency, you can refer to existing test files as templates when structuring your tests. This helps maintain uniformity across the test suite, making it easier to read, understand, and debug as needed."}),"\n",(0,s.jsxs)(t.p,{children:["If you are writing a test to test APIs, which is an end-to-end testing for a route, be sure to import that route in the ",(0,s.jsx)(t.code,{children:"test_server.js"}),"."]}),"\n",(0,s.jsx)(t.hr,{}),"\n",(0,s.jsx)(t.h3,{id:"comprehensive-test-lifecycle",children:"Comprehensive Test Lifecycle"}),"\n",(0,s.jsxs)(t.p,{children:["When the ",(0,s.jsx)(t.code,{children:"npm run test"})," command is executed, the following steps take place:"]}),"\n",(0,s.jsxs)(t.ol,{children:["\n",(0,s.jsxs)(t.li,{children:[(0,s.jsx)(t.strong,{children:"Jest Initialization"}),": The command references the ",(0,s.jsx)(t.code,{children:"jest.config.js"})," file, where paths for global setup and teardown are defined, along with other test configurations."]}),"\n",(0,s.jsxs)(t.li,{children:[(0,s.jsx)(t.strong,{children:"Environment Setup"}),": The global setup script prepares the test environment by creating a dedicated test database, running migrations, seeding initial data, starting the server, and establishing the necessary database connections."]}),"\n",(0,s.jsxs)(t.li,{children:[(0,s.jsx)(t.strong,{children:"Test Execution"}),": With the environment ready, the tests are run, and the results, including pass/fail statuses and error details, are displayed in the console."]}),"\n",(0,s.jsxs)(t.li,{children:[(0,s.jsx)(t.strong,{children:"Environment Teardown"}),": After all tests have been executed, the global teardown script cleans up by removing the test database, stopping the server, and closing database connections, ensuring a clean exit."]}),"\n"]}),"\n",(0,s.jsx)(t.hr,{}),"\n",(0,s.jsx)(t.h3,{id:"pull-request-guidelines",children:"Pull Request Guidelines"}),"\n",(0,s.jsx)(t.p,{children:"When submitting a pull request (PR), it's essential to include relevant tests for any new functionality or changes. All tests, both new and existing, must pass successfully to ensure that the changes do not introduce regressions or break existing features. This practice helps maintain the stability and integrity of the codebase while allowing for smooth integration of new updates."})]})}function h(e={}){const{wrapper:t}={...(0,i.R)(),...e.components};return t?(0,s.jsx)(t,{...e,children:(0,s.jsx)(c,{...e})}):c(e)}},8453:(e,t,n)=>{n.d(t,{R:()=>o,x:()=>a});var s=n(6540);const i={},r=s.createContext(i);function o(e){const t=s.useContext(r);return s.useMemo((function(){return"function"==typeof e?e(t):{...t,...e}}),[t,e])}function a(e){let t;return t=e.disableParentContext?"function"==typeof e.components?e.components(i):e.components||i:o(e.components),s.createElement(r.Provider,{value:t},e.children)}}}]);
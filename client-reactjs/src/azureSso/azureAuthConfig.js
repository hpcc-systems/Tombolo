export const msalConfig = {
    auth: {
      clientId: "8ba76099-a4d6-4a4e-84fe-9df3d1425e35",
      authority: "https://login.microsoftonline.com/b0d4e8bb-0946-4a43-91a0-7cd829855071",
      redirectUri: 'http://localhost:3001/azureuserhome'
    },
    cache: {
      cacheLocation: "localStorage", // This configures where your cache will be stored
      storeAuthStateInCookie: false, // Set this to "true" if you are having issues on IE11 or Edge
    }
  };
  
  // Add scopes here for ID token to be used at Microsoft identity platform endpoints.
  export const loginRequest = {
   scopes: ["User.Read"]
  };
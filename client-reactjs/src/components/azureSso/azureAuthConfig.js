// import { LogLevel } from "@azure/msal-browser";
const {REACT_APP_AZURE_CLIENT_ID, REACT_APP_AZURE_TENENT_ID, REACT_APP_AZURE_REDIRECT_URI, REACT_APP_LOGOUT_URI} = process.env;

export const msalConfig = {
    auth: {
        clientId: REACT_APP_AZURE_CLIENT_ID, // This is the ONLY mandatory field that you need to supply.
        authority: `https://login.microsoftonline.com/${REACT_APP_AZURE_TENENT_ID}`, // Defaults to "https://login.microsoftonline.com/common"
        redirectUri: REACT_APP_AZURE_REDIRECT_URI, // Points to window.location.origin. You must register this URI on Azure Portal/App Registration.
        navigateToLoginRequestUrl: false, // If "true", will navigate back to the original request location before processing 
        postLogoutRedirectUri: REACT_APP_LOGOUT_URI,
    },
    cache: {
        cacheLocation: "localStorage", // Configures cache location. "sessionStorage" is more secure, but "localStorage" gives you SSO between tabs.
        storeAuthStateInCookie: false, // Set this to "true" if you are having issues on IE11 or Edge
    },
    
    // system: {
    //     loggerOptions: {
    //         loggerCallback: (level, message, containsPii) => {
    //             if (containsPii) {
    //                 return;
    //             }
    //             switch (level) {
    //                 case LogLevel.Error:
    //                     console.error(message);
    //                     return;
    //                 case LogLevel.Info:
    //                     console.info(message);
    //                     return;
    //                 case LogLevel.Verbose:
    //                     console.debug(message);
    //                     return;
    //                 case LogLevel.Warning:
    //                     console.warn(message);
    //                     return;
    //             }
    //         }
    //     }
    // }
};

/**
 * Scopes you add here will be prompted for user consent during sign-in.
 * By default, MSAL.js will add OIDC scopes (openid, profile, email) to any login request.
 * For more information about OIDC scopes, visit: 
 * https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-permissions-and-consent#openid-connect-scopes
 */
export const loginRequest = {
    // scopes: ['User.read', 'email'],
    scopes : [process.env.REACT_APP_AZURE_API_TOKEN_SCOPE]
};

/**
 * An optional silentRequest object can be used to achieve silent SSO
 * between applications by providing a "login_hint" property.
 */
export const silentRequestOptions = {
    // scopes: ["openid", "profile"],
    scopes : [process.env.REACT_APP_AZURE_API_TOKEN_SCOPE],
    loginHint: "example@domain.net"
};
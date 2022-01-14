import { userActions } from "../../redux/actions/User";
import { store } from "../../redux/store/Store";
import { message } from "antd/lib";
import { msalInstance } from "../../index";

//Handle error from saver
export function handleError(response) {
  message.config({ top: 130 });
  if (response.status == 401) {
    //token expired
    localStorage.removeItem("user");
    store.dispatch(userActions.logout());
  } else if (response.status == 422) {
    throw Error(
      "Error occurred while saving the data. Please check the form data"
    );
  } else {
    let errorMessage = "";
    response.json().then((responseData) => {
      errorMessage = responseData.message;
      //throw new Error(errorMessage);
      message.error(errorMessage);
    });
  }
}

// When the client sends a fetch request the header requires an auth token.
// This function grabs the token from the Local Storage. The returned value is palaced in the header of the API calls
// If the application is using Azure sso, the function below this one replaces this function's returned value
export function authHeader(action) {
  // return authorization header with jwt token
  let user = JSON.parse(localStorage.getItem("user"));
  if (user && user.token && action) {
    return {
      Authorization: "Bearer " + user.token,
    };
  } else if (user && user.token) {
    return {
      Authorization: "Bearer " + user.token,
      Accept: "application/json",
      "Content-Type": "application/json",
    };
  } else {
    return {};
  }
}

// This async function gets the refresh token for the active azure account
// The refreshed/latest token  replaces the existing token by intercepting the API calls
// Function below this one is doing the intercepting and replacing job
export async function getFreshAzureToken() {
  if (process.env.REACT_APP_APP_AUTH_METHOD === "azure_ad") {
    const currentAccount = msalInstance.getActiveAccount();
    const silentRequest = {
      scopes: ["User.Read"],
      account: currentAccount,
      forceRefresh: false,
    };

    const tokenResponse = await msalInstance
      .acquireTokenSilent(silentRequest)
      .then((response) => {
        return response;
      })
      .catch((error) => {
        console.log("Error occurred", error);
      });

    return {
      Authorization: "Bearer " + tokenResponse.idToken,
    };
  }
}

//if Azure sso is being used intercept all the fetch requests and update token for necessary routes
const newFetch = window.fetch;
window.fetch = async function () {
  if (
    process.env.REACT_APP_APP_AUTH_METHOD === "azure_ad" &&
    arguments[1].headers.Authorization
  ) {
    let newToken = await getFreshAzureToken();
    arguments[1] = { headers: newToken };
    return newFetch.apply(this, arguments);
  } else {
    return newFetch.apply(this, arguments);
  }
};

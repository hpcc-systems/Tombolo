import React, {useState, useEffect} from 'react'
import { useMsal } from "@azure/msal-react";
import { useDispatch } from "react-redux";
import { userActions } from '../../redux/actions/User';
var jwtDecode = require('jwt-decode');


function AzureUserHome() {
    const { instance, accounts, inProgress } = useMsal();
    // const [user, setUser] =useState(null)
    // const [accessToken, setAccessToken] = useState(null);

    // const name = accounts[0] && accounts[0].name;
    // const dispatch = useDispatch();

    // useEffect(() => {
    //     if(accounts.length > 0 && accessToken){
    //         console.log(accessToken)
    //         let userAccount = accounts[0]
    //         console.log(userAccount)
    //         let user = {
    //             firstName : userAccount.name.split(' ')[0],
    //             lastName : userAccount.name.split(' ')[1],
    //             role : 'tombolo_user',
    //             email : userAccount.username,
    //             username : userAccount.idTokenClaims.preferred_username.split('@')[0],
    //             type: 'azureUser',
    //             token: accessToken
    //         }

        //    dispatch( userActions.azureLogin(user));
        //     fetch('/api/user/loginAzureUser', {
        //         method: 'post',
        //         headers: {
        //             'Accept': 'application/json',
        //             'Content-Type': 'application/json'
        //         },
        //         body: JSON.stringify(user)
        //       }).then(response => response.json())
        //       .then(data => {
        //         console.log(data);
        //         localStorage.setItem('user', JSON.stringify(user));
        //         setUser(user)
        //       }).catch(error => {
        //        console.log(error);
        //       })
        //     console.log("<<<<<<<<<<<<<<<<<<<<<<<<<<< SILENTLY ACQUIRED THE ACCESS TOKEN >>>>>>>>>>>>>>>>>>>>>>>>>>", accessToken)
        // }
        
    // }, [accounts, accessToken])

    // useEffect(() => {
    //     dispatch(userActions.azureLogin)
    // }, [userActions])

    // useEffect(() => {
    //     if(inProgress === "none"){
    //         RequestAccessToken();
    //     }
    // }, [inProgress])

    // function RequestAccessToken() {
    //     const request = {
    //         // ...loginRequest,
    //         account: accounts[0]
    //     };

    //     // Silently acquires an access token 
    //     instance.acquireTokenSilent(request).then((response) => {
    //         alert("<<<<<<<<<<<<< Silently acquering token")
    //         setAccessToken(response.accessToken);
    //         console.log("<<<<<<<<<<< Response after silently fetching token")
    //     })
    //     .catch((e) => {
    //         alert('<<<<<<<<<<<<<<<<<<<< error while silently getting token')
    //         instance.acquireTokenRedirect(request).then((response) => {
    //             alert('<<<<<<<<<<<<<<<<<<<< error while silently getting token')
    //             setAccessToken(response.accessToken);
    //         });
    //     });
    // }

    return (
         <>
         Azure user home
            {console.log(instance)}
            {alert("<<<<<<< on azure user home")}
        </>
    )
}

export default AzureUserHome


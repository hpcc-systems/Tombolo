import React, {useEffect} from 'react';
import { useMsal } from "@azure/msal-react";
import { useDispatch } from "react-redux";
import { userActions } from '../../redux/actions/User';
import { loginRequest, silentRequest} from "./azureAuthConfig";
import { Spin } from 'antd';

function AzureUserHome() {
    const dispatch = useDispatch();
    const { instance, accounts, inProgress } = useMsal();


    useEffect(() => {
        // When the user is successfully authenticated and MSL has users account info
        // set active account for msal instance
        if(accounts.length > 0 && inProgress === 'none'){
            console.log('<<<<< ACCOUNTS ', accounts)
            let userAccount = accounts[0];
            instance.setActiveAccount(userAccount);
           (async () => {
        //Acquire fresh access tokens to send initial user info request
        try {
              const authority = await instance.acquireTokenSilent(silentRequest);
              console.log('AUTHORITY <<<<', authority)
              let user = {
                firstName : userAccount.name.split(' ')[1],
                lastName : userAccount.name.split(',')[0],
                email : userAccount.username,
                username : userAccount.idTokenClaims.preferred_username.split('@')[0],
                id : userAccount.idTokenClaims.preferred_username.split('@')[0],
                roles: userAccount.idTokenClaims.roles,
                token : authority.accessToken,
            }
            dispatch( userActions.azureLogin(user));
        } catch (error) {
            //If silent token acquisition fails - fall back to interactive mode
          instance.acquireTokenRedirect(loginRequest);
        }
      })();
        } 
        
        if(accounts.length < 1 && inProgress === 'none'){
            instance.loginRedirect(loginRequest).catch(e =>{
                console.log(e)
            })
        }
    }, [accounts, inProgress])


    return (
         <>
            <div style={{display:'flex',justifyContent:'center', alignItems: 'center', width: '100vw', height: '100vh'}}>
            <Spin /> <span style={{marginLeft: "20px"}}> Tombolo </span>
        </div>
        </>
    )
}

export default AzureUserHome;
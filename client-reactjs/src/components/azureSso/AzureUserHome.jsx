import React, {useState, useEffect} from 'react'
import { useMsal } from "@azure/msal-react";
import { useDispatch } from "react-redux";
import { userActions } from '../../redux/actions/User';
import { loginRequest } from "./azureAuthConfig";
import { Spin } from 'antd';

function AzureUserHome() {
    const dispatch = useDispatch();
    const { instance, accounts, inProgress } = useMsal();

    useEffect(() => {
        console.log("Inprogress <<<<", inProgress, "accounts <<<<", accounts, "instance <<<< ", instance);

        // When the user is successfully authenticated and MSL has users account info
        if(accounts.length > 0 && inProgress === 'none'){
            let userAccount = accounts[0];
            instance.setActiveAccount(userAccount);
            let user = {
                firstName : userAccount.name.split(' ')[0],
                lastName : userAccount.name.split(' ')[1],
                email : userAccount.username,
                username : userAccount.idTokenClaims.preferred_username.split('@')[0],
                type: 'azureUser',
                token : userAccount.localAccountId,
            }

          // This dispatch function makes a call to /loginAzureUser. 
          //login azure user adds a user in the user table if not already there
          console.log("<<<< This block of code is running")
          dispatch( userActions.azureLogin(user));
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


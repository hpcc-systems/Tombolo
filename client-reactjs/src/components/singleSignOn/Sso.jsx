import React, {useEffect} from 'react'
import { useMsal } from "@azure/msal-react";
import { loginRequest } from "../../azureSso/azureAuthConfig";
import { Spin } from 'antd';

function Sso() {
    const { instance, accounts, inProgress } = useMsal();

    useEffect(() =>{
        alert(inProgress);
        instance.loginRedirect(loginRequest).catch(e =>{
            console.log(e)
        })
        
    }, []);

    return (
        <div style={{display:'flex',justifyContent:'center', alignItems: 'center', width: '100vw', height: '100vh'}}>
            <Spin /> 
        </div>
    )
}

export default Sso

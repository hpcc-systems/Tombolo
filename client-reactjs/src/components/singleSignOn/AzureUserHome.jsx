import React, {useState, useEffect} from 'react'
import { useMsal } from "@azure/msal-react";
import { useDispatch } from "react-redux";
import { userActions } from '../../redux/actions/User';
var jwtDecode = require('jwt-decode');


function AzureUserHome() {
    const { instance, accounts, inProgress } = useMsal();
    const [user, setUser] =useState(null)
    const [accessToken, setAccessToken] = useState(null);

    const name = accounts[0] && accounts[0].name;
    const dispatch = useDispatch();


    useEffect(() => {
        if(accounts.length > 0 && accessToken){
            console.log("<<<<<<<<<<<<<<<<<<< accounts", accounts);
            var decoded = jwtDecode(accessToken);
            console.log("<<<<<<<<<<<<<<<<<<<<<<< DDDDDDDDDDDecoded" , decoded)
            console.log(accessToken)
            let userAccount = accounts[0]
            let user = {
                firstName : userAccount.name.split(' ')[0],
                lastName : userAccount.name.split(' ')[1],
                role : 'tombolo_user',
                email : userAccount.username,
                username : userAccount.idTokenClaims.preferred_username.split('@')[0],
                type: 'azureUser',
                // permissions: "Tombolo_Admin",
                // role: [
                //     {
                //         "id": "86bb37ff-7932-436c-88f5-705bae9dddeb",
                //         "name": "Tombolo_Admin",
                //         "description": null,
                //         "applicationType": "Tombolo",
                //         "managedBy": "LNRS",
                //         "permissions": {
                //             "AddFiles": "add",
                //             "View PII": "allow",
                //             "EditFiles": "edit",
                //             "AddDataflow": "add",
                //             "DeleteFiles": "delete",
                //             "EditDataflow": "edit",
                //             "DeleteDataflow": "delete",
                //             "ReadDataflowInstance": "add"
                //         },
                //         "createdAt": "2021-06-01T13:18:45.000Z",
                //         "updatedAt": "2021-06-01T13:18:45.000Z",
                //         "deletedAt": null,
                //         "User_Roles": {
                //             "userId": 18,
                //             "roleId": "86bb37ff-7932-436c-88f5-705bae9dddeb",
                //             "applicationId": "6b19c4bc-d582-4d8e-87fb-2e0602f56594",
                //             "priority": 1,
                //             "createdAt": "2021-09-03T12:28:04.000Z",
                //             "updatedAt": "2021-09-03T12:28:04.000Z"
                //         }
                //     }
                // ],
                // token: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTgsImZpcnN0TmFtZSI6InlhZGhhcCIsImxhc3ROYW1lIjoiRGFoYWwiLCJ1c2VybmFtZSI6InlkYWhhbDEiLCJlbWFpbCI6InlhZGhhcC5kYWhhbEBsZXhpc25leGlzcmlzay5jb20iLCJvcmdhbml6YXRpb24iOm51bGwsInJvbGUiOlt7ImlkIjoiODZiYjM3ZmYtNzkzMi00MzZjLTg4ZjUtNzA1YmFlOWRkZGViIiwibmFtZSI6IlRvbWJvbG9fQWRtaW4iLCJkZXNjcmlwdGlvbiI6bnVsbCwiYXBwbGljYXRpb25UeXBlIjoiVG9tYm9sbyIsIm1hbmFnZWRCeSI6IkxOUlMiLCJwZXJtaXNzaW9ucyI6eyJBZGRGaWxlcyI6ImFkZCIsIlZpZXcgUElJIjoiYWxsb3ciLCJFZGl0RmlsZXMiOiJlZGl0IiwiQWRkRGF0YWZsb3ciOiJhZGQiLCJEZWxldGVGaWxlcyI6ImRlbGV0ZSIsIkVkaXREYXRhZmxvdyI6ImVkaXQiLCJEZWxldGVEYXRhZmxvdyI6ImRlbGV0ZSIsIlJlYWREYXRhZmxvd0luc3RhbmNlIjoiYWRkIn0sImNyZWF0ZWRBdCI6IjIwMjEtMDYtMDFUMTM6MTg6NDUuMDAwWiIsInVwZGF0ZWRBdCI6IjIwMjEtMDYtMDFUMTM6MTg6NDUuMDAwWiIsImRlbGV0ZWRBdCI6bnVsbCwiVXNlcl9Sb2xlcyI6eyJ1c2VySWQiOjE4LCJyb2xlSWQiOiI4NmJiMzdmZi03OTMyLTQzNmMtODhmNS03MDViYWU5ZGRkZWIiLCJhcHBsaWNhdGlvbklkIjoiNmIxOWM0YmMtZDU4Mi00ZDhlLTg3ZmItMmUwNjAyZjU2NTk0IiwicHJpb3JpdHkiOjEsImNyZWF0ZWRBdCI6IjIwMjEtMDktMDNUMTI6Mjg6MDQuMDAwWiIsInVwZGF0ZWRBdCI6IjIwMjEtMDktMDNUMTI6Mjg6MDQuMDAwWiJ9fV0sImNsaWVudElkIjoidG9tYm9sb19kZXYiLCJpYXQiOjE2MzQxMzY1MTgsImV4cCI6MTYzNDIyMjkxOH0.pthPOIRx9lIBwMOwPIKFEYhFv0Nzap5TyPOWDNLKUNq21aJ2Vn3hHTEbSQK2f8hE_kCuBJ0rhaszj1lZuhY92wWvdIUC4Hl-l8_ZyDGj52sCU3oBGbQr-xJnijiA5QZDv8CAvheDbYTSTy7kv96l2YOZpdkUHD3DRW507aMtr107TfDdKpgkHb4uG2CFF6KSLobVmkucJidIuxnauMWLRGVdu0GXaEm9rrUK2p5FK-lbGy8fJ-YfexeQY5ThQqobr1JNAZERonlUdKxcnb5u9Mmoy89ltxG_OQChM3g6FHt4L8XxQ9ubYFeOtsUmFxC5Ff7PT0TZofnFhD6exeDSx_7yW12bc6LX8sf6yhso2-fWjRCa9afTcaLsEuf7VoGs0cnMK7qui2xrk_hzdwfSOUe6FPD9jLYf52SRGi7mk42NTLvDJQNYx8ElnWtjsb4thewCInm5xJlArKxxrbGBTGrnFAAkT3Fqt49ulPkyIBWRJXyOMqO3T8mgE_EnO9bvYx5Ii7sBhsCUFqY7-WZmgCm5S6E_Lt_3J2uWxOSPdMN-j6G4AIsEhNWz0Z0PT3w99KjtB3RSyEddnJP6Xl7AbR-iDrqKALn51Dvk4c0GkOIjjoi25zINQsICawqU9SSRqrhXov_wSYCLfDF_l6zhtt1JBlw0FMVzMEXQJcyVlaQ'
                token: accessToken
            }

           dispatch( userActions.azureLogin(user));
           console.log("<<<<<<<<<<<<<<<< $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$", user)

            // fetch('/api/user/loginAzureUser', {
            //     method: 'post',
            //     headers: {
            //         'Accept': 'application/json',
            //         'Content-Type': 'application/json'
            //     },
            //     body: JSON.stringify(user)
            //   }).then(response => response.json())
            //   .then(data => {
            //     console.log(data);
            //     localStorage.setItem('user', JSON.stringify(user));
            //     setUser(user)
            //   }).catch(error => {
            //    console.log(error);
            //   })

            alert(accessToken)

        }
        
    }, [accounts, accessToken])

    useEffect(() => {
        dispatch(userActions.azureLogin)
    }, [userActions])

    useEffect(() => {
        console.log("<<<<<<<<<<<<<<<<< INASTANCE",  instance, "<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<");
        console.log("<<<<<<<<<<<<<<<<< ACCOUNTS",  accounts, "<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<");
        console.log("<<<<<<<<<<<<<<<<< INPROGRESS",  inProgress, "<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<")
        if(inProgress === "none"){
            RequestAccessToken();
        }
    }, [instance, accounts, inProgress])

    function RequestAccessToken() {
        const request = {
            // ...loginRequest,
            account: accounts[0]
        };

        // Silently acquires an access token which is then attached to a request for Microsoft Graph data
        instance.acquireTokenSilent(request).then((response) => {
            console.log("<<<<<<<<<<<<< Silently acquering")
            setAccessToken(response.accessToken);
        })
        .catch((e) => {
            instance.acquireTokenRedirect(request).then((response) => {
                setAccessToken(response.accessToken);
            });
        });
    }

    return (
         <>
            {/* <h5 >Welcome {name}</h5> */}
            {console.log(instance)}
            {/* {accessToken ? 
                 <textarea  value={accessToken} />
                :
                <>
                <button variant="secondary"
                //  onClick={RequestAccessToken}
                 > Token</button>
             
                </>
            } */}
        </>
    )
}

export default AzureUserHome


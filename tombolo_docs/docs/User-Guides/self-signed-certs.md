---
sidebar_position: 12
---

# Self Signed Certificates

If your HPCC cluster uses self signed certificates because it is not able to access a CA (certificate authority) you must add the `.pem` into Tombolo.

## Retrieve the .pem file from your cluster

Execute the bash below in your terminal. You will now have a file named `customCert.pem`.

```bash
openssl s_client -connect example.com:443 -showcerts < /dev/null | openssl x509 -outform PEM > customCert.pem
```

The filename of `customCert.pem` is not required, you can name it whatever you like as long as the extension is `.pem`.

## Move the file into Tomobolo's `customCerts` folder

The `.pem` file you created with the above step needs to be placed in `Tombolo/Tombolo/customCerts`. This folder should already exist.

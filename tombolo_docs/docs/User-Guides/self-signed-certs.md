---
sidebar_position: 12
---

# Self-Signed Certificates

If your HPCC cluster uses self-signed certificates because it is not able to access a CA (certificate authority) you must add the `.pem` into Tombolo.

## Retrieve the .pem file from your cluster

Execute the bash below in a terminal where your cluster is hosted. You will now have a file named `customCert.pem`.

```bash
openssl s_client -connect example.com:443 -showcerts < /dev/null | openssl x509 -outform PEM > customCert.pem
```

The filename of `customCert.pem` is not required, you can name it whatever you like as long as the extension is `.pem`.

## Move the file into Tomobolo's `customCerts` folder

The `.pem` file you created with the above step needs to be placed in `Tombolo/Tombolo/customCerts`. This folder should already exist.

## Allow self-signed certificates on the cluster in Tombolo

On the add cluster modal there will be a check box to allow self signed certificates directly below the cluster dropdown. Ensure you have checked this box. If you've already added the cluster you can edit the cluster and check the box in that modal.
See the outlined checkbox in the image below.

![Self Signed Certs Checkbox](/img/self-signed-cert-checkbox.png)

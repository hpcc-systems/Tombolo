const https = require('https');
const tls = require('tls');
const fs = require('fs');

const readSelfSignedCerts = () => {
  const customCertFiles = [];
  const certsFolder = '../certs';
  if (fs.existsSync(certsFolder) && fs.lstatSync(certsFolder).isDirectory()) {
    console.info('Certs folder found');
    fs.readdirSync(certsFolder).forEach(certFileName => {
      if (certFileName.endsWith('.crt') || certFileName.endsWith('.pem')) {
        try {
          customCertFiles.push(fs.readFileSync(`certs/${certFileName}`));
        } catch (err) {
          // TODO: Replace with logger call
          console.error(`Failed to read crt or pem file, ${err}`);
        }
      }
    });

    console.info('The following certfiles were found', customCertFiles);

    const customAgent = new https.Agent({
      ca: [...tls.rootCertificates, ...customCertFiles],
    });
    https.globalAgent = customAgent;
  }
};

module.exports = {
  readSelfSignedCerts,
};

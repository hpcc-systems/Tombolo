const logger = require('../config/logger');
const https = require('https');
const tls = require('tls');
const fs = require('fs');

const loggedCertWarnings = new Set();

/**
 * Extract 1 or many pems from a file
 */
const extractPemCertificates = filePath => {
  const content = fs.readFileSync(filePath, 'utf-8').trim();

  const pemMatches = content.match(
    /-----BEGIN CERTIFICATE-----\r?\n[\s\S]*?\r?\n-----END CERTIFICATE-----/g
  );
  if (!pemMatches) {
    throw new Error(`No PEM certificates found in file: ${filePath}`);
  }
  return pemMatches;
};

/**
 * Reads all .crt and .pem files in the customCerts folder and appends them to the global http.Agent
 */
const readSelfSignedCerts = () => {
  const customCertFiles = [];
  const certsFolder = '../customCerts';
  if (fs.existsSync(certsFolder) && fs.lstatSync(certsFolder).isDirectory()) {
    fs.readdirSync(certsFolder).forEach(certFileName => {
      if (certFileName.endsWith('.crt') || certFileName.endsWith('.pem')) {
        try {
          const pemCerts = extractPemCertificates(
            `${certsFolder}/${certFileName}`
          );

          customCertFiles.push(...pemCerts);
        } catch (err) {
          logger.error(`Failed to read certificate: ${certFileName}\n`, err);
        }
      }
    });

    const customAgent = new https.Agent({
      ca: [...tls.rootCertificates, ...customCertFiles],
      rejectUnauthorized: true,
      checkServerIdentity: (hostname, cert) => {
        const certCN = cert.subject?.CN || '';
        // Use warning key to ensure no duplicate logs
        const warningKey = `${hostname}:${certCN}`;

        if (hostname !== certCN && !loggedCertWarnings.has(warningKey)) {
          logger.warn(
            `Hostname mismatch: requested ${hostname}, but certificate is for ${certCN}.`
          );
          loggedCertWarnings.add(warningKey);
        }
        // Skip hostname verification
        return undefined;
      },
    });
    https.globalAgent = customAgent;
  }

  logger.info(`Read ${customCertFiles.length} custom certificate(s).`);
};

module.exports = {
  readSelfSignedCerts,
};

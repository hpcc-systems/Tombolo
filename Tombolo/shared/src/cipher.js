const crypto = require('crypto');
// The crypto package will work on the client as long as we use vite

const algorithm = 'aes-256-ctr';
const iv_length = 16;

/**
 * Encrypts a string using `crypto`
 * @param {string} text - The string you would like to be encrypted
 * @param {string} encryptionKey - Encryption key
 * @returns {string} Encrypted string
 */
const encryptString = (text, encryptionKey) => {
  if (!encryptionKey) {
    throw new Error('Missing required argument: encryptionKey');
  }

  let key = Buffer.from(encryptionKey, 'base64');
  const iv = crypto.randomBytes(parseInt(iv_length));
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
};

/**
 * Decrypts a string using `crypto`
 * @param {string} text - The string you would like to be decrypted
 * @param {string} encryptionKey - Encryption key
 * @returns {string} Decrypted string
 */
const decryptString = (text, encryptionKey) => {
  if (!encryptionKey) {
    throw new Error('Missing required argument: encryptionKey');
  }

  let key = Buffer.from(encryptionKey, 'base64');
  let textParts = text.split(':');
  let iv = Buffer.from(textParts.shift(), 'hex');
  let encryptedText = Buffer.from(textParts.join(':'), 'hex');
  let decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
};

module.exports = {
  encryptString,
  decryptString,
};

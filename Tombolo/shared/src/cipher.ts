import crypto from 'crypto';
// The crypto package will work on the client as long as we use vite

const algorithm = 'aes-256-ctr';
const iv_length = 16;

/**
 * Encrypts a string using `crypto`
 * @param text - The string you would like to be encrypted
 * @param encryptionKey - Encryption key
 * @returns Encrypted string
 */
const encryptString = (text: string, encryptionKey: string): string => {
  if (!encryptionKey) {
    throw new Error('Missing required argument: encryptionKey');
  }

  const key = Buffer.from(encryptionKey, 'base64');
  const iv = crypto.randomBytes(parseInt(String(iv_length)));
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
};

/**
 * Decrypts a string using `crypto`
 * @param text - The string you would like to be decrypted
 * @param encryptionKey - Encryption key
 * @returns Decrypted string
 */
const decryptString = (text: string, encryptionKey: string): string => {
  if (!encryptionKey) {
    throw new Error('Missing required argument: encryptionKey');
  }

  const key = Buffer.from(encryptionKey, 'base64');
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift()!, 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
};

export { encryptString, decryptString };

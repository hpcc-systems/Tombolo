const crypto = require('crypto');

const encryptString = (text) => {
    let key = Buffer.from(process.env.ENCRYPTION_KEY, 'base64');
   const iv = crypto.randomBytes(parseInt(process.env.IV_LENGTH));
   const cipher = crypto.createCipheriv(process.env.ALGORITHM, key, iv);
   let encrypted = cipher.update(text);
   encrypted = Buffer.concat([encrypted, cipher.final()]);
   return iv.toString('hex') +  ':' + encrypted.toString('hex');
}

const decryptString = (text) =>{
    let key = Buffer.from(process.env.ENCRYPTION_KEY, 'base64');
    let textParts = text.split(':');
	let iv = Buffer.from(textParts.shift(), 'hex');
	let encryptedText = Buffer.from(textParts.join(':'), 'hex');
	let decipher = crypto.createDecipheriv(process.env.ALGORITHM, key, iv);
	let decrypted = decipher.update(encryptedText);
	decrypted = Buffer.concat([decrypted, decipher.final()]);
	return decrypted.toString();
}

module.exports = {
    encryptString,
    decryptString
} 
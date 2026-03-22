import crypto from 'crypto';

export function sha256(data: string): string {
  return crypto.createHash('sha256').update(data, 'utf8').digest('hex');
}

export function generateKeyPair() {
  return crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
}

export function encryptWithPublicKey(data: string, publicKeyPem: string): string {
  const buffer = Buffer.from(data, 'utf8');
  // RSA can only encrypt small amounts, so use hybrid encryption
  const aesKey = crypto.randomBytes(32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', aesKey, iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const encryptedKey = crypto.publicEncrypt(publicKeyPem, aesKey);
  return JSON.stringify({
    encryptedKey: encryptedKey.toString('base64'),
    iv: iv.toString('base64'),
    data: encrypted.toString('base64'),
  });
}

export function decryptWithPrivateKey(encryptedJson: string, privateKeyPem: string): string {
  const { encryptedKey, iv, data } = JSON.parse(encryptedJson);
  const aesKey = crypto.privateDecrypt(privateKeyPem, Buffer.from(encryptedKey, 'base64'));
  const decipher = crypto.createDecipheriv('aes-256-cbc', aesKey, Buffer.from(iv, 'base64'));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(data, 'base64')), decipher.final()]);
  return decrypted.toString('utf8');
}

// Simple symmetric encryption for client-side use
export function symmetricEncrypt(data: string, key: string): string {
  const keyBuffer = crypto.createHash('sha256').update(key).digest();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', keyBuffer, iv);
  const encrypted = Buffer.concat([cipher.update(Buffer.from(data, 'utf8')), cipher.final()]);
  return JSON.stringify({ iv: iv.toString('base64'), data: encrypted.toString('base64') });
}

export function symmetricDecrypt(encryptedJson: string, key: string): string {
  const { iv, data } = JSON.parse(encryptedJson);
  const keyBuffer = crypto.createHash('sha256').update(key).digest();
  const decipher = crypto.createDecipheriv('aes-256-cbc', keyBuffer, Buffer.from(iv, 'base64'));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(data, 'base64')), decipher.final()]);
  return decrypted.toString('utf8');
}

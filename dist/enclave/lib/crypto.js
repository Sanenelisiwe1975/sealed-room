"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sha256 = sha256;
exports.generateKeyPair = generateKeyPair;
exports.encryptWithPublicKey = encryptWithPublicKey;
exports.decryptWithPrivateKey = decryptWithPrivateKey;
exports.symmetricEncrypt = symmetricEncrypt;
exports.symmetricDecrypt = symmetricDecrypt;
const crypto_1 = __importDefault(require("crypto"));
function sha256(data) {
    return crypto_1.default.createHash('sha256').update(data, 'utf8').digest('hex');
}
function generateKeyPair() {
    return crypto_1.default.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });
}
function encryptWithPublicKey(data, publicKeyPem) {
    const buffer = Buffer.from(data, 'utf8');
    const aesKey = crypto_1.default.randomBytes(32);
    const iv = crypto_1.default.randomBytes(16);
    const cipher = crypto_1.default.createCipheriv('aes-256-cbc', aesKey, iv);
    const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
    const encryptedKey = crypto_1.default.publicEncrypt(publicKeyPem, aesKey);
    return JSON.stringify({
        encryptedKey: encryptedKey.toString('base64'),
        iv: iv.toString('base64'),
        data: encrypted.toString('base64'),
    });
}
function decryptWithPrivateKey(encryptedJson, privateKeyPem) {
    const { encryptedKey, iv, data } = JSON.parse(encryptedJson);
    const aesKey = crypto_1.default.privateDecrypt(privateKeyPem, Buffer.from(encryptedKey, 'base64'));
    const decipher = crypto_1.default.createDecipheriv('aes-256-cbc', aesKey, Buffer.from(iv, 'base64'));
    const decrypted = Buffer.concat([decipher.update(Buffer.from(data, 'base64')), decipher.final()]);
    return decrypted.toString('utf8');
}
function symmetricEncrypt(data, key) {
    const keyBuffer = crypto_1.default.createHash('sha256').update(key).digest();
    const iv = crypto_1.default.randomBytes(16);
    const cipher = crypto_1.default.createCipheriv('aes-256-cbc', keyBuffer, iv);
    const encrypted = Buffer.concat([cipher.update(Buffer.from(data, 'utf8')), cipher.final()]);
    return JSON.stringify({ iv: iv.toString('base64'), data: encrypted.toString('base64') });
}
function symmetricDecrypt(encryptedJson, key) {
    const { iv, data } = JSON.parse(encryptedJson);
    const keyBuffer = crypto_1.default.createHash('sha256').update(key).digest();
    const decipher = crypto_1.default.createDecipheriv('aes-256-cbc', keyBuffer, Buffer.from(iv, 'base64'));
    const decrypted = Buffer.concat([decipher.update(Buffer.from(data, 'base64')), decipher.final()]);
    return decrypted.toString('utf8');
}

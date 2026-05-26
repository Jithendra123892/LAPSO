import { generateKeyPairSync, publicEncrypt, privateDecrypt, randomBytes, createCipheriv, createDecipheriv } from 'crypto'

export function generateUserKeyPair(): { publicKey: string; privateKey: string } {
  const { publicKey, privateKey } = generateKeyPairSync('rsa', {
    modulusLength: 4096,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  })
  return { publicKey, privateKey }
}

export function generateDeviceKeyPair(): { publicKey: string; privateKey: string } {
  return generateUserKeyPair()
}

export function encryptWithPublicKey(publicKey: string, data: string): string {
  const buffer = Buffer.from(data, 'utf-8')
  const encrypted = publicEncrypt(publicKey, buffer)
  return encrypted.toString('base64')
}

export function decryptWithPrivateKey(privateKey: string, encryptedData: string): string {
  const buffer = Buffer.from(encryptedData, 'base64')
  const decrypted = privateDecrypt(privateKey, buffer)
  return decrypted.toString('utf-8')
}

export function generateSymmetricKey(): string {
  return randomBytes(32).toString('hex')
}

export function encryptSymmetric(key: string, data: string): string {
  const iv = randomBytes(16)
  const cipher = createCipheriv('aes-256-gcm', Buffer.from(key, 'hex'), iv)
  const encrypted = Buffer.concat([cipher.update(data, 'utf-8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return JSON.stringify({ iv: iv.toString('hex'), data: encrypted.toString('hex'), tag: tag.toString('hex') })
}

export function decryptSymmetric(key: string, encrypted: string): string {
  const { iv, data, tag } = JSON.parse(encrypted)
  const decipher = createDecipheriv('aes-256-gcm', Buffer.from(key, 'hex'), Buffer.from(iv, 'hex'))
  decipher.setAuthTag(Buffer.from(tag, 'hex'))
  return Buffer.concat([decipher.update(Buffer.from(data, 'hex')), decipher.final()]).toString('utf-8')
}
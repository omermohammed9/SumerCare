import { ValueTransformer } from 'typeorm';
import * as crypto from 'crypto';

const algorithm = 'aes-256-cbc';
// Must be 32 bytes for aes-256-cbc
const secretKey = process.env.DB_ENCRYPTION_KEY || '12345678901234567890123456789012'; 
// Deterministic IV ensures UNIQUE constraint works on the DB level. Must be 16 bytes.
const staticIv = process.env.DB_ENCRYPTION_IV || '1234567890123456'; 

export const encryptionTransformer: ValueTransformer = {
    to: (value: string | null): string | null => {
        if (!value) return value;
        const cipher = crypto.createCipheriv(algorithm, Buffer.from(secretKey) as unknown as Uint8Array, Buffer.from(staticIv) as unknown as Uint8Array);
        let encrypted = cipher.update(value, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return encrypted;
    },
    from: (value: string | null): string | null => {
        if (!value) return value;
        try {
            const decipher = crypto.createDecipheriv(algorithm, Buffer.from(secretKey) as unknown as Uint8Array, Buffer.from(staticIv) as unknown as Uint8Array);
            let decrypted = decipher.update(value, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            return decrypted;
        } catch (e) {
            // Return raw value if decryption fails (e.g., existing unencrypted data)
            return value;
        }
    }
};

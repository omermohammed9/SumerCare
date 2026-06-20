import { ValueTransformer } from 'typeorm';
import { CryptoUtil } from '@microservices/shared-core';

export const encryptionTransformer: ValueTransformer = {
    to: (value: string | null): string | null => {
        if (!value) return value;
        return CryptoUtil.encrypt(value);
    },
    from: (value: string | null): string | null => {
        if (!value) return value;
        try {
            return CryptoUtil.decrypt(value);
        } catch (e) {
            return value;
        }
    }
};

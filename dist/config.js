import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
function loadEnv() {
    const envPath = path.join(projectRoot, '.env');
    if (fs.existsSync(envPath)) {
        dotenv.config({ path: envPath });
    }
    else {
        dotenv.config();
    }
}
function parseBool(value, defaultValue) {
    if (!value)
        return defaultValue;
    return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
}
function normalizeBaseUrl(baseUrl) {
    return baseUrl.replace(/\/+$/, '');
}
export function getConfig() {
    loadEnv();
    const baseUrl = process.env.CONFLUENCE_BASE_URL;
    const bearerToken = process.env.CONFLUENCE_BEARER_TOKEN;
    const spacesFilterRaw = process.env.CONFLUENCE_SPACES_FILTER ?? '';
    const sslVerify = parseBool(process.env.CONFLUENCE_SSL_VERIFY, true);
    if (!baseUrl) {
        throw new Error('Missing required environment variable CONFLUENCE_BASE_URL');
    }
    if (!bearerToken) {
        throw new Error('Missing required environment variable CONFLUENCE_BEARER_TOKEN');
    }
    return {
        baseUrl: normalizeBaseUrl(baseUrl),
        bearerToken,
        spacesFilter: spacesFilterRaw
            .split(',')
            .map((v) => v.trim())
            .filter(Boolean),
        sslVerify,
    };
}

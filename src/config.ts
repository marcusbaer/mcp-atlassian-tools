import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

function loadEnv(): void {
    const envPath = path.join(projectRoot, '.env');
    if (fs.existsSync(envPath)) {
        dotenv.config({ path: envPath });
    } else {
        dotenv.config();
    }
}

function parseBool(value: string | undefined, defaultValue: boolean): boolean {
    if (!value) return defaultValue;
    return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
}

function normalizeBaseUrl(baseUrl: string): string {
    return baseUrl.replace(/\/+$/, '');
}

export type ServerConfig = {
    baseUrl: string;
    bearerToken: string;
    spacesFilter: string[];
    sslVerify: boolean;
    jiraUrl?: string;
    jiraBearerToken?: string;
    jiraProjectsFilter: string[];
    jiraSslVerify: boolean;
};

export function getConfig(): ServerConfig {
    loadEnv();

    const baseUrl = process.env.CONFLUENCE_BASE_URL;
    const bearerToken = process.env.CONFLUENCE_BEARER_TOKEN;
    const spacesFilterRaw = process.env.CONFLUENCE_SPACES_FILTER ?? '';
    const sslVerify = parseBool(process.env.CONFLUENCE_SSL_VERIFY, true);
    const jiraUrl = process.env.JIRA_URL;
    const jiraBearerToken = process.env.JIRA_BEARER_TOKEN;
    const jiraProjectsFilterRaw = process.env.JIRA_PROJECTS_FILTER ?? '';
    const jiraSslVerify = parseBool(process.env.JIRA_SSL_VERIFY, true);

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
        jiraUrl: jiraUrl ? normalizeBaseUrl(jiraUrl) : undefined,
        jiraBearerToken,
        jiraProjectsFilter: jiraProjectsFilterRaw
            .split(',')
            .map((v) => v.trim())
            .filter(Boolean),
        jiraSslVerify,
    };
}

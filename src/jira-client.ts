import https from 'node:https';
import axios, { type AxiosInstance } from 'axios';
import type { ServerConfig } from './config.js';

export class JiraClient {
    private readonly client: AxiosInstance;

    constructor(private readonly config: ServerConfig) {
        if (!config.jiraUrl || !config.jiraBearerToken) {
            throw new Error('Missing required Jira configuration (JIRA_URL and JIRA_BEARER_TOKEN)');
        }

        this.client = axios.create({
            baseURL: config.jiraUrl,
            headers: {
                Accept: 'application/json',
                Authorization: `Bearer ${config.jiraBearerToken}`,
            },
            timeout: 30000,
            httpsAgent: new https.Agent({ rejectUnauthorized: config.jiraSslVerify }),
            validateStatus: (status) => status < 500,
        });
    }

    private mergeProjectFilterJql(jql?: string): string {
        if (!this.config.jiraProjectsFilter.length) {
            return jql && jql.trim() ? jql : 'ORDER BY updated DESC';
        }

        const projectFilter = this.config.jiraProjectsFilter
            .map((project) => `project = \"${project.replace(/\"/g, '\\\"')}\"`)
            .join(' OR ');

        if (!jql || !jql.trim()) {
            return `(${projectFilter}) ORDER BY updated DESC`;
        }

        return `(${jql}) AND (${projectFilter})`;
    }

    async getCurrentUser() {
        const response = await this.client.get('/rest/api/2/myself');
        return response.data;
    }

    async listProjects() {
        const response = await this.client.get('/rest/api/2/project');
        return response.data;
    }

    async searchIssues(params: { jql?: string; maxResults?: number; startAt?: number; fields?: string[] }) {
        const response = await this.client.get('/rest/api/2/search', {
            params: {
                jql: this.mergeProjectFilterJql(params.jql),
                maxResults: params.maxResults ?? 25,
                startAt: params.startAt ?? 0,
                fields: (params.fields ?? []).join(',') || undefined,
            },
        });
        return response.data;
    }

    async getIssue(issueKey: string, fields?: string[]) {
        const response = await this.client.get(`/rest/api/2/issue/${encodeURIComponent(issueKey)}`, {
            params: {
                fields: (fields ?? []).join(',') || undefined,
            },
        });
        return response.data;
    }

    async listIssueComments(issueKey: string, startAt = 0, maxResults = 50) {
        const response = await this.client.get(
            `/rest/api/2/issue/${encodeURIComponent(issueKey)}/comment`,
            {
                params: {
                    startAt,
                    maxResults,
                },
            }
        );
        return response.data;
    }

    async listIssueTransitions(issueKey: string) {
        const response = await this.client.get(
            `/rest/api/2/issue/${encodeURIComponent(issueKey)}/transitions`
        );
        return response.data;
    }
}

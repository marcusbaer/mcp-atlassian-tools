import https from 'node:https';
import axios from 'axios';
export class JiraClient {
    config;
    client;
    constructor(config) {
        this.config = config;
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
    mergeProjectFilterJql(jql) {
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
    async searchIssues(params) {
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
    async getIssue(issueKey, fields) {
        const response = await this.client.get(`/rest/api/2/issue/${encodeURIComponent(issueKey)}`, {
            params: {
                fields: (fields ?? []).join(',') || undefined,
            },
        });
        return response.data;
    }
    async listIssueComments(issueKey, startAt = 0, maxResults = 50) {
        const response = await this.client.get(`/rest/api/2/issue/${encodeURIComponent(issueKey)}/comment`, {
            params: {
                startAt,
                maxResults,
            },
        });
        return response.data;
    }
    async listIssueTransitions(issueKey) {
        const response = await this.client.get(`/rest/api/2/issue/${encodeURIComponent(issueKey)}/transitions`);
        return response.data;
    }
    asIssueTypeRef(value) {
        return /^\d+$/.test(value) ? { id: value } : { name: value };
    }
    asDescriptionValue(value) {
        return value && value.trim() ? value : undefined;
    }
    buildIssueFields(fields) {
        const payload = {};
        if (fields.project) {
            payload.project = { key: fields.project };
        }
        if (fields.issuetype) {
            payload.issuetype = this.asIssueTypeRef(fields.issuetype);
        }
        if (fields.summary) {
            payload.summary = fields.summary;
        }
        const description = this.asDescriptionValue(fields.description);
        if (description) {
            payload.description = description;
        }
        if (fields.priority) {
            payload.priority = { name: fields.priority };
        }
        if (fields.assignee !== undefined) {
            payload.assignee = fields.assignee ? { name: fields.assignee } : null;
        }
        if (fields.labels) {
            payload.labels = fields.labels;
        }
        if (fields.components) {
            payload.components = fields.components.map((name) => ({ name }));
        }
        return payload;
    }
    async createIssue(fields) {
        const response = await this.client.post('/rest/api/2/issue', {
            fields: this.buildIssueFields(fields),
        });
        return response.data;
    }
    async updateIssue(issueKey, fields) {
        const response = await this.client.put(`/rest/api/2/issue/${encodeURIComponent(issueKey)}`, {
            fields: this.buildIssueFields(fields),
        });
        return response.data;
    }
    async transitionIssue(issueKey, transitionId, comment) {
        const data = {
            transition: { id: transitionId },
        };
        if (comment) {
            data.update = {
                comment: [
                    {
                        add: { body: comment },
                    },
                ],
            };
        }
        const response = await this.client.post(`/rest/api/2/issue/${encodeURIComponent(issueKey)}/transitions`, data);
        return response.data;
    }
    async addComment(issueKey, comment, visibility) {
        const data = { body: comment };
        if (visibility) {
            data.visibility = visibility;
        }
        const response = await this.client.post(`/rest/api/2/issue/${encodeURIComponent(issueKey)}/comment`, data);
        return response.data;
    }
    async deleteIssue(issueKey) {
        await this.client.delete(`/rest/api/2/issue/${encodeURIComponent(issueKey)}`);
        return { success: true, message: `Issue ${issueKey} deleted` };
    }
}

import https from 'node:https';
import axios from 'axios';
export class ConfluenceClient {
    config;
    client;
    constructor(config) {
        this.config = config;
        this.client = axios.create({
            baseURL: config.baseUrl,
            headers: {
                Accept: 'application/json',
                Authorization: `Bearer ${config.bearerToken}`,
            },
            timeout: 30000,
            httpsAgent: new https.Agent({ rejectUnauthorized: config.sslVerify }),
            validateStatus: (status) => status < 500,
        });
    }
    mergeSpaceFilterCql(cql) {
        if (!this.config.spacesFilter.length)
            return cql;
        const filter = this.config.spacesFilter
            .map((space) => `space = "${space.replace(/"/g, '\\"')}"`)
            .join(' OR ');
        if (!cql || !cql.trim())
            return `(${filter})`;
        return `(${cql}) AND (${filter})`;
    }
    async listSpaces(params) {
        const response = await this.client.get('/rest/api/space', {
            params: {
                limit: params.limit ?? 25,
                start: params.start ?? 0,
                type: params.type,
                status: params.status ?? 'current',
            },
        });
        return response.data;
    }
    async getSpace(spaceKey) {
        const response = await this.client.get(`/rest/api/space/${encodeURIComponent(spaceKey)}`);
        return response.data;
    }
    async searchPages(params) {
        const response = await this.client.get('/rest/api/content/search', {
            params: {
                cql: this.mergeSpaceFilterCql(params.cql),
                limit: params.limit ?? 25,
                start: params.start ?? 0,
            },
        });
        return response.data;
    }
    async getPageById(pageId, expand) {
        const response = await this.client.get(`/rest/api/content/${encodeURIComponent(pageId)}`, {
            params: {
                expand: expand ?? 'space,version,body.view',
            },
        });
        return response.data;
    }
    async getPageByTitle(title, spaceKey, limit = 5) {
        const titleEscaped = title.replace(/"/g, '\\"');
        const baseCql = spaceKey
            ? `title = "${titleEscaped}" AND space = "${spaceKey.replace(/"/g, '\\"')}"`
            : `title = "${titleEscaped}"`;
        return this.searchPages({ cql: baseCql, limit, start: 0 });
    }
    async listPageChildren(pageId, limit = 25, start = 0) {
        const response = await this.client.get(`/rest/api/content/${encodeURIComponent(pageId)}/child/page`, { params: { limit, start } });
        return response.data;
    }
    async listAttachments(pageId, limit = 25, start = 0) {
        const response = await this.client.get(`/rest/api/content/${encodeURIComponent(pageId)}/child/attachment`, { params: { limit, start } });
        return response.data;
    }
    async listLabels(pageId, limit = 50, start = 0) {
        const response = await this.client.get(`/rest/api/content/${encodeURIComponent(pageId)}/label`, {
            params: { limit, start },
        });
        return response.data;
    }
    async getCurrentUser() {
        const response = await this.client.get('/rest/api/user/current');
        return response.data;
    }
    async createPage(spaceKey, title, body, parentPageId) {
        const data = {
            type: 'page',
            title: title,
            space: { key: spaceKey },
            body: {
                storage: {
                    value: body,
                    representation: 'storage',
                },
            },
        };
        if (parentPageId) {
            data.ancestors = [{ id: parentPageId }];
        }
        const response = await this.client.post('/rest/api/content', data);
        return response.data;
    }
    async updatePage(pageId, title, body, version, minorEdit = false) {
        const data = {
            type: 'page',
            title: title,
            version: {
                number: version,
                minorEdit: minorEdit,
            },
            body: {
                storage: {
                    value: body,
                    representation: 'storage',
                },
            },
        };
        const response = await this.client.put(`/rest/api/content/${encodeURIComponent(pageId)}`, data);
        return response.data;
    }
    async deletePage(pageId) {
        await this.client.delete(`/rest/api/content/${encodeURIComponent(pageId)}`);
        return { success: true, message: `Page ${pageId} deleted` };
    }
    async addLabel(pageId, labels) {
        const data = {
            labels: labels.map((label) => ({ name: label })),
        };
        const response = await this.client.post(`/rest/api/content/${encodeURIComponent(pageId)}/label`, data);
        return response.data;
    }
    async addComment(pageId, comment) {
        const data = {
            type: 'comment',
            container: {
                id: pageId,
                type: 'page',
            },
            body: {
                storage: {
                    value: comment,
                    representation: 'storage',
                },
            },
        };
        const response = await this.client.post('/rest/api/content', data);
        return response.data;
    }
}

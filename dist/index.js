#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { getConfig } from './config.js';
import { ConfluenceClient } from './confluence-client.js';
import { JiraClient } from './jira-client.js';
function asText(data) {
    return {
        content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
    };
}
async function main() {
    const config = getConfig();
    const confluenceClient = new ConfluenceClient(config);
    const jiraClient = config.jiraUrl && config.jiraBearerToken ? new JiraClient(config) : null;
    const server = new McpServer({
        name: 'mcp-atlassian',
        version: '0.1.0',
    });
    server.tool('list_confluence_spaces', 'List all Confluence spaces visible for the current token.', {
        limit: z.number().int().min(1).max(250).optional(),
        start: z.number().int().min(0).optional(),
        type: z.enum(['global', 'personal']).optional(),
        status: z.enum(['current', 'archived']).optional(),
    }, async (args) => asText(await confluenceClient.listSpaces(args)));
    server.tool('get_confluence_space', 'Get details for a Confluence space by key.', { spaceKey: z.string().min(1) }, async ({ spaceKey }) => asText(await confluenceClient.getSpace(spaceKey)));
    server.tool('search_confluence_pages', 'Search pages using CQL. Optional server-side space filtering can be configured via CONFLUENCE_SPACES_FILTER.', {
        cql: z.string().optional(),
        limit: z.number().int().min(1).max(250).optional(),
        start: z.number().int().min(0).optional(),
    }, async (args) => asText(await confluenceClient.searchPages(args)));
    server.tool('get_confluence_page', 'Get a Confluence page by pageId with expandable sections.', {
        pageId: z.string().min(1),
        expand: z.string().optional(),
    }, async ({ pageId, expand }) => asText(await confluenceClient.getPageById(pageId, expand)));
    server.tool('get_confluence_page_by_title', 'Find page(s) by exact title and optional space key.', {
        title: z.string().min(1),
        spaceKey: z.string().optional(),
        limit: z.number().int().min(1).max(50).optional(),
    }, async ({ title, spaceKey, limit }) => asText(await confluenceClient.getPageByTitle(title, spaceKey, limit)));
    server.tool('list_confluence_page_children', 'List child pages for a page.', {
        pageId: z.string().min(1),
        limit: z.number().int().min(1).max(250).optional(),
        start: z.number().int().min(0).optional(),
    }, async ({ pageId, limit, start }) => asText(await confluenceClient.listPageChildren(pageId, limit, start)));
    server.tool('list_confluence_page_attachments', 'List attachments for a page.', {
        pageId: z.string().min(1),
        limit: z.number().int().min(1).max(250).optional(),
        start: z.number().int().min(0).optional(),
    }, async ({ pageId, limit, start }) => asText(await confluenceClient.listAttachments(pageId, limit, start)));
    server.tool('list_confluence_page_labels', 'List labels on a page.', {
        pageId: z.string().min(1),
        limit: z.number().int().min(1).max(250).optional(),
        start: z.number().int().min(0).optional(),
    }, async ({ pageId, limit, start }) => asText(await confluenceClient.listLabels(pageId, limit, start)));
    server.tool('get_confluence_current_user', 'Get current Confluence user for the Bearer token.', {}, async () => asText(await confluenceClient.getCurrentUser()));
    if (jiraClient) {
        server.tool('get_jira_current_user', 'Get current Jira user for the Bearer token.', {}, async () => asText(await jiraClient.getCurrentUser()));
        server.tool('list_jira_projects', 'List Jira projects visible for the token.', {}, async () => asText(await jiraClient.listProjects()));
        server.tool('search_jira_issues', 'Search Jira issues with JQL.', {
            jql: z.string().optional(),
            maxResults: z.number().int().min(1).max(100).optional(),
            startAt: z.number().int().min(0).optional(),
            fields: z.array(z.string()).optional(),
        }, async (args) => asText(await jiraClient.searchIssues(args)));
        server.tool('get_jira_issue', 'Get Jira issue details by issue key.', {
            issueKey: z.string().min(1),
            fields: z.array(z.string()).optional(),
        }, async ({ issueKey, fields }) => asText(await jiraClient.getIssue(issueKey, fields)));
        server.tool('list_jira_issue_comments', 'List comments on a Jira issue.', {
            issueKey: z.string().min(1),
            startAt: z.number().int().min(0).optional(),
            maxResults: z.number().int().min(1).max(200).optional(),
        }, async ({ issueKey, startAt, maxResults }) => asText(await jiraClient.listIssueComments(issueKey, startAt, maxResults)));
        server.tool('list_jira_issue_transitions', 'List available transitions for a Jira issue.', {
            issueKey: z.string().min(1),
        }, async ({ issueKey }) => asText(await jiraClient.listIssueTransitions(issueKey)));
    }
    const transport = new StdioServerTransport();
    await server.connect(transport);
}
main().catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`mcp-atlassian startup error: ${message}\n`);
    process.exit(1);
});

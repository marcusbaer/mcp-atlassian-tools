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
    server.tool('create_confluence_page', 'Create a new Confluence page.', {
        spaceKey: z.string().min(1),
        title: z.string().min(1),
        body: z.string().min(1),
        parentPageId: z.string().optional(),
    }, async ({ spaceKey, title, body, parentPageId }) => asText(await confluenceClient.createPage(spaceKey, title, body, parentPageId)));
    server.tool('update_confluence_page', 'Update an existing Confluence page.', {
        pageId: z.string().min(1),
        title: z.string().min(1),
        body: z.string().min(1),
        version: z.number().int().min(1),
        minorEdit: z.boolean().optional(),
    }, async ({ pageId, title, body, version, minorEdit }) => asText(await confluenceClient.updatePage(pageId, title, body, version, minorEdit)));
    server.tool('delete_confluence_page', 'Delete a Confluence page.', { pageId: z.string().min(1) }, async ({ pageId }) => asText(await confluenceClient.deletePage(pageId)));
    server.tool('add_confluence_labels', 'Add labels to a Confluence page.', {
        pageId: z.string().min(1),
        labels: z.array(z.string().min(1)),
    }, async ({ pageId, labels }) => asText(await confluenceClient.addLabel(pageId, labels)));
    server.tool('add_confluence_comment', 'Add a comment to a Confluence page.', {
        pageId: z.string().min(1),
        comment: z.string().min(1),
    }, async ({ pageId, comment }) => asText(await confluenceClient.addComment(pageId, comment)));
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
        server.tool('create_jira_issue', 'Create a new Jira issue.', {
            project: z.string().min(1),
            issuetype: z.string().min(1),
            summary: z.string().min(1),
            description: z.string().optional(),
            priority: z.string().optional(),
            assignee: z.string().optional(),
            labels: z.array(z.string()).optional(),
            components: z.array(z.string()).optional(),
        }, async ({ project, issuetype, summary, description, priority, assignee, labels, components }) => asText(await jiraClient.createIssue({
            project,
            issuetype,
            summary,
            description,
            priority,
            assignee,
            labels,
            components,
        })));
        server.tool('update_jira_issue', 'Update an existing Jira issue.', {
            issueKey: z.string().min(1),
            summary: z.string().optional(),
            description: z.string().optional(),
            priority: z.string().optional(),
            assignee: z.string().optional(),
            labels: z.array(z.string()).optional(),
            components: z.array(z.string()).optional(),
        }, async ({ issueKey, summary, description, priority, assignee, labels, components }) => asText(await jiraClient.updateIssue(issueKey, {
            summary,
            description,
            priority,
            assignee,
            labels,
            components,
        })));
        server.tool('transition_jira_issue', 'Change the status of a Jira issue.', {
            issueKey: z.string().min(1),
            transitionId: z.string().min(1),
            comment: z.string().optional(),
        }, async ({ issueKey, transitionId, comment }) => asText(await jiraClient.transitionIssue(issueKey, transitionId, comment)));
        server.tool('add_jira_comment', 'Add a comment to a Jira issue.', {
            issueKey: z.string().min(1),
            comment: z.string().min(1),
            visibility: z
                .object({
                type: z.enum(['group', 'role']),
                value: z.string(),
            })
                .optional(),
        }, async ({ issueKey, comment, visibility }) => asText(await jiraClient.addComment(issueKey, comment, visibility)));
        server.tool('delete_jira_issue', 'Delete a Jira issue.', {
            issueKey: z.string().min(1),
        }, async ({ issueKey }) => asText(await jiraClient.deleteIssue(issueKey)));
    }
    const transport = new StdioServerTransport();
    await server.connect(transport);
}
main().catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`mcp-atlassian startup error: ${message}\n`);
    process.exit(1);
});

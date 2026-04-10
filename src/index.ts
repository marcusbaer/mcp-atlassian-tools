#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { getConfig } from './config.js';
import { ConfluenceClient } from './confluence-client.js';

function asText(data: unknown) {
    return {
        content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }],
    };
}

async function main() {
    const config = getConfig();
    const client = new ConfluenceClient(config);

    const server = new McpServer({
        name: 'mcp-atlassian',
        version: '0.1.0',
    });

    server.tool(
        'list_confluence_spaces',
        'List all Confluence spaces visible for the current token.',
        {
            limit: z.number().int().min(1).max(250).optional(),
            start: z.number().int().min(0).optional(),
            type: z.enum(['global', 'personal']).optional(),
            status: z.enum(['current', 'archived']).optional(),
        },
        async (args) => asText(await client.listSpaces(args))
    );

    server.tool(
        'get_confluence_space',
        'Get details for a Confluence space by key.',
        { spaceKey: z.string().min(1) },
        async ({ spaceKey }) => asText(await client.getSpace(spaceKey))
    );

    server.tool(
        'search_confluence_pages',
        'Search pages using CQL. Optional server-side space filtering can be configured via CONFLUENCE_SPACES_FILTER.',
        {
            cql: z.string().optional(),
            limit: z.number().int().min(1).max(250).optional(),
            start: z.number().int().min(0).optional(),
        },
        async (args) => asText(await client.searchPages(args))
    );

    server.tool(
        'get_confluence_page',
        'Get a Confluence page by pageId with expandable sections.',
        {
            pageId: z.string().min(1),
            expand: z.string().optional(),
        },
        async ({ pageId, expand }) => asText(await client.getPageById(pageId, expand))
    );

    server.tool(
        'get_confluence_page_by_title',
        'Find page(s) by exact title and optional space key.',
        {
            title: z.string().min(1),
            spaceKey: z.string().optional(),
            limit: z.number().int().min(1).max(50).optional(),
        },
        async ({ title, spaceKey, limit }) => asText(await client.getPageByTitle(title, spaceKey, limit))
    );

    server.tool(
        'list_confluence_page_children',
        'List child pages for a page.',
        {
            pageId: z.string().min(1),
            limit: z.number().int().min(1).max(250).optional(),
            start: z.number().int().min(0).optional(),
        },
        async ({ pageId, limit, start }) => asText(await client.listPageChildren(pageId, limit, start))
    );

    server.tool(
        'list_confluence_page_attachments',
        'List attachments for a page.',
        {
            pageId: z.string().min(1),
            limit: z.number().int().min(1).max(250).optional(),
            start: z.number().int().min(0).optional(),
        },
        async ({ pageId, limit, start }) => asText(await client.listAttachments(pageId, limit, start))
    );

    server.tool(
        'list_confluence_page_labels',
        'List labels on a page.',
        {
            pageId: z.string().min(1),
            limit: z.number().int().min(1).max(250).optional(),
            start: z.number().int().min(0).optional(),
        },
        async ({ pageId, limit, start }) => asText(await client.listLabels(pageId, limit, start))
    );

    server.tool(
        'get_confluence_current_user',
        'Get current Confluence user for the Bearer token.',
        {},
        async () => asText(await client.getCurrentUser())
    );

    const transport = new StdioServerTransport();
    await server.connect(transport);
}

main().catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`mcp-atlassian startup error: ${message}\n`);
    process.exit(1);
});

# mcp-atlassian

Node.js MCP server for Confluence (Data Center/Server) using Bearer token authentication.

## Features

- `list_confluence_spaces`
- `get_confluence_space`
- `search_confluence_pages`
- `get_confluence_page`
- `get_confluence_page_by_title`
- `list_confluence_page_children`
- `list_confluence_page_attachments`
- `list_confluence_page_labels`
- `get_confluence_current_user`

## Configuration

Create a `.env` file in this project root:

```env
CONFLUENCE_BASE_URL=your_confluence_url_here
CONFLUENCE_BEARER_TOKEN=your_pat_here
CONFLUENCE_SSL_VERIFY=true
# optional
# CONFLUENCE_SPACES_FILTER=SPACE,TEAM
```

## Run

```bash
npm install
npm run build
npm start
```

The server uses stdio transport and can be wired into VS Code MCP config.

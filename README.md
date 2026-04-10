# mcp-atlassian-tools

Node.js MCP server for Confluence (Data Center/Server) using Bearer token authentication and JIRA.

Optional JIRA tools are enabled when `JIRA_URL` and `JIRA_BEARER_TOKEN` are set.

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

Optional Jira tools:

- `get_jira_current_user`
- `list_jira_projects`
- `search_jira_issues`
- `get_jira_issue`
- `list_jira_issue_comments`
- `list_jira_issue_transitions`

## Usage with npm

The server uses stdio transport and can be wired e.g. into VS Code MCP config.

Define the MCP tool in your client, e.g. like this:

```json
"mcp-atlassian-tools": {
    "command": "npx",
    "args": ["-y", "mcp-atlassian-tools"],
    "env": {
        "CONFLUENCE_BASE_URL": "",
        "CONFLUENCE_BEARER_TOKEN": "",
        "CONFLUENCE_SPACES_FILTER": "",
        "JIRA_URL": "",
        "JIRA_BEARER_TOKEN": ""
    }
}
```

Make sure to enable the tools, if needed.

## Local Usage

### Configuration

Create a `.env` file in this project root:

```env
CONFLUENCE_BASE_URL=your_confluence_url_here
CONFLUENCE_BEARER_TOKEN=your_pat_here
CONFLUENCE_SSL_VERIFY=true
# optional
# CONFLUENCE_SPACES_FILTER=SPACE,TEAM

# optional JIRA
# JIRA_URL=your_jira_url_here
# JIRA_BEARER_TOKEN=your_jira_pat_here
# JIRA_SSL_VERIFY=true
# JIRA_PROJECTS_FILTER=PROJ,TEAM
```

### Run

```bash
npm install
npm run build
npm start
```

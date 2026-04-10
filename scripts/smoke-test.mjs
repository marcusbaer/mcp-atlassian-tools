import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function run() {
  const transport = new StdioClientTransport({
    command: "node",
    args: ["./dist/index.js"],
  });

  const client = new Client(
    { name: "smoke-test-client", version: "1.0.0" },
    { capabilities: {} },
  );

  await client.connect(transport);

  const tools = await client.listTools();
  const hasListSpaces = tools.tools.some(
    (tool) => tool.name === "list_confluence_spaces",
  );

  if (!hasListSpaces) {
    throw new Error("Tool list_confluence_spaces is not registered");
  }

  const spaces = await client.callTool({
    name: "list_confluence_spaces",
    arguments: { limit: 5, status: "current" },
  });

  const textPart = spaces.content.find((c) => c.type === "text");
  if (!textPart || typeof textPart.text !== "string") {
    throw new Error(
      "Unexpected tool response format for list_confluence_spaces",
    );
  }

  const parsed = JSON.parse(textPart.text);
  const resultCount = Array.isArray(parsed.results) ? parsed.results.length : 0;

  console.log(
    JSON.stringify(
      {
        toolRegistered: true,
        total: parsed.size ?? parsed.totalSize ?? null,
        returnedResults: resultCount,
        firstResult: parsed.results?.[0]
          ? {
              key: parsed.results[0].key,
              name: parsed.results[0].name,
              type: parsed.results[0].type,
              status: parsed.results[0].status,
            }
          : null,
      },
      null,
      2,
    ),
  );

  await client.close();
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

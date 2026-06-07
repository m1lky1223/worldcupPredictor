import http from "http";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";

// Export the core server instance so apps/web can import it
export const mcpServer = new Server(
  {
    name: "worldcup-mcp",
    version: "1.0.0"
  },
  {
    capabilities: {
      resources: {},
      tools: {},
      prompts: {}
    }
  }
);

let transport: SSEServerTransport | null = null;

export async function handleSseConnection(res: http.ServerResponse) {
  transport = new SSEServerTransport("/message", res);
  await mcpServer.connect(transport);
}

export async function handlePostMessage(req: http.IncomingMessage, res: http.ServerResponse) {
  if (transport) {
    await transport.handlePostMessage(req, res);
  } else {
    res.writeHead(400, { "Content-Type": "text/plain" });
    res.end("No active SSE session");
  }
}

// standalone HTTP server startup check
const isMain = process.argv[1]?.includes("apps/mcp/src/index.ts") || 
               process.argv[1]?.includes("apps/mcp/dist/index.js") || 
               (typeof require !== "undefined" && require.main === module);

if (isMain) {
  const httpServer = http.createServer(async (req, res) => {
    // CORS headers for local development
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      res.writeHead(200);
      res.end();
      return;
    }

    const url = new URL(req.url || "", `http://${req.headers.host}`);
    if (req.method === "GET" && url.pathname === "/sse") {
      await handleSseConnection(res);
    } else if (req.method === "POST" && url.pathname === "/message") {
      await handlePostMessage(req, res);
    } else {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not Found");
    }
  });

  const port = process.env.PORT || 4001;
  httpServer.listen(port, () => {
    console.log(`MCP server listening on port ${port}`);
  });
}

import { query, type Options, type McpServerConfig } from "@anthropic-ai/claude-agent-sdk";

export const MCP_CONFIG: McpServerConfig = {
  type: "stdio",
  command: "npx",
  args: ["-y", "@modelcontextprotocol/server-fetch"],
};

export const ALLOWED_TOOLS = [
  "mcp__mcp__fetch"
];

export const SYSTEM_PROMPT = `You are a Random Fact agent. Your purpose is to fetch and share interesting random facts from various sources on the internet. When a user asks for a fact, use the fetch tool to retrieve facts from reliable random fact APIs or websites, then present them in an engaging and educational way. You can fetch facts about specific topics if requested, or provide general random facts. Always cite your sources when sharing facts.`;

export function getOptions(standalone = false): Options {
  return {
    systemPrompt: SYSTEM_PROMPT,
    model: "haiku",
    allowedTools: ALLOWED_TOOLS,
    maxTurns: 50,
    ...(standalone && { mcpServers: { mcp: MCP_CONFIG } }),
  };
}

export async function* streamAgent(prompt: string) {
  for await (const msg of query({ prompt, options: getOptions(true) })) {
    if (msg.type === "assistant") {
      for (const b of (msg as any).message?.content || []) {
        if (b.type === "text") yield { type: "text", text: b.text };
        if (b.type === "tool_use") yield { type: "tool", name: b.name };
      }
    }
    if ((msg as any).message?.usage) {
      const u = (msg as any).message.usage;
      yield { type: "usage", input: u.input_tokens || 0, output: u.output_tokens || 0 };
    }
    if ("result" in msg) yield { type: "result", text: msg.result };
  }
  yield { type: "done" };
}

# MCP Server One

A comprehensive guide to creating Model Context Protocol (MCP) servers with examples and best practices.

## What is MCP?

The Model Context Protocol (MCP) is an open protocol that enables secure connections between host applications (like Claude Desktop, IDEs, or other AI tools) and external data sources. MCP servers act as intermediaries that can provide tools, resources, and prompts to AI models in a standardized way.

## Getting Started

### Prerequisites

- Node.js 18+ or Python 3.8+
- Basic understanding of TypeScript/JavaScript or Python
- Familiarity with JSON-RPC protocol concepts

### Core Concepts

Before building an MCP server, understand these key concepts:

- **Tools**: Functions that the AI can call to perform actions
- **Resources**: Data that the AI can read (files, API responses, etc.)
- **Prompts**: Pre-defined prompt templates with arguments
- **Transports**: Communication layers (stdio, HTTP, WebSocket)

## Step-by-Step Guide to Create an MCP Server

### Step 1: Choose Your Implementation Language

MCP servers can be built in multiple languages. The most common are:

- **TypeScript/JavaScript**: Using the official MCP SDK
- **Python**: Using the official Python SDK
- **Other languages**: Following the JSON-RPC specification

### Step 2: Set Up Your Development Environment

#### For TypeScript/JavaScript:

```bash
# Create a new project
mkdir my-mcp-server
cd my-mcp-server

# Initialize npm project
npm init -y

# Install MCP SDK
npm install @modelcontextprotocol/sdk

# Install development dependencies
npm install -D typescript @types/node tsx
```

#### For Python:

```bash
# Create a new project
mkdir my-mcp-server
cd my-mcp-server

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install MCP SDK
pip install mcp
```

### Step 3: Implement Basic Server Structure

#### TypeScript Example:

```typescript
#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const server = new Server(
  {
    name: "my-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "echo",
        description: "Echo back the input",
        inputSchema: {
          type: "object",
          properties: {
            message: {
              type: "string",
              description: "Message to echo",
            },
          },
          required: ["message"],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "echo") {
    return {
      content: [
        {
          type: "text",
          text: `Echo: ${args.message}`,
        },
      ],
    };
  }

  throw new Error(`Unknown tool: ${name}`);
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MCP Server running on stdio");
}

main().catch(console.error);
```

#### Python Example:

```python
#!/usr/bin/env python3
import asyncio
import sys
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Tool, TextContent

app = Server("my-mcp-server")

@app.list_tools()
async def list_tools() -> list[Tool]:
    return [
        Tool(
            name="echo",
            description="Echo back the input",
            inputSchema={
                "type": "object",
                "properties": {
                    "message": {
                        "type": "string",
                        "description": "Message to echo"
                    }
                },
                "required": ["message"]
            }
        )
    ]

@app.call_tool()
async def call_tool(name: str, arguments: dict) -> list[TextContent]:
    if name == "echo":
        message = arguments.get("message", "")
        return [TextContent(type="text", text=f"Echo: {message}")]
    
    raise ValueError(f"Unknown tool: {name}")

async def main():
    async with stdio_server() as streams:
        await app.run(*streams)

if __name__ == "__main__":
    asyncio.run(main())
```

### Step 4: Configure Your Server

Create a configuration file to register your server with MCP clients:

#### `mcp-config.json` (for Claude Desktop):

```json
{
  "mcpServers": {
    "my-mcp-server": {
      "command": "node",
      "args": ["path/to/your/server.js"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

### Step 5: Test Your Server

Create a test script to verify functionality:

```bash
# Test with MCP Inspector (recommended)
npx @modelcontextprotocol/inspector node server.js

# Or test manually with stdio
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}' | node server.js
```

## Advanced Features

### Adding Resources

Resources allow your server to provide readable content:

```typescript
// TypeScript example
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: "file://example.txt",
        name: "Example File",
        description: "An example text file",
        mimeType: "text/plain",
      },
    ],
  };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;
  
  if (uri === "file://example.txt") {
    return {
      contents: [
        {
          uri,
          mimeType: "text/plain",
          text: "Hello from MCP server!",
        },
      ],
    };
  }
  
  throw new Error(`Resource not found: ${uri}`);
});
```

### Adding Prompts

Prompts provide reusable prompt templates:

```typescript
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return {
    prompts: [
      {
        name: "summarize",
        description: "Summarize the given text",
        arguments: [
          {
            name: "text",
            description: "Text to summarize",
            required: true,
          },
        ],
      },
    ],
  };
});

server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  if (name === "summarize") {
    return {
      description: "Summarize the given text",
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Please summarize the following text: ${args.text}`,
          },
        },
      ],
    };
  }
  
  throw new Error(`Unknown prompt: ${name}`);
});
```

## Best Practices

### Security
- Validate all inputs thoroughly
- Use environment variables for sensitive configuration
- Implement proper error handling
- Follow principle of least privilege

### Performance
- Use async/await for I/O operations
- Implement caching where appropriate
- Handle timeouts gracefully
- Optimize resource usage

### Error Handling
```typescript
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    // Tool implementation
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});
```

## Official Examples and Documentation

### Official MCP Repository
- **GitHub**: [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers)
- Contains numerous example servers including:
  - File system operations
  - Database connections
  - API integrations
  - Git operations
  - Web scraping

### Official Documentation
- **MCP Specification**: [MCP Docs](https://modelcontextprotocol.io/docs)
- **TypeScript SDK**: [SDK Documentation](https://modelcontextprotocol.io/docs/sdk/typescript)
- **Python SDK**: [Python SDK Guide](https://modelcontextprotocol.io/docs/sdk/python)

### Example Servers to Study

1. **Filesystem Server**: [filesystem example](https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem)
   - File operations, directory listing
   - Resource and tool implementations

2. **Git Server**: [git example](https://github.com/modelcontextprotocol/servers/tree/main/src/git)
   - Git repository operations
   - Complex tool chains

3. **SQLite Server**: [sqlite example](https://github.com/modelcontextprotocol/servers/tree/main/src/sqlite)
   - Database connectivity
   - Query execution

4. **Web Search Server**: [search example](https://github.com/modelcontextprotocol/servers/tree/main/src/brave-search)
   - External API integration
   - Result formatting

### Community Examples
- **MCP Hub**: [mcphub.io](https://mcphub.io) - Community-driven collection of MCP servers
- **GitHub Topics**: Search for [mcp-server](https://github.com/topics/mcp-server) topic

## Deployment Options

### Local Development
- Use stdio transport for development
- Test with MCP Inspector
- Configure in Claude Desktop

### Production Deployment
- Consider HTTP/WebSocket transports for scalability
- Implement proper logging and monitoring
- Use process managers (PM2, systemd)
- Consider containerization with Docker

## Common Patterns

### Environment Configuration
```typescript
const config = {
  apiKey: process.env.API_KEY,
  baseUrl: process.env.BASE_URL || 'https://api.example.com',
  timeout: parseInt(process.env.TIMEOUT || '5000'),
};
```

### Rate Limiting
```typescript
import { RateLimiter } from 'limiter';

const limiter = new RateLimiter(10, 'second');

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  await limiter.removeTokens(1);
  // Tool implementation
});
```

### Caching
```typescript
const cache = new Map();

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;
  
  if (cache.has(uri)) {
    return cache.get(uri);
  }
  
  const result = await fetchResource(uri);
  cache.set(uri, result);
  return result;
});
```

## Troubleshooting

### Common Issues
1. **Transport Errors**: Ensure proper stdio handling
2. **Schema Validation**: Verify input/output schemas match specification
3. **Async Handling**: Use proper async/await patterns
4. **Error Responses**: Return proper error structures

### Debugging Tips
- Use MCP Inspector for interactive testing
- Enable debug logging
- Test individual components separately
- Validate JSON-RPC messages

## Contributing

Feel free to contribute examples, improvements, or additional documentation to this repository. Please follow the MCP community guidelines and ensure all examples are well-documented and tested.

## License

MIT License - feel free to use this guide and examples in your own projects.

---

For more information, visit the [official MCP documentation](https://modelcontextprotocol.io/docs) or join the community discussions on GitHub.

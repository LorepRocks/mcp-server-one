import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
  CallToolResult,
  TextContent,
  ErrorCode,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";

interface WeatherData {
  name: string;
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
    pressure: number;
  };
  weather: Array<{
    main: string;
    description: string;
  }>;
  wind: {
    speed: number;
  };
  sys: {
    country: string;
  };
}

class WeatherMCPServer {
  private server: Server;
  private apiKey: string;

  constructor() {
    this.server = new Server(
      {
        name: "weather-mcp-server",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Get API key from environment variable
    this.apiKey = process.env.OPENWEATHER_API_KEY || "";
    
    if (!this.apiKey) {
      console.warn("Warning: OPENWEATHER_API_KEY environment variable not set. Weather functionality will be limited.");
    }

    this.setupHandlers();
  }

  private setupHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const tools: Tool[] = [
        {
          name: "get_weather",
          description: "Get current weather information for a specified city",
          inputSchema: {
            type: "object",
            properties: {
              city: {
                type: "string",
                description: "The name of the city to get weather for",
              },
              country: {
                type: "string",
                description: "Optional: ISO 3166-1 alpha-2 country code (e.g., 'US', 'FR')",
              },
            },
            required: ["city"],
          },
        },
      ];

      return { tools };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      if (name === "get_weather") {
        return await this.handleGetWeather(args);
      }

      throw new McpError(
        ErrorCode.MethodNotFound,
        `Unknown tool: ${name}`
      );
    });
  }

  private async handleGetWeather(args: any): Promise<CallToolResult> {
    try {
      const { city, country } = args;

      if (!city || typeof city !== "string") {
        throw new McpError(
          ErrorCode.InvalidParams,
          "City parameter is required and must be a string"
        );
      }

      if (!this.apiKey) {
        return {
          content: [
            {
              type: "text",
              text: "Weather service is not configured. Please set OPENWEATHER_API_KEY environment variable.",
            } as TextContent,
          ],
        };
      }

      const weatherData = await this.fetchWeatherData(city, country);
      const formattedWeather = this.formatWeatherData(weatherData);

      return {
        content: [
          {
            type: "text",
            text: formattedWeather,
          } as TextContent,
        ],
      };
    } catch (error) {
      if (error instanceof McpError) {
        throw error;
      }

      return {
        content: [
          {
            type: "text",
            text: `Error fetching weather data: ${error instanceof Error ? error.message : "Unknown error"}`,
          } as TextContent,
        ],
      };
    }
  }

  private async fetchWeatherData(city: string, country?: string): Promise<WeatherData> {
    const location = country ? `${city},${country}` : city;
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&appid=${this.apiKey}&units=metric`;

    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`City "${city}" not found`);
      } else if (response.status === 401) {
        throw new Error("Invalid API key");
      } else {
        throw new Error(`Weather service error: ${response.status}`);
      }
    }

    const data = await response.json();
    return data as WeatherData;
  }

  private formatWeatherData(data: WeatherData): string {
    const temp = Math.round(data.main.temp);
    const feelsLike = Math.round(data.main.feels_like);
    const condition = data.weather[0].description;
    const windSpeed = Math.round(data.wind.speed * 3.6); // Convert m/s to km/h

    return `🌡️ **Weather in ${data.name}, ${data.sys.country}**

**Current Conditions:**
- Temperature: ${temp}°C (feels like ${feelsLike}°C)
- Condition: ${condition}
- Humidity: ${data.main.humidity}%
- Pressure: ${data.main.pressure} hPa
- Wind Speed: ${windSpeed} km/h

*Data provided by OpenWeatherMap*`;
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Weather MCP Server running on stdio");
  }
}

// Main execution
async function main() {
  const server = new WeatherMCPServer();
  await server.run();
}

// Handle process termination gracefully
process.on("SIGINT", () => {
  console.error("Received SIGINT, shutting down gracefully...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.error("Received SIGTERM, shutting down gracefully...");
  process.exit(0);
});

if (require.main === module) {
  main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}

export default WeatherMCPServer;

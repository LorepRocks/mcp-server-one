# Weather MCP Server

A Model Context Protocol (MCP) server implementation that provides weather information using the TypeScript SDK. This server allows AI assistants to fetch current weather data for any city worldwide using the OpenWeatherMap API.

## Features

- 🌤️ **Current Weather Data**: Get real-time weather information for any city
- 🌍 **Global Coverage**: Support for cities worldwide with optional country specification
- 🔧 **TypeScript SDK**: Built using the official MCP TypeScript SDK
- ⚡ **Fast & Reliable**: Efficient API calls with proper error handling
- 🛡️ **Error Handling**: Comprehensive error handling for various scenarios

## Installation

### Prerequisites

- Node.js 18.0.0 or higher
- npm or yarn package manager
- OpenWeatherMap API key (free at [openweathermap.org](https://openweathermap.org/api))

### Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/LorepRocks/mcp-server-one.git
   cd mcp-server-one
   git checkout weather-feature
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Get an OpenWeatherMap API key**:
   - Sign up at [OpenWeatherMap](https://openweathermap.org/api)
   - Create a free API key
   - Set the environment variable:
     ```bash
     export OPENWEATHER_API_KEY=your_api_key_here
     ```

4. **Build the project**:
   ```bash
   npm run build
   ```

## Usage

### Running the Server

**Development mode**:
```bash
npm run dev
```

**Production mode**:
```bash
npm run build
npm start
```

### Available Tools

#### `get_weather`

Get current weather information for a specified city.

**Parameters**:
- `city` (required): The name of the city to get weather for
- `country` (optional): ISO 3166-1 alpha-2 country code (e.g., 'US', 'FR')

**Example Usage**:
```typescript
// Basic usage
{
  "name": "get_weather",
  "arguments": {
    "city": "London"
  }
}

// With country specification
{
  "name": "get_weather",
  "arguments": {
    "city": "London",
    "country": "GB"
  }
}
```

**Example Response**:
```
🌡️ **Weather in London, GB**

**Current Conditions:**
- Temperature: 15°C (feels like 14°C)
- Condition: partly cloudy
- Humidity: 72%
- Pressure: 1013 hPa
- Wind Speed: 12 km/h

*Data provided by OpenWeatherMap*
```

## Configuration

### Environment Variables

- `OPENWEATHER_API_KEY`: Your OpenWeatherMap API key (required)

### MCP Client Configuration

To use this server with an MCP client, add the following configuration:

```json
{
  "mcpServers": {
    "weather": {
      "command": "node",
      "args": ["path/to/mcp-server-one/dist/index.js"],
      "env": {
        "OPENWEATHER_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

## Development

### Project Structure

```
mcp-server-one/
├── index.ts           # Main server implementation
├── package.json       # Dependencies and scripts
├── tsconfig.json      # TypeScript configuration
├── dist/              # Compiled JavaScript files
└── README.md          # This file
```

### Scripts

- `npm run build`: Compile TypeScript to JavaScript
- `npm run dev`: Run in development mode with tsx
- `npm start`: Run the compiled server
- `npm run type-check`: Check TypeScript types without emitting

### API Integration

This server uses the [OpenWeatherMap Current Weather API](https://openweathermap.org/current) which provides:

- Current weather conditions
- Temperature (in Celsius)
- Humidity, pressure, and wind information
- Weather descriptions
- Geographic coordinates

## Error Handling

The server handles various error scenarios:

- **Invalid API key**: Returns appropriate error message
- **City not found**: Informs user when a city cannot be located
- **Network errors**: Handles API connection issues
- **Invalid parameters**: Validates input parameters
- **Rate limiting**: Handles API rate limit responses

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Support

For questions or issues:

1. Check the [OpenWeatherMap API documentation](https://openweathermap.org/api)
2. Review the [MCP specification](https://modelcontextprotocol.io/)
3. Open an issue in this repository

## Acknowledgments

- Built with the [Model Context Protocol TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- Weather data provided by [OpenWeatherMap](https://openweathermap.org/)
- Inspired by the MCP community and examples

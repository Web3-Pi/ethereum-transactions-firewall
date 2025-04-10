# Ethereum Transaction Firewall - TypeScript Source

This directory contains the TypeScript source code for the Ethereum Transaction Firewall.

## Project Structure

- **config/**: Configuration helpers and environment variable handling
- **worker/**: Core functionality of the transaction firewall
  - **common/**: Shared utilities and helpers
    - **connection/**: WebSocket and network-related code
    - **transactions/**: Transaction parsing and validation
      - **contracts/**: Contract-specific data parsers and helpers
    - **util/**: General utility functions
  - **proxy/**: HTTP proxy for intercepting and validating transactions
  - **session/**: User session management

## Building and Running

To build the TypeScript code:

```bash
npm run build
```

This will compile the TypeScript source to JavaScript in the `dist/` directory.

To run the application:

```bash
npm start
```

For development with automatic reloading:

```bash
npm run dev
```

## TypeScript Migration

This codebase has been migrated from JavaScript to TypeScript. The original JavaScript code has been backed up in the `backup/` directory at the project root.

The migration provides:

- Type safety for improved code reliability
- Better code organization with proper interfaces
- Modern ES module imports
- Enhanced IDE support with autocompletion
- More robust error handling
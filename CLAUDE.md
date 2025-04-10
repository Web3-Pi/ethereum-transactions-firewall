# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Test Commands
- Build: `npm run build`
- Start: `npm run start`
- Development: `npm run dev`
- Typecheck: `npm run typecheck`
- Lint: `npm run lint`
- Run manual test: `npm run test:manual`

## Code Style Guidelines
- Use TypeScript with ES modules (import/export)
- Use 2-space indentation and single quotes for strings
- Omit trailing semicolons
- Group imports by source in this order:
  1. Node core modules
  2. External libraries/packages
  3. Project modules (relative imports)
- Use strict typing; avoid `any` where possible
- Use interfaces for object shapes and function signatures
- Variables and methods: camelCase
- Classes and interfaces: PascalCase
- Private class members: prefix with underscore (_) or use private keyword
- Files: camelCase.ts
- Directories: lowercase

## Architecture
- Worker: Core transaction validation logic
- Public: Frontend UI components
- Config: Application configuration
- Test: Manual testing utilities
- TypeScript sources in src/, compiled output in dist/

## Areas Needing Improvement
- Complete the migration from JavaScript to TypeScript
- Add proper error handling to all async operations
- Implement comprehensive testing
- Replace deprecated dependencies with modern alternatives
- Address FIXME comments throughout codebase
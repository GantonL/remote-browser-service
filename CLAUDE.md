# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Remote Browser Service - a Deno-based REST API for generating PDFs, snapshots, and executing browser automations using the Danet framework (Deno's NestJS equivalent).

## Technology Stack

- **Runtime**: Deno
- **Framework**: Danet (@danet/core) - decorator-based framework similar to NestJS
- **API Documentation**: Swagger UI available at `/api` endpoint
- **Configuration**: Uses decorators for dependency injection, routing, and module organization

## Commands

### Development
```bash
deno task launch-server  # Start dev server (default port: 3000, configurable via PORT env var)
```

### Testing
```bash
deno task test           # Run all tests in spec/ directory
```

### Code Quality
```bash
deno lint                # Lint code (excludes require-await rule)
deno fmt                 # Format code (uses single quotes)
```

## Architecture

### Module Structure

The codebase follows Danet's modular architecture pattern (similar to NestJS):

- **Root Module**: `AppModule` (src/app.module.ts) - imports feature modules
- **Feature Modules**: Located in `src/modules/`, each contains:
  - `module.ts` - module definition with @Module decorator
  - `controller.ts` - HTTP endpoints with @Controller decorator
  - `service.ts` - business logic with @Injectable decorator

### Bootstrap Flow

1. `run.ts` → calls bootstrap function
2. `src/bootstrap.ts` → initializes DanetApplication with:
   - AppModule as root
   - Swagger docs at `/api`
   - Global logger middleware
3. Application listens on configured PORT

### Adding New Features

When adding new feature modules (e.g., snapshots, automation):

1. Create module directory under `src/modules/[feature-name]/`
2. Implement: `module.ts`, `controller.ts`, `service.ts`
3. Import module in `src/app.module.ts`
4. Shared services go in `src/core/services/`

### Dependency Injection

Uses TypeScript decorators (experimentalDecorators + emitDecoratorMetadata enabled):
- `@Module()` - define modules with controllers and injectables
- `@Controller()` - define route prefix
- `@Injectable()` - mark classes for DI
- `@Post()`, `@Get()`, etc. - HTTP method decorators
- Constructor injection for dependencies

## Important Notes

- Requires `--unstable` flag for Deno runtime features
- All permissions (-A flags) required for full functionality
- Environment variables loaded via @std/dotenv
- Tests should be placed in `spec/` directory

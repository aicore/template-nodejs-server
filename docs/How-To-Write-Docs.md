# How To Write Documentation

This document outlines how documentation is handled in template-nodejs.

## Table of Contents

1. [The `docs` Folder](#the-docs-folder)
2. [API Documentation](#api-documentation)
3. [Writing JSDoc](#writing-jsdoc)
4. [JSDoc Examples](#jsdoc-examples)
5. [Generating Documentation](#generating-documentation)

---

## The `docs` Folder

The `docs` folder contains both manual documentation and auto-generated API documentation.

### Docs Folder Structure

```
docs/
├── How-To-Write-Docs.md          # This file
├── generatedApiDocs/              # Auto-generated API docs (DO NOT EDIT MANUALLY)
│   └── index-API.md
└── (your manual documentation)    # Any additional markdown docs you create
```

**Important Notes:**
- Files in `docs/generatedApiDocs/` are auto-generated and should **never** be manually edited
- Any manual changes to generated docs will be lost when regenerated
- Manual documentation can be added directly to the `docs/` folder

---

## API Documentation

This project uses [JSDoc](https://jsdoc.app/) to automatically generate API documentation from source code comments.

### Including Files in API Docs

To include any `.js` file in the generated API documentation, add this comment anywhere in the file:

```js
// @INCLUDE_IN_API_DOCS
```

**Example:**
```js
/*
 * GNU AGPL-3.0 License
 * Copyright (c) 2021 - present core.ai . All rights reserved.
 */

// @INCLUDE_IN_API_DOCS

/**
 * Write your module docs here. tell something about this module in markdown.
 *
 * @module hello
 */

export function greet(name) {
    return `Hello ${name}!`;
}
```

---

## Writing JSDoc

JSDoc comments use the `/** */` format and support various tags to document your code.

### Basic Structure

```js
/**
 * Brief description of the function
 *
 * @param {string} name - Parameter description
 * @returns {string} Return value description
 */
function greet(name) {
    return `Hello ${name}!`;
}
```

### Common JSDoc Tags

| Tag | Purpose | Example |
|-----|---------|---------|
| `@module` | Declare a module | `@module utils/logger` |
| `@param` | Document parameter | `@param {string} name - User name` |
| `@returns` | Document return value | `@returns {boolean} Success status` |
| `@type` | Declare type | `@type {number}` |
| `@typedef` | Define custom type | `@typedef {Object} Config` |
| `@example` | Add usage example | `@example greet("World")` |
| `@private` | Mark as private (excluded from docs) | `@private` |

---

## JSDoc Examples

### 1. Declaring a Module with `@module`

Use this to declare top-level JS modules:

```js
/**
 * Logger utility for stage-based logging
 *
 * Provides createLogger() for app logging and createFastifyLogger()
 * for Fastify server logging. Automatically adapts based on stage:
 * - Development: Pretty, colorized logs
 * - Production: ECS JSON format for Elasticsearch
 *
 * @module utils/logger
 */
```

**Result in docs:**
> ## utils/logger
> Logger utility for stage-based logging
>
> Provides createLogger() for app logging and createFastifyLogger()
> for Fastify server logging. Automatically adapts based on stage:
> - Development: Pretty, colorized logs
> - Production: ECS JSON format for Elasticsearch

### 2. Documenting Functions

```js
/**
 * Gets the stage from app.json and sets NODE_ENV accordingly
 *
 * Supports both short and long stage names:
 * - "dev" or "development" → NODE_ENV="development"
 * - "prod" or "production" → NODE_ENV="production"
 *
 * @returns {string} The stage value from config
 * @example
 * const stage = getStage();
 * console.log(stage); // "dev" or "prod"
 */
export function getStage() {
    // implementation
}
```

### 3. Documenting Parameters

```js
/**
 * Creates a Fastify logger configuration based on the stage
 *
 * @param {Object} options - Logger options
 * @param {boolean} options.colorize - Enable colors in development
 * @param {string} options.level - Log level (default: 'info')
 * @returns {Object} Fastify logger configuration
 */
export function createFastifyLogger(options = {}) {
    // implementation
}
```

### 4. Constants and Types

```js
/**
 * The maximum number of retry attempts
 * @const {number}
 */
const MAX_RETRIES = 3;

/**
 * HTTP status codes
 * @typedef {Object} StatusCodes
 * @property {number} OK - Success status (200)
 * @property {number} NOT_FOUND - Not found status (404)
 * @property {number} ERROR - Server error status (500)
 */
const STATUS_CODES = {
    OK: 200,
    NOT_FOUND: 404,
    ERROR: 500
};
```

### 5. Complex Types with @typedef

```js
/**
 * Application configuration object
 *
 * @typedef {Object} AppConfig
 * @property {string} stage - Environment stage ('dev' or 'prod')
 * @property {number} port - Server port number
 * @property {string} authKey - Authentication key
 * @property {boolean} allowPublicAccess - Allow public access
 * @property {LogConfig} [log] - Optional logging configuration
 */

/**
 * Logging configuration for Elasticsearch
 *
 * @typedef {Object} LogConfig
 * @property {string} elasticsearch_host - Elasticsearch host URL
 * @property {string} elasticsearch_api_key - API key for authentication
 */
```

### 6. Private Documentation

Use `@private` to exclude from generated documentation:

```js
/**
 * Internal helper function
 * @private
 */
function _internalHelper() {
    // This won't appear in generated docs
}
```

### 7. Examples with @example

```js
/**
 * Validates configuration object
 *
 * @param {Object} config - Configuration to validate
 * @returns {boolean} True if valid
 * @throws {Error} If configuration is invalid
 *
 * @example
 * // Valid configuration
 * const valid = validateConfig({
 *     stage: 'dev',
 *     port: 5000
 * });
 *
 * @example <caption>Invalid configuration throws error</caption>
 * validateConfig({}); // throws Error: Missing stage field
 */
function validateConfig(config) {
    // implementation
}
```

---

## Generating Documentation

### Build Documentation

Run one of these commands to generate API documentation:

```bash
# Generate docs only
npm run createJSDocs

# Run full build (includes docs generation)
npm run build
```

### Where Docs Are Generated

Generated documentation is created in `docs/generatedApiDocs/`:

```
docs/generatedApiDocs/
├── index-API.md           # Main API documentation
└── (other generated files)
```

### Review Generated Docs

After generation:
1. Review the generated markdown files in `docs/generatedApiDocs/`
2. Commit the generated docs if there are changes
3. The documentation will be available in your repository

---

## Best Practices

### 1. Always Include Module Documentation

Start each file with a module declaration:

```js
// @INCLUDE_IN_API_DOCS

/**
 * Brief description of what this module does
 *
 * @module path/to/module
 */
```

### 2. Document All Public Functions

Every exported function should have JSDoc:

```js
/**
 * What the function does
 *
 * @param {Type} param - Parameter description
 * @returns {Type} Return value description
 */
export function myFunction(param) {
    // implementation
}
```

### 3. Use Examples Liberally

Examples help users understand how to use your API:

```js
/**
 * Function description
 *
 * @example
 * const result = myFunction('input');
 * console.log(result); // 'output'
 */
```

### 4. Mark Internal Functions as Private

Don't pollute public docs with internal helpers:

```js
/**
 * @private
 */
function _internalHelper() {
    // not in public docs
}
```

### 5. Keep Descriptions Clear and Concise

- Start with a brief summary
- Add details in subsequent paragraphs
- Use markdown formatting for clarity

### 6. Update Docs When Changing Code

- Regenerate docs after API changes
- Commit documentation changes with code changes
- Keep docs in sync with implementation

---

## Additional Resources

- [JSDoc Official Documentation](https://jsdoc.app/)
- [JSDoc Tags Reference](https://jsdoc.app/index.html#block-tags)
- [documentation.js](https://documentation.js.org/) - The tool we use for generation
- [Markdown Guide](https://www.markdownguide.org/) - For formatting docs

---

## Questions or Issues?

If you have questions about documentation:
1. Check the [JSDoc documentation](https://jsdoc.app/)
2. Look at existing well-documented files in the `src/` directory
3. Open an issue in the repository

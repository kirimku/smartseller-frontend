import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  client: '@hey-api/client-axios',
  input: './openapi/auth-endpoints.yaml',
  output: {
    format: 'prettier',
    lint: 'eslint',
    path: './src/generated/api',
  },
  types: {
    enums: 'javascript',
    name: 'preserve',
  },
  services: {
    asClass: false,
    name: '{{name}}Service',
    operationId: true,
  },
  schemas: false,
  plugins: [
    '@hey-api/typescript',
    '@hey-api/services',
    '@hey-api/transformers',
  ],
});
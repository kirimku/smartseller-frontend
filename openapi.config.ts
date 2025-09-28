import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  input: './openapi/complete-api.yaml',
  output: './src/generated/api',
  plugins: [
    {
      name: '@hey-api/typescript',
    },
    {
      name: '@hey-api/sdk',
      client: '@hey-api/client-axios',
    },
  ],
});
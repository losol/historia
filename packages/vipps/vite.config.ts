import { defineVanillaLibConfig } from '@eventuras/vite-config/vanilla-lib';
import { defineConfig } from 'vite';

export default defineConfig(
  defineVanillaLibConfig({
    entry: {
      'epayment-v1/index': './src/epayment-v1/index.ts',
      'vipps-core/index': './src/vipps-core/index.ts',
      'webhooks-v1/index': './src/webhooks-v1/index.ts',
    },
    external: ['crypto'],
  }),
);

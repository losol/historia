import { defineVanillaLibConfig } from '@eventuras/vite-config/vanilla-lib';
import { defineConfig } from 'vite';

export default defineConfig(
  defineVanillaLibConfig({
    entry: {
      index: './src/index.ts',
    },
  }),
);

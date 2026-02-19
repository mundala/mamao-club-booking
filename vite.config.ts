import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Fix: Cast process to any to resolve "Property 'cwd' does not exist on type 'Process'"
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  return {
    plugins: [react()],
    define: {
      // Polyfill process.env.API_KEY so the existing code works without modification
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY || env.API_KEY || ''),
    },
    server: {
      host: true, // Listen on all local IPs (needed for RPi access)
      port: 3000
    },
    preview: {
      host: true, // Listen on all local IPs for production preview
      port: 3000,
      allowedHosts: ['all']
    }
  };
});
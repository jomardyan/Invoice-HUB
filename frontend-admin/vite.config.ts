import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    
    server: {
        port: 5174,
        host: true,
        strictPort: false,
        open: false,
        cors: true,
        hmr: {
            overlay: true,
            timeout: 5000,
        },
        watch: {
            usePolling: false,
            interval: 1000,
        },
        fs: {
            allow: [path.resolve(__dirname, '..'), path.resolve(__dirname, '..', 'shared')],
        },
        proxy: {
            '/api': {
                target: 'http://localhost:3000',
                changeOrigin: true,
                secure: false,
            },
        },
    },
    
    preview: {
        port: 4174,
        host: true,
        strictPort: false,
        open: false,
    },
    
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            '@shared': path.resolve(__dirname, '..', 'shared'),
            '@components': path.resolve(__dirname, './src/components'),
            '@pages': path.resolve(__dirname, './src/pages'),
            '@services': path.resolve(__dirname, './src/services'),
            '@utils': path.resolve(__dirname, './src/utils'),
            // Ensure shared deep imports resolve to this project's node_modules
            '@mui/icons-material': path.resolve(__dirname, './node_modules/@mui/icons-material'),
            '@mui/material': path.resolve(__dirname, './node_modules/@mui/material'),
            'axios': path.resolve(__dirname, './node_modules/axios'),
        },
    },
    
    build: {
        outDir: 'dist',
        sourcemap: true,
        minify: 'esbuild',
        target: 'esnext',
        chunkSizeWarningLimit: 1000,
        rollupOptions: {
            output: {
                manualChunks: {
                    'react-vendor': ['react', 'react-dom', 'react-router-dom'],
                    'mui-vendor': ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
                    'chart-vendor': ['chart.js', 'react-chartjs-2'],
                },
            },
        },
    },
    
    optimizeDeps: {
        include: ['react', 'react-dom', 'react-router-dom', '@mui/material', '@mui/icons-material'],
        exclude: [],
    },
});

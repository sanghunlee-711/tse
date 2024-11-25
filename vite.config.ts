import { defineConfig } from 'vite';

import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@src': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    open: true,
  },
  // GitHub Pages 배포 시 리포지토리 이름을 기준으로 설정
  base: '/tse/',
  build: {
    outDir: 'dist',
  },
});

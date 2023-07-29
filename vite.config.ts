import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { URL, fileURLToPath} from 'url'

// https://vitejs.dev/config/
console.log('import, import.meta,import.meta.url: ',import.meta.url);
console.log('new URL: ',URL,new URL("./src", import.meta.url));

console.log('alias: ', fileURLToPath(new URL("./src", import.meta.url)));

export default defineConfig({
  plugins: [vue()],
  base: './',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})

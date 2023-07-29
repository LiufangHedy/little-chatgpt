import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
// otherwise it can not highlight the code 
import "highlight.js/styles/dark.css";
console.log('routerrr: ', router);


createApp(App).use(router).mount('#app')

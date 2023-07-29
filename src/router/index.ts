import { createRouter, createWebHashHistory } from 'vue-router';

console.log('BASE_URL: ', import.meta.env.BASE_URL);

console.log('createWebHashHistory: ', createWebHashHistory);

const router = createRouter({
    history: createWebHashHistory(import.meta.env.BASE_URL),
    routes: [{
        path: '/',
        name: 'home',
        component: () => import('@/views/home.vue')
    }]

});
export default router;
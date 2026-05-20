import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/login',
            name: 'login',
            component: () => import('@/views/LoginView.vue'),
            meta: { requiresAuth: false },
        },
        {
            path: '/',
            component: () => import('@/layouts/AppLayout.vue'),
            meta: { requiresAuth: true },
            children: [
                {
                    path: '',
                    redirect: '/photos',
                },
                {
                    path: 'photos',
                    name: 'photos',
                    component: () => import('@/views/PhotosView.vue'),
                },
                {
                    path: 'audio',
                    name: 'audio',
                    component: () => import('@/views/AudioView.vue'),
                },
                {
                    path: 'create',
                    name: 'create',
                    component: () => import('@/views/CreateView.vue'),
                },
                {
                    path: 'videos',
                    name: 'videos',
                    component: () => import('@/views/VideosView.vue'),
                },
            ],
        },
        {
            path: '/:pathMatch(.*)*',
            redirect: '/',
        },
    ],
});

router.beforeEach((to) => {
    const isAuthenticated = !!localStorage.getItem('token');
    if (to.meta.requiresAuth && !isAuthenticated) {
        return { name: 'login' };
    }
    if (to.name === 'login' && isAuthenticated) {
        return { path: '/' };
    }
});

export default router;

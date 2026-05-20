import axios from 'axios';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

interface User {
    id: string;
    email: string;
    createdAt: string;
}

export const useAuthStore = defineStore('auth', () => {
    const token = ref<string | null>(localStorage.getItem('token'));
    const user = ref<User | null>(JSON.parse(localStorage.getItem('user') ?? 'null'));

    const isAuthenticated = computed(() => !!token.value);

    if (token.value) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token.value}`;
    }

    function setAuth(newToken: string, newUser: User) {
        token.value = newToken;
        user.value = newUser;
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(newUser));
        axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    }

    function logout() {
        token.value = null;
        user.value = null;
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        delete axios.defaults.headers.common['Authorization'];
    }

    return { token, user, isAuthenticated, setAuth, logout };
});

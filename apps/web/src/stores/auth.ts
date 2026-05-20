import axios from 'axios';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

interface User {
    id: string;
    email: string;
    name: string;
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

    async function updateProfile(name: string) {
        const response = await axios.patch('/api/auth/profile', { name });
        const updatedUser = response.data.user;
        user.value = updatedUser;
        localStorage.setItem('user', JSON.stringify(updatedUser));
        return updatedUser;
    }

    async function updatePassword(oldPassword: string, newPassword: string) {
        await axios.patch('/api/auth/password', { oldPassword, newPassword });
    }

    return { token, user, isAuthenticated, setAuth, logout, updateProfile, updatePassword };
});

import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '@/lib/api';

export interface Folder {
    id: string;
    name: string;
    createdAt: string;
    userId: string;
}

export const useFoldersStore = defineStore('folders', () => {
    const items = ref<Folder[]>([]);
    const loading = ref(false);

    async function fetchAll() {
        loading.value = true;
        try {
            const res = await api.get<Folder[]>('/api/folders');
            items.value = res.data;
        } finally {
            loading.value = false;
        }
    }

    async function create(name: string): Promise<Folder> {
        const res = await api.post<Folder>('/api/folders', { name });
        items.value.push(res.data);
        return res.data;
    }

    async function rename(id: string, name: string) {
        const res = await api.put<Folder>(`/api/folders/${id}`, { name });
        const idx = items.value.findIndex((f) => f.id === id);
        if (idx !== -1) items.value[idx] = res.data;
    }

    async function remove(id: string) {
        await api.delete(`/api/folders/${id}`);
        items.value = items.value.filter((f) => f.id !== id);
    }

    return { items, loading, fetchAll, create, rename, remove };
});

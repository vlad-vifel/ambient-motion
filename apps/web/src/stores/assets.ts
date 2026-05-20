import axios from 'axios';
import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '@/lib/api';

export interface Asset {
    id: string;
    filename: string;
    url: string;
    size: number;
    uploadedAt: string;
    userId: string;
    folderId: string | null;
}

export const useAssetsStore = defineStore('assets', () => {
    const items = ref<Asset[]>([]);
    const loading = ref(false);
    const uploading = ref(false);

    let abortCtrl: AbortController | null = null;

    async function fetchAll(folderId?: string | null) {
        abortCtrl?.abort();
        abortCtrl = new AbortController();
        const ctrl = abortCtrl;
        loading.value = true;
        items.value = [];
        try {
            const params = folderId ? { folderId } : {};
            const res = await api.get<Asset[]>('/api/assets', { params, signal: ctrl.signal });
            if (ctrl.signal.aborted) return;
            items.value = res.data;
        } catch (err) {
            if (axios.isCancel(err)) return;
            throw err;
        } finally {
            if (!ctrl.signal.aborted) loading.value = false;
        }
    }

    async function upload(form: FormData) {
        uploading.value = true;
        try {
            const res = await api.post<Asset[]>('/api/assets', form, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            items.value.unshift(...res.data);
        } finally {
            uploading.value = false;
        }
    }

    async function rename(id: string, filename: string) {
        const res = await api.patch<Asset>(`/api/assets/${id}`, { filename });
        const idx = items.value.findIndex((a) => a.id === id);
        if (idx !== -1) items.value[idx] = res.data;
    }

    async function remove(id: string) {
        await api.delete(`/api/assets/${id}`);
        items.value = items.value.filter((a) => a.id !== id);
    }

    return { items, loading, uploading, fetchAll, upload, rename, remove };
});

import { defineStore } from 'pinia';
import { ref } from 'vue';
import { usePlayerStore } from './player';
import api from '@/lib/api';

export interface Audio {
    id: string;
    title: string;
    artist: string;
    filename: string;
    coverUrl: string | null;
    duration: number;
    url: string;
    uploadedAt: string;
}

export const useAudioStore = defineStore('audio', () => {
    const items = ref<Audio[]>([]);
    const loading = ref(false);
    const uploading = ref(false);

    async function fetchAll() {
        loading.value = true;
        try {
            const { data } = await api.get<Audio[]>('/api/audio');
            items.value = data;
        } finally {
            loading.value = false;
        }
    }

    async function upload(form: FormData) {
        uploading.value = true;
        try {
            const { data } = await api.post<Audio>('/api/audio', form, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            items.value.unshift(data);
            usePlayerStore().setPlaylist(items.value);
            return data;
        } finally {
            uploading.value = false;
        }
    }

    async function save(id: string, form: FormData) {
        const { data } = await api.patch<Audio>(`/api/audio/${id}`, form, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        const idx = items.value.findIndex((a) => a.id === id);
        if (idx !== -1) items.value[idx] = data;
        const player = usePlayerStore();
        player.setPlaylist(items.value);
        player.syncCurrentTrack(data);
    }

    async function rename(id: string, title: string) {
        const form = new FormData();
        form.append('title', title);
        await save(id, form);
    }

    async function remove(id: string) {
        await api.delete(`/api/audio/${id}`);
        items.value = items.value.filter((a) => a.id !== id);
        const player = usePlayerStore();
        if (player.track?.id === id) player.stop();
        player.setPlaylist(items.value);
    }

    return { items, loading, uploading, fetchAll, upload, save, rename, remove };
});

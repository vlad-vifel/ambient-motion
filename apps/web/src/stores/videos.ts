import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '@/lib/api';
import type { Video } from '@/types/video';

export const useVideosStore = defineStore('videos', () => {
    const items = ref<Video[]>([]);
    const loading = ref(false);
    let pollTimer: ReturnType<typeof setTimeout> | null = null;

    async function fetchAll() {
        loading.value = true;
        try {
            const { data } = await api.get<Video[]>('/api/videos');
            items.value = data;
        } finally {
            loading.value = false;
        }
    }

    async function remove(id: string) {
        await api.delete(`/api/videos/${id}`);
        items.value = items.value.filter((v) => v.id !== id);
    }

    async function requeue(id: string, phrase: string) {
        const { data } = await api.patch<Video>(`/api/videos/${id}`, { phrase });
        const idx = items.value.findIndex((v) => v.id === id);
        if (idx !== -1) items.value[idx] = { ...items.value[idx], ...data };
    }

    function hasActiveJobs(): boolean {
        return items.value.some((v) => v.status === 'QUEUED' || v.status === 'GENERATING');
    }

    function startPolling(intervalMs = 3000) {
        stopPolling();
        const tick = async () => {
            await fetchAll();
            if (hasActiveJobs()) {
                pollTimer = setTimeout(tick, intervalMs);
            }
        };
        tick();
    }

    function stopPolling() {
        if (pollTimer !== null) {
            clearTimeout(pollTimer);
            pollTimer = null;
        }
    }

    return { items, loading, fetchAll, remove, requeue, startPolling, stopPolling };
});

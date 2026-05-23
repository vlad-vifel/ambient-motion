import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '@/lib/api';
import type { VideoPreset } from '@/types/preset';

export const usePresetsStore = defineStore('presets', () => {
    const items = ref<VideoPreset[]>([]);
    const loading = ref(false);

    async function fetchAll() {
        loading.value = true;
        try {
            const { data } = await api.get<VideoPreset[]>('/api/video-presets');
            items.value = data;
        } finally {
            loading.value = false;
        }
    }

    return { items, loading, fetchAll };
});

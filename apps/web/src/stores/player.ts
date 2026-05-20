import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { Audio } from './audio';

export const usePlayerStore = defineStore('player', () => {
    const track = ref<Audio | null>(null);
    const audio = ref<HTMLAudioElement | null>(null);
    const playing = ref(false);
    const currentTime = ref(0);
    const duration = ref(0);
    const volume = ref(1);
    const playlist = ref<Audio[]>([]);

    let rafId: number | null = null;

    function startRaf() {
        if (rafId !== null) cancelAnimationFrame(rafId);
        const tick = () => {
            if (audio.value) currentTime.value = audio.value.currentTime;
            rafId = playing.value ? requestAnimationFrame(tick) : null;
        };
        rafId = requestAnimationFrame(tick);
    }

    function stopRaf() {
        if (rafId !== null) {
            cancelAnimationFrame(rafId);
            rafId = null;
        }
    }

    function play(t: Audio) {
        stopRaf();
        if (audio.value) {
            audio.value.pause();
            audio.value.removeEventListener('ended', onEnded);
            audio.value.removeEventListener('loadedmetadata', onMeta);
        }

        track.value = t;
        const el = new Audio(t.url);
        el.volume = volume.value;
        audio.value = el;

        el.addEventListener('ended', onEnded);
        el.addEventListener('loadedmetadata', onMeta);

        void el.play();
        playing.value = true;
        currentTime.value = 0;
        duration.value = 0;
        startRaf();
    }

    function toggle() {
        if (!audio.value) return;
        if (playing.value) {
            audio.value.pause();
            playing.value = false;
            stopRaf();
        } else {
            void audio.value.play();
            playing.value = true;
            startRaf();
        }
    }

    function seek(time: number) {
        if (!audio.value) return;
        audio.value.currentTime = time;
        currentTime.value = time;
    }

    function setVolume(v: number) {
        volume.value = v;
        if (audio.value) audio.value.volume = v;
    }

    function syncCurrentTrack(t: Audio) {
        if (track.value?.id === t.id) track.value = t;
    }

    function onEnded() {
        stopRaf();
        currentTime.value = 0;
        if (hasNext.value) {
            next();
        } else {
            playing.value = false;
        }
    }

    function onMeta() {
        duration.value = audio.value?.duration ?? 0;
    }

    function stop() {
        stopRaf();
        audio.value?.pause();
        audio.value = null;
        track.value = null;
        playing.value = false;
        currentTime.value = 0;
        duration.value = 0;
    }

    function setPlaylist(items: Audio[]) {
        playlist.value = items;
    }

    const currentIndex = computed(() =>
        track.value ? playlist.value.findIndex((a) => a.id === track.value!.id) : -1,
    );
    const hasPrev = computed(() => currentIndex.value > 0);
    const hasNext = computed(
        () => currentIndex.value !== -1 && currentIndex.value < playlist.value.length - 1,
    );

    function prev() {
        if (hasPrev.value) play(playlist.value[currentIndex.value - 1]);
    }

    function next() {
        if (hasNext.value) play(playlist.value[currentIndex.value + 1]);
    }

    const progress = computed(() => (duration.value > 0 ? currentTime.value / duration.value : 0));

    return {
        track,
        playing,
        currentTime,
        duration,
        volume,
        progress,
        hasPrev,
        hasNext,
        play,
        toggle,
        seek,
        setVolume,
        syncCurrentTrack,
        setPlaylist,
        prev,
        next,
        stop,
    };
});

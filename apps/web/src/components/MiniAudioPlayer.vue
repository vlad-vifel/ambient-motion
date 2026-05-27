<template>
    <div
        class="flex flex-col items-center gap-2 px-2 py-2 rounded-md border border-border bg-muted/30"
    >
        <button
            class="size-7 rounded-full bg-foreground text-background flex items-center justify-center hover:scale-105 transition-transform shrink-0"
            @click="toggle"
        >
            <Pause v-if="playing" class="size-3.5 fill-current" />
            <Play v-else class="size-3.5 fill-current translate-x-px" />
        </button>

        <div class="w-full flex items-center gap-2">
            <span class="text-xs text-muted-foreground tabular-nums w-7 text-right shrink-0">
                {{ formatTime(currentTime) }}
            </span>
            <Slider
                class="flex-1"
                :max="100"
                :min="0"
                :model-value="[progress]"
                :step="0.1"
                @update:model-value="(v) => v && v[0] !== undefined && onDrag(v[0])"
                @pointerdown="seeking = true"
            />
            <span class="text-xs text-muted-foreground tabular-nums w-7 shrink-0">
                {{ formatTime(durationSec) }}
            </span>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { Pause, Play } from 'lucide-vue-next';
    import { computed, onUnmounted, ref, watch } from 'vue';
    import { Slider } from '@/components/ui/slider';

    const props = defineProps<{ src: string; durationMs: number }>();

    const playing = ref(false);
    const currentTime = ref(0);
    const progress = ref(0);

    const durationSec = computed(() => props.durationMs / 1000);

    const audio = new Audio();

    let rafId = 0;
    const seeking = ref(false);

    function tick() {
        if (!seeking.value) {
            currentTime.value = audio.currentTime;
            progress.value = durationSec.value ? (audio.currentTime / durationSec.value) * 100 : 0;
        }
        rafId = requestAnimationFrame(tick);
    }

    audio.addEventListener('play', () => {
        rafId = requestAnimationFrame(tick);
    });
    audio.addEventListener('pause', () => {
        cancelAnimationFrame(rafId);
    });
    let ended = false;

    audio.addEventListener('ended', () => {
        cancelAnimationFrame(rafId);
        playing.value = false;
        ended = true;
    });

    watch(
        () => props.src,
        (src) => {
            audio.pause();
            playing.value = false;
            currentTime.value = 0;
            progress.value = 0;
            ended = false;
            audio.src = src;
            audio.load();
        },
        { immediate: true },
    );

    function toggle() {
        if (playing.value) {
            audio.pause();
            playing.value = false;
        } else {
            audio.play();
            playing.value = true;
        }
    }

    function onDrag(pct: number) {
        progress.value = pct;
        currentTime.value = (pct / 100) * durationSec.value;
    }

    function onPointerUp() {
        if (!seeking.value) return;
        audio.currentTime = (progress.value / 100) * durationSec.value;
        seeking.value = false;
        if (ended) {
            ended = false;
            audio.play();
            playing.value = true;
        }
    }

    window.addEventListener('pointerup', onPointerUp);

    function formatTime(seconds: number) {
        if (!seconds || isNaN(seconds)) return '0:00';
        const total = Math.round(seconds);
        const m = Math.floor(total / 60);
        const s = total % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    }

    onUnmounted(() => {
        cancelAnimationFrame(rafId);
        window.removeEventListener('pointerup', onPointerUp);
        audio.pause();
    });
</script>

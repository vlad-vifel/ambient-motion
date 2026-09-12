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
                {{ formatTime(displayedProgress / 1000) }}
            </span>
            <Slider
                class="flex-1"
                :max="durationMs"
                :min="0"
                :handle-min="startMs"
                :handle-max="endMs"
                :range-start="startMs"
                :model-value="[displayedProgress]"
                :step="100"
                @update:model-value="(v) => v && v[0] !== undefined && onDrag(v[0])"
                @pointerdown="startSeeking"
            />
            <span class="text-xs text-muted-foreground tabular-nums w-7 shrink-0">
                {{ formatTime(durationMs / 1000) }}
            </span>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { Pause, Play } from 'lucide-vue-next';
    import { computed, onUnmounted, ref, watch } from 'vue';
    import { Slider } from '@/components/ui/slider';
    import { formatAudioTime as formatTime } from './utils';

    const props = defineProps<{
        src: string;
        durationMs: number;
        startMs?: number;
        endMs?: number;
        fadeInMs?: number;
        fadeOutMs?: number;
    }>();

    const playing = ref(false);
    const currentTime = ref(0);
    const progress = ref(0);
    const dragProgress = ref<number | null>(null);
    const displayedProgress = computed(() => dragProgress.value ?? progress.value);

    const startMs = computed(() => Math.max(0, props.startMs ?? 0));
    const endMs = computed(() => Math.min(props.durationMs, props.endMs ?? props.durationMs));
    const durationMs = computed(() => props.durationMs);
    const durationSec = computed(() => Math.max(0, endMs.value - startMs.value) / 1000);
    const fadeInMs = computed(() =>
        Math.max(0, Math.min(durationSec.value * 1000, props.fadeInMs ?? 0)),
    );
    const fadeOutMs = computed(() =>
        Math.max(0, Math.min(durationSec.value * 1000, props.fadeOutMs ?? 0)),
    );

    const audio = new Audio();

    let rafId = 0;
    const seeking = ref(false);
    const resumeAfterSeek = ref(false);

    function tick() {
        if (!seeking.value) {
            const position = Math.max(startMs.value, audio.currentTime * 1000);
            const elapsed = position - startMs.value;
            if (audio.currentTime * 1000 >= endMs.value) {
                resetPlayback();
                return;
            }
            currentTime.value = elapsed / 1000;
            progress.value = position;
            audio.volume = volumeAtElapsed(elapsed);
        }
        rafId = requestAnimationFrame(tick);
    }

    audio.addEventListener('play', () => {
        rafId = requestAnimationFrame(tick);
    });
    audio.addEventListener('pause', () => {
        cancelAnimationFrame(rafId);
    });
    audio.addEventListener('ended', () => {
        cancelAnimationFrame(rafId);
        playing.value = false;
    });

    watch(
        () => props.src,
        (src) => {
            resetPlayback();
            audio.src = src;
            audio.load();
        },
        { immediate: true },
    );

    watch([startMs, endMs], resetPlayback);
    watch([fadeInMs, fadeOutMs], () => {
        audio.volume = volumeAtElapsed(currentTime.value * 1000);
    });

    function volumeAtElapsed(elapsedMs: number) {
        const selectedDuration = durationSec.value * 1000;
        if (fadeInMs.value > 0 && elapsedMs < fadeInMs.value)
            return Math.max(0, Math.min(1, elapsedMs / fadeInMs.value));
        if (fadeOutMs.value > 0 && elapsedMs > selectedDuration - fadeOutMs.value)
            return Math.max(0, Math.min(1, (selectedDuration - elapsedMs) / fadeOutMs.value));
        return 1;
    }

    function toggle() {
        if (playing.value) {
            audio.pause();
            playing.value = false;
        } else {
            const position = Math.min(endMs.value, Math.max(startMs.value, progress.value));
            audio.currentTime = position / 1000;
            audio.volume = volumeAtElapsed(position - startMs.value);
            audio.play();
            playing.value = true;
        }
    }

    function onDrag(pct: number) {
        dragProgress.value = pct;
    }

    function startSeeking() {
        resumeAfterSeek.value = playing.value;
        seeking.value = true;
        if (playing.value) {
            audio.pause();
            playing.value = false;
        }
    }

    function onPointerUp() {
        if (!seeking.value) return;
        const nextProgress = Math.min(
            endMs.value,
            Math.max(startMs.value, dragProgress.value ?? progress.value),
        );
        progress.value = nextProgress;
        currentTime.value = (nextProgress - startMs.value) / 1000;
        audio.currentTime = nextProgress / 1000;
        audio.volume = volumeAtElapsed(currentTime.value * 1000);
        dragProgress.value = null;
        seeking.value = false;
        if (resumeAfterSeek.value) {
            resumeAfterSeek.value = false;
            audio.play();
            playing.value = true;
        }
    }

    function resetPlayback() {
        audio.pause();
        playing.value = false;
        currentTime.value = 0;
        progress.value = startMs.value;
        audio.volume = volumeAtElapsed(0);
        dragProgress.value = null;
        resumeAfterSeek.value = false;
        audio.currentTime = startMs.value / 1000;
    }

    window.addEventListener('pointerup', onPointerUp);

    onUnmounted(() => {
        cancelAnimationFrame(rafId);
        window.removeEventListener('pointerup', onPointerUp);
        audio.pause();
    });
</script>

<template>
    <div
        v-if="player.track"
        class="flex items-center gap-3 px-4 py-3 border-t border-border/50 bg-background shrink-0 select-none"
    >
        <div
            class="hidden sm:flex size-9 rounded-md bg-muted shrink-0 items-center justify-center overflow-hidden"
        >
            <img
                v-if="player.track.coverUrl"
                :src="player.track.coverUrl"
                class="size-full object-cover"
            />
            <Music v-else class="size-4 text-muted-foreground" />
        </div>

        <div class="flex-1 flex flex-col justify-center min-w-0 overflow-hidden">
            <p class="text-sm font-medium truncate leading-tight">
                {{ player.track.title }}
            </p>
            <p class="text-xs text-muted-foreground truncate leading-tight">
                {{ player.track.artist || '—' }}
            </p>
        </div>

        <div class="shrink-0 flex flex-col items-center gap-1.5">
            <div class="flex items-center gap-3">
                <button
                    class="text-muted-foreground transition-colors"
                    :class="player.hasPrev ? 'hover:text-foreground' : 'opacity-30 cursor-default'"
                    :disabled="!player.hasPrev"
                    @click="player.prev()"
                >
                    <SkipBack class="size-4 fill-current" />
                </button>
                <button
                    class="size-7 rounded-full bg-foreground text-background flex items-center justify-center hover:scale-105 transition-transform shrink-0"
                    @click="player.toggle()"
                >
                    <Pause v-if="player.playing" class="size-3.5 fill-current" />
                    <Play v-else class="size-3.5 fill-current translate-x-px" />
                </button>
                <button
                    class="text-muted-foreground transition-colors"
                    :class="player.hasNext ? 'hover:text-foreground' : 'opacity-30 cursor-default'"
                    :disabled="!player.hasNext"
                    @click="player.next()"
                >
                    <SkipForward class="size-4 fill-current" />
                </button>
            </div>

            <div class="hidden sm:flex items-center gap-2 w-64 lg:w-96 xl:w-104">
                <span
                    class="text-[10px] text-muted-foreground tabular-nums w-8 text-right shrink-0"
                >
                    {{ formatTime(player.currentTime) }}
                </span>
                <Slider
                    class="flex-1"
                    :max="100"
                    :min="0"
                    :model-value="[player.progress * 100]"
                    :step="0.1"
                    @update:model-value="
                        (v) => {
                            if (v && v[0] !== undefined) {
                                player.seek((v[0] / 100) * ((player.track?.duration ?? 0) / 1000));
                            }
                        }
                    "
                />
                <span class="text-[10px] text-muted-foreground tabular-nums w-8 shrink-0">
                    {{ formatTime((player.track?.duration ?? 0) / 1000) }}
                </span>
            </div>
        </div>

        <div class="flex-1 flex items-center justify-end gap-2">
            <div class="hidden lg:flex items-center gap-2 max-w-28 w-full">
                <button
                    class="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                    @click="toggleMute"
                >
                    <VolumeX v-if="player.volume === 0" class="size-4" />
                    <Volume1 v-else-if="player.volume < 0.5" class="size-4" />
                    <Volume2 v-else class="size-4" />
                </button>
                <Slider
                    class="flex-1"
                    :max="100"
                    :min="0"
                    :model-value="[player.volume * 100]"
                    :step="1"
                    @update:model-value="
                        (v) => {
                            if (v && v[0] !== undefined) {
                                player.setVolume(v[0] / 100);
                            }
                        }
                    "
                />
            </div>

            <div ref="volContainerRef" class="relative flex lg:hidden">
                <button
                    class="p-1 text-muted-foreground hover:text-foreground transition-colors"
                    @click.stop="volPopoverOpen = !volPopoverOpen"
                >
                    <VolumeX v-if="player.volume === 0" class="size-4" />
                    <Volume1 v-else-if="player.volume < 0.5" class="size-4" />
                    <Volume2 v-else class="size-4" />
                </button>
                <div
                    v-if="volPopoverOpen"
                    class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-3 bg-popover border border-border rounded-lg shadow-md flex flex-col items-center z-50"
                    @click.stop
                >
                    <div class="h-24">
                        <Slider
                            class="h-full"
                            :max="100"
                            :min="0"
                            :model-value="[player.volume * 100]"
                            orientation="vertical"
                            :step="1"
                            @update:model-value="
                                (v) => {
                                    if (v && v[0] !== undefined) {
                                        player.setVolume(v[0] / 100);
                                    }
                                }
                            "
                        />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { onClickOutside } from '@vueuse/core';
    import {
        Music,
        Pause,
        Play,
        SkipBack,
        SkipForward,
        Volume1,
        Volume2,
        VolumeX,
    } from 'lucide-vue-next';
    import { onUnmounted, ref } from 'vue';
    import { Slider } from '@/components/ui/slider';
    import { usePlayerStore } from '@/stores/player';

    const player = usePlayerStore();

    const volPopoverOpen = ref(false);
    const volContainerRef = ref<HTMLElement | null>(null);
    const prevVolume = ref(1);

    onClickOutside(volContainerRef, () => {
        volPopoverOpen.value = false;
    });

    onUnmounted(() => player.stop());

    function formatTime(seconds: number) {
        if (!seconds || isNaN(seconds)) return '0:00';
        const total = Math.round(seconds);
        const m = Math.floor(total / 60);
        const s = total % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    }

    function toggleMute() {
        if (player.volume > 0) {
            prevVolume.value = player.volume;
            player.setVolume(0);
        } else {
            player.setVolume(prevVolume.value || 1);
        }
    }
</script>

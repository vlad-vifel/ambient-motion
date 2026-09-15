<template>
    <div
        class="music-widget-preview-canvas"
        :style="{
            filter: `contrast(${settings.contrast / 100}) brightness(${Math.max(1, settings.overallBrightness / 100)})`,
        }"
    >
        <img
            v-if="track.coverUrl"
            :src="track.coverUrl"
            class="absolute inset-0 size-full scale-[1.08] object-cover blur-[18px]"
        />
        <div
            class="absolute inset-0 bg-black"
            :style="{ opacity: (100 - settings.backgroundBrightness) / 100 }"
        />
        <img
            :src="overlayAsset"
            class="absolute inset-0 size-full object-cover opacity-20 mix-blend-overlay"
        />
        <div
            class="absolute left-[135px] top-[411px] h-[1097px] w-[810px] rounded-[44px] bg-black/50"
        />
        <img
            v-if="track.coverUrl"
            :src="track.coverUrl"
            class="absolute left-[171px] top-[445px] size-[738px] rounded-[18px] object-cover"
        />
        <div
            class="absolute left-[185px] top-[1214px] w-[710px] truncate text-center text-[35px] font-semibold leading-tight text-white"
        >
            {{ track.title }}
        </div>
        <div
            class="absolute left-[185px] top-[1261px] w-[710px] truncate text-center text-[30px] font-semibold leading-tight text-white/60"
        >
            {{ track.artist }}
        </div>
        <img
            :src="visualizerAsset"
            class="absolute left-[830px] top-[1233px] h-[44px] w-[75px] object-contain opacity-50"
        />
        <div
            class="absolute left-[188px] top-[1324px] flex w-[708px] items-center text-[25px] font-semibold leading-none text-white/65"
        >
            <span class="w-[57px]">{{ formatTime(previewCurrentTime) }}</span>
            <div
                class="ml-[24px] h-[16px] w-[543px] shrink-0 overflow-hidden rounded-full bg-white/60"
            >
                <div
                    class="h-full rounded-full bg-white"
                    :style="{ width: `${previewProgress * 100}%` }"
                />
            </div>
            <span class="ml-[24px] w-[60px] text-right">{{ formatTime(track.duration) }}</span>
        </div>
        <img
            :src="buttonsAsset"
            class="absolute left-[337px] top-[1374px] h-[106px] w-[407px] object-contain opacity-80"
        />
        <div
            v-if="settings.watermarkEnabled"
            class="absolute top-[1761px] w-full truncate px-20 text-center text-[35px] font-semibold leading-tight text-white mix-blend-overlay"
            :style="{ opacity: Math.min(1, (settings.watermarkBrightness ?? 100) / 100) }"
        >
            {{ settings.watermarkText }}
        </div>
        <div
            v-if="settings.watermarkEnabled && (settings.watermarkBrightness ?? 100) > 100"
            class="absolute top-[1761px] w-full truncate px-20 text-center text-[35px] font-semibold leading-tight text-white mix-blend-overlay"
            :style="{ opacity: Math.min(1, ((settings.watermarkBrightness ?? 100) - 100) / 100) }"
        >
            {{ settings.watermarkText }}
        </div>
        <div
            class="absolute inset-0 bg-black"
            :style="{ opacity: Math.max(0, (100 - settings.overallBrightness) / 100) }"
        />
    </div>
</template>

<script setup lang="ts">
    import type { MusicWidgetPreviewCanvasProps } from '@/presets/music-widget/types';
    import { formatMusicWidgetTime as formatTime } from '@/presets/music-widget/utils';

    defineProps<MusicWidgetPreviewCanvasProps>();
</script>

<style scoped>
    @font-face {
        font-family: 'MusicWidgetMontserrat';
        src: url('@/assets/presets/music-widget/fonts/Montserrat-500.ttf') format('truetype');
        font-weight: 500;
        font-style: normal;
        font-display: swap;
    }

    .music-widget-preview-canvas {
        position: relative;
        width: 1080px;
        height: 1920px;
        overflow: hidden;
        background: #000;
        color: #fff;
        font-family: 'MusicWidgetMontserrat', sans-serif;
        font-weight: 600;
        transform: translateZ(0);
    }
</style>

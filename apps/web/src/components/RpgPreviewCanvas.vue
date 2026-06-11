<template>
    <div
        class="relative overflow-hidden bg-black shrink-0"
        :style="{
            width: width + 'px',
            height: stageHeight + 'px',
            WebkitMaskImage: maskUrl,
            maskImage: maskUrl,
            WebkitMaskSize: '100% 100%',
            maskSize: '100% 100%',
            WebkitMaskRepeat: 'no-repeat',
            maskRepeat: 'no-repeat',
        }"
    >
        <div
            class="absolute top-0 left-0"
            :style="{
                width: BASE_W + 'px',
                height: BASE_H + 'px',
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
            }"
        >
            <svg width="0" height="0" style="position: absolute">
                <defs>
                    <filter :id="pixelateId" x="0" y="0" width="100%" height="100%">
                        <feFlood :x="cellSize / 2" :y="cellSize / 2" :width="1" :height="1" />
                        <feComposite :width="cellSize" :height="cellSize" />
                        <feTile result="tiles" />
                        <feComposite in="SourceGraphic" in2="tiles" operator="in" />
                        <feMorphology operator="dilate" :radius="dilateRadius" />
                    </filter>
                </defs>
            </svg>

            <div :style="{ position: 'absolute', inset: 0, filter: `url(#${pixelateId})` }">
                <img
                    :src="imageUrl"
                    :style="{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transform: 'scale(1.12)',
                        transformOrigin: 'center center',
                        filter: `brightness(${settings.brightness / 100}) contrast(${settings.contrast / 100})`,
                    }"
                />

                <div
                    :style="{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: settings.gapQuestionOptions + 'px',
                        transform: `translateY(${-settings.textOffsetY}px)`,
                    }"
                >
                    <div
                        :style="{
                            fontFamily: FONT,
                            fontWeight: 500,
                            fontSize: phraseSize + 'px',
                            color: 'rgba(255, 255, 255, 0.93)',
                            textAlign: 'center',
                            lineHeight: 1.7,
                            wordSpacing: '0.12em',
                            paddingLeft: phrasePadX + 'px',
                            paddingRight: phrasePadX + 'px',
                            textShadow: baseGlow,
                        }"
                    >
                        {{ phrase }}
                    </div>

                    <div
                        :style="{
                            display: 'flex',
                            flexDirection: 'row',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: settings.gapOptions + 'px',
                        }"
                    >
                        <div
                            :style="{ display: 'flex', alignItems: 'center', gap: iconGap + 'px' }"
                        >
                            <svg
                                :width="iconSize"
                                :height="iconSize"
                                viewBox="0 0 20.123 20.122"
                                :style="ICON_STYLE"
                            >
                                <defs>
                                    <linearGradient
                                        :id="`cg-x-${pixelateId}`"
                                        gradientUnits="userSpaceOnUse"
                                        x1="10.0615"
                                        y1="0"
                                        x2="10.0615"
                                        y2="18.0092"
                                    >
                                        <stop offset="0" stop-color="#5B5B5F" />
                                        <stop offset="0.0231" stop-color="#59595D" />
                                        <stop offset="0.4507" stop-color="#333335" />
                                        <stop offset="0.7912" stop-color="#1C1C1D" />
                                        <stop offset="1" stop-color="#141414" />
                                    </linearGradient>
                                </defs>
                                <circle
                                    :fill="`url(#cg-x-${pixelateId})`"
                                    cx="10.061"
                                    cy="10.061"
                                    r="10.061"
                                />
                                <polygon
                                    fill="#6273A8"
                                    points="16.107,5.608 14.514,4.015 10.061,8.468 5.608,4.015 4.016,5.608 8.469,10.061 4.016,14.514 5.608,16.106 10.061,11.653 14.514,16.106 16.107,14.514 11.654,10.061"
                                />
                            </svg>
                            <span
                                :style="{
                                    fontFamily: FONT,
                                    fontWeight: 500,
                                    fontSize: choiceSize + 'px',
                                    color: 'rgba(255, 255, 255, 0.9)',
                                    textShadow: pulseGlow,
                                }"
                            >
                                {{ choiceLeft }}
                            </span>
                        </div>
                        <div
                            :style="{ display: 'flex', alignItems: 'center', gap: iconGap + 'px' }"
                        >
                            <svg
                                :width="iconSize"
                                :height="iconSize"
                                viewBox="0 0 19.996 19.995"
                                :style="ICON_STYLE"
                            >
                                <defs>
                                    <linearGradient
                                        :id="`cg-o-${pixelateId}`"
                                        gradientUnits="userSpaceOnUse"
                                        x1="9.998"
                                        y1="0"
                                        x2="9.998"
                                        y2="17.896"
                                    >
                                        <stop offset="0" stop-color="#5B5B5F" />
                                        <stop offset="0.0231" stop-color="#59595D" />
                                        <stop offset="0.4507" stop-color="#333335" />
                                        <stop offset="0.7912" stop-color="#1C1C1D" />
                                        <stop offset="1" stop-color="#141414" />
                                    </linearGradient>
                                </defs>
                                <circle
                                    :fill="`url(#cg-o-${pixelateId})`"
                                    cx="9.998"
                                    cy="9.998"
                                    r="9.998"
                                />
                                <path
                                    fill="#CC3333"
                                    d="M9.998,5.177c2.658,0,4.82,2.163,4.82,4.82s-2.162,4.82-4.82,4.82c-2.658,0-4.819-2.163-4.819-4.82S7.34,5.177,9.998,5.177 M9.998,3.293c-3.703,0-6.705,3.002-6.705,6.705c0,3.703,3.002,6.705,6.705,6.705c3.704,0,6.706-3.002,6.706-6.705C16.704,6.295,13.702,3.293,9.998,3.293L9.998,3.293z"
                                />
                            </svg>
                            <span
                                :style="{
                                    fontFamily: FONT,
                                    fontWeight: 500,
                                    fontSize: choiceSize + 'px',
                                    color: 'rgba(255, 255, 255, 0.9)',
                                    textShadow: baseGlow,
                                }"
                            >
                                {{ choiceRight }}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div
                v-if="settings.vignette"
                :style="{
                    position: 'absolute',
                    inset: 0,
                    background:
                        'radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.55) 100%)',
                    pointerEvents: 'none',
                }"
            />

            <div
                :style="{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: `rgba(0,0,0,${settings.overlayPercent / 100})`,
                    pointerEvents: 'none',
                }"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
    import { computed } from 'vue';
    import type { RpgSettings } from '@/types/rpgSettings';

    const BASE_W = 1080;
    const BASE_H = 1920;
    const FONT = "'Lora', serif";
    const PREVIEW_PULSE = 0.65;
    const ICON_STYLE = {
        transform: 'scaleY(-1)',
        display: 'block',
        flexShrink: 0,
        filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.75))',
    } as const;

    const props = withDefaults(
        defineProps<{
            imageUrl: string;
            phrase: string;
            choiceLeft: string;
            choiceRight: string;
            settings: RpgSettings;
            width?: number;
        }>(),
        {
            width: 260,
        },
    );

    const pixelateId = `rpgprev-${Math.random().toString(36).slice(2, 9)}`;

    const scale = computed(() => props.width / BASE_W);
    const stageHeight = computed(() => Math.round((props.width * BASE_H) / BASE_W));

    const ROUND = 8;
    const maskUrl = computed(() => {
        const w = props.width;
        const h = stageHeight.value;
        const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'><rect width='${w}' height='${h}' rx='${ROUND}' ry='${ROUND}' fill='white'/></svg>`;
        return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
    });

    const cellSize = Math.max(4, Math.round((BASE_W * 0.004) / 2) * 2);
    const dilateRadius = cellSize / 2;

    const phraseSize = Math.round(BASE_W * 0.062);
    const choiceSize = Math.round(BASE_W * 0.053);
    const iconSize = Math.round(choiceSize * 0.88);
    const iconGap = Math.round(choiceSize * 0.28);
    const phrasePadX = Math.round(BASE_W * 0.08);

    const baseGlow = '0 0 8px rgba(255,255,255,0.55), 0 0 22px rgba(255,255,255,0.3)';

    const pulseGlow = (() => {
        const pulseInner = 4 + PREVIEW_PULSE * 14;
        const pulseBlur = 10 + PREVIEW_PULSE * 32;
        return `${baseGlow}, 0 0 ${pulseInner}px rgba(255,255,255,${PREVIEW_PULSE * 0.95}), 0 0 ${pulseBlur}px rgba(255,255,255,${PREVIEW_PULSE * 0.75})`;
    })();
</script>

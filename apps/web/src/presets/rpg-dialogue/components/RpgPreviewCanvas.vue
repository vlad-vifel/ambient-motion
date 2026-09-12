<template>
    <div
        class="relative overflow-hidden bg-black shrink-0"
        :style="{
            width: width + 'px',
            height: stageHeight + 'px',
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
                            <RpgChoiceIcon variant="x" :size="iconSize" />
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
                            <RpgChoiceIcon variant="o" :size="iconSize" />
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
    import RpgChoiceIcon from '@/presets/rpg-dialogue/components/RpgChoiceIcon.vue';
    import type { RpgPreviewCanvasProps } from '@/presets/rpg-dialogue/types';

    const BASE_W = 1080;
    const BASE_H = 1920;
    const FONT = "'Lora', serif";
    const PREVIEW_PULSE = 0.65;
    const props = withDefaults(defineProps<RpgPreviewCanvasProps>(), {
        width: 260,
    });

    const pixelateId = `rpgprev-${Math.random().toString(36).slice(2, 9)}`;

    const scale = computed(() => props.width / BASE_W);
    const stageHeight = computed(() => Math.round((props.width * BASE_H) / BASE_W));

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

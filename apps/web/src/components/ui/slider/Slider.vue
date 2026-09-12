<template>
    <SliderRoot
        v-slot="{ modelValue: sliderValue }"
        v-bind="forwarded"
        ref="sliderRootRef"
        :class="
            cn(
                'relative flex w-full touch-none items-center select-none cursor-pointer data-disabled:opacity-50 data-vertical:h-full data-vertical:w-auto data-vertical:flex-col group',
                props.class,
            )
        "
        data-slot="slider"
        :data-vertical="props.orientation === 'vertical' ? '' : undefined"
        :model-value="clampHandles(props.modelValue)"
        :min-steps-between-thumbs="effectiveMinStepsBetweenThumbs"
        @pointerdown="onPointerDown"
        @update:model-value="onUpdate"
    >
        <SliderTrack
            class="bg-muted rounded-full overflow-hidden data-horizontal:h-1 data-vertical:w-1 relative grow data-horizontal:w-full data-vertical:h-full"
            :style="trackStyle"
            :data-horizontal="props.orientation !== 'vertical' ? '' : undefined"
            data-slot="slider-track"
            :data-vertical="props.orientation === 'vertical' ? '' : undefined"
        >
            <div
                v-if="hasHandleBounds"
                class="absolute inset-y-0 select-none rounded-full bg-muted"
                :style="handleRangeStyle"
                aria-hidden="true"
            />
            <SliderRange
                v-if="!props.hideRange && props.rangeStart === undefined"
                class="bg-primary absolute select-none rounded-full data-horizontal:h-full data-vertical:w-full"
                :data-horizontal="props.orientation !== 'vertical' ? '' : undefined"
                data-slot="slider-range"
                :data-vertical="props.orientation === 'vertical' ? '' : undefined"
            />
            <div
                v-else-if="!props.hideRange"
                class="bg-primary absolute inset-y-0 select-none rounded-full"
                :style="progressRangeStyle"
                aria-hidden="true"
            />
        </SliderTrack>

        <SliderThumb
            v-for="(_, key) in sliderValue"
            :key="key"
            class="border-primary ring-ring/50 size-3 rounded-full border bg-white shadow-sm transition-[color,box-shadow] hover:ring-4 focus-visible:ring-4 focus-visible:outline-hidden block shrink-0 select-none disabled:pointer-events-none disabled:opacity-50"
            data-slot="slider-thumb"
            :data-vertical="props.orientation === 'vertical' ? '' : undefined"
        />
    </SliderRoot>
</template>

<script setup lang="ts">
    import { reactiveOmit } from '@vueuse/core';
    import type { SliderRootEmits, SliderRootProps } from 'reka-ui';
    import {
        SliderRange,
        SliderRoot,
        SliderThumb,
        SliderTrack,
        useForwardPropsEmits,
    } from 'reka-ui';
    import { computed, onUnmounted, ref, type HTMLAttributes } from 'vue';
    import { cn } from '@/lib/utils';

    const props = defineProps<
        SliderRootProps & {
            class?: HTMLAttributes['class'];
            handleMin?: number;
            handleMax?: number;
            hideRange?: boolean;
            rangeStart?: number;
        }
    >();
    const emits = defineEmits<SliderRootEmits>();

    const delegatedProps = reactiveOmit(
        props,
        'class',
        'handleMin',
        'handleMax',
        'hideRange',
        'rangeStart',
    );

    const forwarded = useForwardPropsEmits(delegatedProps, emits);
    const sliderRootRef = ref<{ $el?: HTMLElement } | null>(null);
    const activeThumbIndex = ref<number | null>(null);

    const hasHandleBounds = computed(
        () => props.handleMin !== undefined || props.handleMax !== undefined,
    );
    const effectiveMinStepsBetweenThumbs = computed(() => {
        if ((props.modelValue?.length ?? 0) < 2) return props.minStepsBetweenThumbs;
        return Math.max(1, Number(props.minStepsBetweenThumbs ?? 0));
    });

    const trackStyle = computed(() => {
        return hasHandleBounds.value ? { background: 'var(--background)' } : undefined;
    });

    const handleRangeStyle = computed(() => {
        if (!hasHandleBounds.value) return undefined;
        const min = Number(props.min ?? 0);
        const max = Number(props.max ?? 100);
        const span = max - min || 1;
        const start = Math.max(0, Math.min(100, (((props.handleMin ?? min) - min) / span) * 100));
        const end = Math.max(start, Math.min(100, (((props.handleMax ?? max) - min) / span) * 100));
        return {
            left: `${start}%`,
            width: `calc(${end - start}% + 4px)`,
        };
    });

    const progressRangeStyle = computed(() => {
        if (props.rangeStart === undefined) return undefined;
        const min = Number(props.min ?? 0);
        const max = Number(props.max ?? 100);
        const span = max - min || 1;
        const current = Number(props.modelValue?.[0] ?? props.rangeStart);
        const start = Math.max(0, Math.min(100, ((props.rangeStart - min) / span) * 100));
        const end = Math.max(start, Math.min(100, ((current - min) / span) * 100));
        return { left: `${start}%`, width: `${end - start}%` };
    });

    function clampHandles(value: number[] | null | undefined) {
        if (!value) return value;
        const clamped = value.map((point) => {
            const lower = props.handleMin ?? props.min ?? -Infinity;
            const upper = props.handleMax ?? props.max ?? Infinity;
            return Math.min(upper, Math.max(lower, point));
        });
        if (clamped.length < 2) return clamped;
        const start = Math.min(clamped[0], clamped[1]);
        const end = Math.max(clamped[0], clamped[1]);
        return [start, end, ...clamped.slice(2)];
    }

    function onUpdate(value: number[] | undefined) {
        const next = clampHandles(value) ?? [];
        const current = clampHandles(props.modelValue);
        if (activeThumbIndex.value !== null && next.length >= 2 && current && current.length >= 2) {
            const index = activeThumbIndex.value;
            const minimumGap =
                Number(props.step ?? 1) * (effectiveMinStepsBetweenThumbs.value ?? 1);
            const lowerBound = Number(props.handleMin ?? props.min ?? 0);
            const upperBound = Number(props.handleMax ?? props.max ?? 100);
            if (index === 0) {
                if (next[1] > current[1]) {
                    emits('update:modelValue', [
                        Math.max(lowerBound, current[1] - minimumGap),
                        current[1],
                        ...next.slice(2),
                    ]);
                    return;
                }
                emits('update:modelValue', [
                    Math.min(next[0], current[1] - minimumGap),
                    current[1],
                    ...next.slice(2),
                ]);
                return;
            }
            if (next[0] < current[0]) {
                emits('update:modelValue', [
                    current[0],
                    Math.min(upperBound, current[0] + minimumGap),
                    ...next.slice(2),
                ]);
                return;
            }
            emits('update:modelValue', [
                current[0],
                Math.max(next[1], current[0] + minimumGap),
                ...next.slice(2),
            ]);
            return;
        }
        emits('update:modelValue', next);
    }

    function onPointerDown(event: PointerEvent) {
        if ((props.modelValue?.length ?? 0) < 2) return;
        const thumb = (event.target as HTMLElement | null)?.closest('[data-slot="slider-thumb"]');
        const thumbs = Array.from(
            sliderRootRef.value?.$el?.querySelectorAll('[data-slot="slider-thumb"]') ?? [],
        );
        const thumbIndex = thumb ? thumbs.indexOf(thumb) : -1;
        activeThumbIndex.value = thumbIndex >= 0 ? thumbIndex : null;
    }

    function resetPointerSession() {
        activeThumbIndex.value = null;
    }

    window.addEventListener('pointerup', resetPointerSession);
    onUnmounted(() => window.removeEventListener('pointerup', resetPointerSession));
</script>

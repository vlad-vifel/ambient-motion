<template>
    <SliderRoot
        v-slot="{ modelValue: sliderValue }"
        :class="
            cn(
                'relative flex w-full touch-none items-center select-none cursor-pointer data-disabled:opacity-50 data-vertical:h-full data-vertical:w-auto data-vertical:flex-col group',
                props.class,
            )
        "
        data-slot="slider"
        :data-vertical="props.orientation === 'vertical' ? '' : undefined"
        v-bind="forwarded"
    >
        <SliderTrack
            class="bg-muted rounded-full data-horizontal:h-1 data-vertical:w-1 relative grow data-horizontal:w-full data-vertical:h-full"
            :data-horizontal="props.orientation !== 'vertical' ? '' : undefined"
            data-slot="slider-track"
            :data-vertical="props.orientation === 'vertical' ? '' : undefined"
        >
            <SliderRange
                class="bg-primary absolute select-none rounded-full data-horizontal:h-full data-vertical:w-full"
                :data-horizontal="props.orientation !== 'vertical' ? '' : undefined"
                data-slot="slider-range"
                :data-vertical="props.orientation === 'vertical' ? '' : undefined"
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
    import type { HTMLAttributes } from 'vue';
    import { cn } from '@/lib/utils';

    const props = defineProps<SliderRootProps & { class?: HTMLAttributes['class'] }>();
    const emits = defineEmits<SliderRootEmits>();

    const delegatedProps = reactiveOmit(props, 'class');

    const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

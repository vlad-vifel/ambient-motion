<template>
    <DialogOverlay
        :class="
            cn(
                'bg-black/10 supports-backdrop-filter:backdrop-blur-xs fixed inset-0 z-50 duration-100 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0',
                props.class,
            )
        "
        data-slot="sheet-overlay"
        v-bind="delegatedProps"
    >
        <slot />
    </DialogOverlay>
</template>

<script setup lang="ts">
    import { reactiveOmit } from '@vueuse/core';
    import type { DialogOverlayProps } from 'reka-ui';
    import { DialogOverlay } from 'reka-ui';
    import type { HTMLAttributes } from 'vue';
    import { cn } from '@/lib/utils';

    const props = defineProps<DialogOverlayProps & { class?: HTMLAttributes['class'] }>();

    const delegatedProps = reactiveOmit(props, 'class');
</script>

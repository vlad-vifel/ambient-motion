<template>
    <div
        :class="cn('gap-2 p-2 flex flex-col', props.class)"
        data-sidebar="footer"
        data-slot="sidebar-footer"
    >
        <slot />
    </div>
</template>

<script setup lang="ts">
    import type { HTMLAttributes } from 'vue';
    import { cn } from '@/lib/utils';

    const props = defineProps<{
        class?: HTMLAttributes['class'];
    }>();
</script>

<template>
    <ul
        :class="cn('gap-1 flex w-full min-w-0 flex-col', props.class)"
        data-sidebar="menu"
        data-slot="sidebar-menu">
        <slot />
    </ul>
</template>

<script setup lang="ts">
    import type { HTMLAttributes } from 'vue';
    import { cn } from '@/lib/utils';

    const props = defineProps<{
        class?: HTMLAttributes['class'];
    }>();
</script>

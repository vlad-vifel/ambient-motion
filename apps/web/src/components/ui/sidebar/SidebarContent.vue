<template>
    <div
        :class="
            cn(
                'no-scrollbar gap-2 flex min-h-0 flex-1 flex-col overflow-auto group-data-[collapsible=icon]:overflow-hidden',
                props.class,
            )
        "
        data-sidebar="content"
        data-slot="sidebar-content"
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

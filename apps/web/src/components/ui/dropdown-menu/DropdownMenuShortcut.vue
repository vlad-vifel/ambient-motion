<template>
    <span
        :class="
            cn(
                'text-muted-foreground group-focus/dropdown-menu-item:text-accent-foreground ml-auto text-xs tracking-widest',
                props.class,
            )
        "
        data-slot="dropdown-menu-shortcut">
        <slot />
    </span>
</template>

<script setup lang="ts">
    import type { HTMLAttributes } from 'vue';
    import { cn } from '@/lib/utils';

    const props = defineProps<{
        class?: HTMLAttributes['class'];
    }>();
</script>

<template>
    <DropdownMenuTrigger data-slot="dropdown-menu-trigger" v-bind="forwardedProps">
        <slot />
    </DropdownMenuTrigger>
</template>

<script setup lang="ts">
    import type { DropdownMenuTriggerProps } from 'reka-ui';
    import { DropdownMenuTrigger, useForwardPropsEmits } from 'reka-ui';

    const props = defineProps<DropdownMenuTriggerProps>();

    const emits = defineEmits<{
        click: [MouseEvent];
    }>();

    const forwardedProps = useForwardPropsEmits(props, emits);
</script>

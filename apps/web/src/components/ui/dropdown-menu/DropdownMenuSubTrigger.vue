<template>
    <DropdownMenuSubTrigger
        v-bind="forwardedProps"
        :class="
            cn(
                'focus:bg-accent focus:text-accent-foreground data-open:bg-accent data-open:text-accent-foreground not-data-[variant=destructive]:focus:**:text-accent-foreground gap-2 rounded-sm px-2 py-1.5 text-sm data-inset:pl-8 [&_svg:not([class*=size-])]:size-4 flex cursor-default items-center outline-hidden select-none [&_svg]:pointer-events-none [&_svg]:shrink-0',
                props.class,
            )
        "
        :data-inset="inset ? '' : undefined"
        data-slot="dropdown-menu-sub-trigger">
        <slot />
        <ChevronRightIcon class="cn-rtl-flip ml-auto" />
    </DropdownMenuSubTrigger>
</template>

<script setup lang="ts">
    import { reactiveOmit } from '@vueuse/core';
    import { ChevronRightIcon } from 'lucide-vue-next';
    import type { DropdownMenuSubTriggerProps } from 'reka-ui';
    import { DropdownMenuSubTrigger, useForwardProps } from 'reka-ui';
    import type { HTMLAttributes } from 'vue';
    import { cn } from '@/lib/utils';

    const props = defineProps<
        DropdownMenuSubTriggerProps & { class?: HTMLAttributes['class']; inset?: boolean }
    >();

    const delegatedProps = reactiveOmit(props, 'class', 'inset');
    const forwardedProps = useForwardProps(delegatedProps);
</script>

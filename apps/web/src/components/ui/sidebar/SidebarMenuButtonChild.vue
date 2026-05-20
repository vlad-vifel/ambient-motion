<template>
    <Primitive
        :as="as"
        :as-child="asChild"
        :class="cn(sidebarMenuButtonVariants({ variant, size }), props.class)"
        :data-active="isActive"
        data-sidebar="menu-button"
        :data-size="size"
        data-slot="sidebar-menu-button"
        v-bind="$attrs">
        <slot />
    </Primitive>
</template>

<script setup lang="ts">
    import type { PrimitiveProps } from 'reka-ui';
    import { Primitive } from 'reka-ui';
    import type { HTMLAttributes } from 'vue';
    import type { SidebarMenuButtonVariants } from '.';
    import { sidebarMenuButtonVariants } from '.';
    import { cn } from '@/lib/utils';

    export interface SidebarMenuButtonProps extends PrimitiveProps {
        variant?: SidebarMenuButtonVariants['variant'];
        size?: SidebarMenuButtonVariants['size'];
        isActive?: boolean;
        class?: HTMLAttributes['class'];
    }

    const props = withDefaults(defineProps<SidebarMenuButtonProps>(), {
        as: 'button',
        variant: 'default' as SidebarMenuButtonVariants['variant'],
        size: 'default' as SidebarMenuButtonVariants['size'],
        isActive: false,
        class: undefined,
    });

    defineEmits<{
        click: [MouseEvent];
    }>();
</script>

<script setup lang="ts">
    import type { PrimitiveProps } from 'reka-ui';
    import { Primitive } from 'reka-ui';
    import type { HTMLAttributes } from 'vue';
    import type { ButtonVariants } from '.';
    import { buttonVariants } from '.';
    import { cn } from '@/lib/utils';

    interface Props extends PrimitiveProps {
        variant?: ButtonVariants['variant'];
        size?: ButtonVariants['size'];
        class?: HTMLAttributes['class'];
    }

    const props = withDefaults(defineProps<Props>(), {
        as: 'button' as any,
        variant: 'default' as any,
        size: 'default' as any,
        class: undefined,
    });

    defineEmits<{
        click: [MouseEvent];
    }>();
</script>

<template>
    <Primitive
        :as="as"
        :as-child="asChild"
        :class="cn(buttonVariants({ variant, size }), props.class)"
        :data-size="size"
        data-slot="button"
        :data-variant="variant">
        <slot />
    </Primitive>
</template>

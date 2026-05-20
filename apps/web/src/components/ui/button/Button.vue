<script setup lang="ts">
    import type { PrimitiveProps } from 'reka-ui';
    import type { HTMLAttributes } from 'vue';
    import type { ButtonVariants } from '.';
    import { Primitive } from 'reka-ui';
    import { cn } from '@/lib/utils';
    import { buttonVariants } from '.';

    interface Props extends PrimitiveProps {
        variant?: ButtonVariants['variant'];
        size?: ButtonVariants['size'];
        class?: HTMLAttributes['class'];
    }

    const props = withDefaults(defineProps<Props>(), {
        as: 'button',
        variant: 'default',
        size: 'default',
    });

    const { as, asChild, variant, size, class: customClass } = props;
</script>

<template>
    <Primitive
        data-slot="button"
        :data-variant="variant"
        :data-size="size"
        :as="as"
        :as-child="asChild"
        :class="cn(buttonVariants({ variant, size }), customClass)"
    >
        <slot />
    </Primitive>
</template>

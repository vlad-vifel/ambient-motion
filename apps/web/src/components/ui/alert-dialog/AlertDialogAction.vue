<script setup lang="ts">
    import { reactiveOmit } from '@vueuse/core';
    import type { AlertDialogActionProps } from 'reka-ui';
    import { AlertDialogAction } from 'reka-ui';
    import type { HTMLAttributes } from 'vue';
    import type { ButtonVariants } from '@/components/ui/button';
    import { buttonVariants } from '@/components/ui/button';
    import { cn } from '@/lib/utils';

    const props = withDefaults(
        defineProps<
            AlertDialogActionProps & {
                class?: HTMLAttributes['class'];
                variant?: ButtonVariants['variant'];
                size?: ButtonVariants['size'];
            }
        >(),
        {
            variant: 'default' as ButtonVariants['variant'],
            size: 'default' as ButtonVariants['size'],
            class: undefined,
        },
    );

    defineEmits<{
        click: [MouseEvent];
    }>();

    const delegatedProps = reactiveOmit(props, 'class', 'variant', 'size');
</script>

<template>
    <AlertDialogAction
        v-bind="delegatedProps"
        :class="cn('', buttonVariants({ variant, size }), props.class)"
        data-slot="alert-dialog-action"
    >
        <slot />
    </AlertDialogAction>
</template>

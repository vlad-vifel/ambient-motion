<template>
    <AvatarRoot
        :class="cn(avatarVariants({ size }), props.class)"
        :data-size="size ?? 'default'"
        data-slot="avatar"
    >
        <slot />
    </AvatarRoot>
</template>

<script setup lang="ts">
    import { AvatarRoot } from 'reka-ui';
    import type { HTMLAttributes } from 'vue';
    import type { AvatarVariants } from '.';
    import { avatarVariants } from '.';
    import { cn } from '@/lib/utils';

    const props = defineProps<{
        class?: HTMLAttributes['class'];
        size?: AvatarVariants['size'];
    }>();
</script>

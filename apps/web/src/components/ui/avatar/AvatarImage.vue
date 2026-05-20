<template>
    <AvatarImage
        v-bind="props"
        class="rounded-full aspect-square size-full object-cover"
        data-slot="avatar-image"
    >
        <slot />
    </AvatarImage>
</template>

<script setup lang="ts">
    import type { AvatarImageProps } from 'reka-ui';
    import { AvatarImage } from 'reka-ui';

    const props = defineProps<AvatarImageProps>();
</script>

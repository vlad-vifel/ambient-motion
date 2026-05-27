<script setup lang="ts">
    import { onMounted } from 'vue';

    onMounted(async () => {
        // @ts-expect-error missing type definitions
        const { Analytics } = await import('@vercel/analytics/web');
        Analytics();
    });
</script>

<template>
    <RouterView />
</template>

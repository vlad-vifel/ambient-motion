<script setup lang="ts">
    import { onMounted } from 'vue';

    onMounted(async () => {
        const { Analytics } = await import('@vercel/analytics/vue');
        Analytics();
    });
</script>

<template>
    <RouterView />
</template>

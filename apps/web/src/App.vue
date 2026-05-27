<script setup lang="ts">
    import { onMounted } from 'vue';

    onMounted(() => {
        try {
            // @ts-expect-error missing type definitions
            import('@vercel/analytics/vue').then((mod) => {
                if (mod?.Analytics && typeof mod.Analytics === 'function') {
                    mod.Analytics();
                }
            });
        } catch (error) {
            console.error('Failed to load analytics:', error);
        }
    });
</script>

<template>
    <RouterView />
</template>

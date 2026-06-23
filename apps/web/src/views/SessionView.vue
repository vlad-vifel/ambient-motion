<template>
    <div v-if="loading" class="flex items-center justify-center h-64">
        <Loader2 class="size-6 text-muted-foreground animate-spin" />
    </div>
    <CreateNewView v-else-if="isDraft" :key="`draft-${sessionId}`" />
    <SessionDetailView v-else :key="`session-${sessionId}`" />
</template>

<script setup lang="ts">
    import { Loader2 } from 'lucide-vue-next';
    import { computed, ref, watch } from 'vue';
    import { useRoute, useRouter } from 'vue-router';
    import CreateNewView from '@/views/CreateNewView.vue';
    import SessionDetailView from '@/views/SessionDetailView.vue';
    import { useSessionsStore } from '@/stores/sessions';

    const route = useRoute();
    const router = useRouter();
    const sessionsStore = useSessionsStore();

    const loading = ref(true);
    const sessionId = computed(() => route.params.id as string);

    const isDraft = computed(
        () => sessionsStore.current?.id === sessionId.value && !!sessionsStore.current?.isDraft,
    );

    async function load() {
        loading.value = true;
        try {
            await sessionsStore.fetchOne(sessionId.value);
        } catch {
            router.replace('/create');
        } finally {
            loading.value = false;
        }
    }

    watch(sessionId, load, { immediate: true });
</script>

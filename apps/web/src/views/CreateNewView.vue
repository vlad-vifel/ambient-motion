<template>
    <div class="mx-auto flex w-full max-w-xl flex-col gap-6">
        <div v-if="!ready" class="flex h-64 items-center justify-center">
            <Loader2 class="size-6 animate-spin text-muted-foreground" />
        </div>
        <template v-else>
            <div
                v-if="creationStep === 1"
                class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
            >
                <div>
                    <h2 class="text-xl font-semibold">Create videos</h2>
                    <p class="mt-0.5 text-sm text-muted-foreground">
                        Configure your generation session
                    </p>
                </div>
            </div>

            <PresetSelectField
                v-if="creationStep === 1"
                v-model="presetId"
                :presets="orderedPresets"
            />

            <component
                :is="presetDefinition.createComponent"
                v-if="presetDefinition"
                :key="presetId"
                :preset-id="presetId"
                @step-change="updateCreationStep"
            />
        </template>
    </div>
</template>

<script setup lang="ts">
    import { computed, onMounted, ref, watch } from 'vue';
    import { useRoute, useRouter } from 'vue-router';
    import { Loader2 } from 'lucide-vue-next';
    import PresetSelectField from '@/components/create/PresetSelectField.vue';
    import { useBreadcrumbs } from '@/composables/useBreadcrumbs';
    import { getPresetDefinition } from '@/presets/registry';
    import { usePresetsStore } from '@/stores/presets';
    import { useSessionsStore } from '@/stores/sessions';

    const route = useRoute();
    const router = useRouter();
    const breadcrumbs = useBreadcrumbs();
    const presetsStore = usePresetsStore();
    const sessionsStore = useSessionsStore();
    const ready = ref(false);
    const presetId = ref('');
    const creationStep = ref<1 | 2>(1);
    const presetDefinition = computed(() => getPresetDefinition(presetId.value));
    const presetOrder = ['ambient-motion', 'rpg-dialogue', 'music-widget'];
    const orderedPresets = computed(() =>
        [...presetsStore.items].sort((a, b) => {
            const aIndex = presetOrder.indexOf(a.id);
            const bIndex = presetOrder.indexOf(b.id);
            if (aIndex !== -1 || bIndex !== -1) {
                return (
                    (aIndex === -1 ? Number.POSITIVE_INFINITY : aIndex) -
                    (bIndex === -1 ? Number.POSITIVE_INFINITY : bIndex)
                );
            }
            return a.name.localeCompare(b.name);
        }),
    );

    watch(presetId, () => {
        creationStep.value = 1;
    });

    function updateCreationStep(step: 1 | 2) {
        creationStep.value = step;
    }

    onMounted(async () => {
        breadcrumbs.setBreadcrumbs([
            { label: 'Create', onClick: () => router.push('/create') },
            { label: 'New video session' },
        ]);
        await presetsStore.fetchAll();

        const sessionId = route.params.id as string | undefined;
        if (sessionId) {
            const session =
                sessionsStore.current?.id === sessionId
                    ? sessionsStore.current
                    : await sessionsStore.fetchOne(sessionId);
            presetId.value = session.presetId;
        }
        ready.value = true;
    });
</script>

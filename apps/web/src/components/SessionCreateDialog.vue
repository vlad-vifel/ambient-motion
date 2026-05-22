<template>
    <Dialog :open="open" @update:open="(v) => v && emit('update:open', v)">
        <DialogContent
            class="max-w-xl p-0 gap-0 overflow-hidden"
            :disable-outside-close="true"
            :show-close-button="false"
        >
            <DialogHeader class="px-6 pt-6 pb-4">
                <DialogTitle>Create videos</DialogTitle>
            </DialogHeader>

            <div class="px-6 pb-6 flex flex-col gap-5">
                <div class="flex flex-col gap-1.5">
                    <label class="flex items-center text-xs text-muted-foreground"
                    >Audio track</label
                    >
                    <Select v-model="form.audioId">
                        <SelectTrigger>
                            <SelectValue placeholder="Select an audio track" class="w-full" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem
                                v-for="track in audioStore.items"
                                :key="track.id"
                                :value="track.id"
                            >
                                {{ track.title }} - {{ track.artist }} ({{
                                    Math.round(track.duration / 1000)
                                }}s)
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div class="flex flex-col gap-1.5">
                    <label class="flex items-center text-xs text-muted-foreground">Assets</label>
                    <Select v-model="form.assetSource">
                        <SelectTrigger>
                            <SelectValue placeholder="Select assets" class="w-full" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all"
                            >All assets ({{ assetsStore.items.length }})</SelectItem
                            >
                            <SelectItem
                                v-for="folder in foldersStore.items"
                                :key="folder.id"
                                :value="folder.id"
                            >
                                {{ folder.name }} ({{ assetCountByFolder[folder.id] ?? 0 }})
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div class="flex flex-col gap-2">
                    <label class="flex items-center text-xs text-muted-foreground">Phrases</label>
                    <div class="flex flex-col gap-2">
                        <div v-for="(_, i) in phrases" :key="i" class="flex items-center gap-2">
                            <Input
                                v-model="phrases[i]"
                                placeholder="nothing feels the same now"
                                class="flex-1"
                            />
                            <button
                                v-if="phrases.length > 1"
                                type="button"
                                class="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                                @click="removePhrase(i)"
                            >
                                <X class="size-3.5" />
                            </button>
                        </div>
                    </div>
                    <button
                        type="button"
                        class="self-start text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 mt-1"
                        @click="addPhrase"
                    >
                        <Plus class="size-3" />
                        Add phrase
                    </button>
                </div>

                <p v-if="error" class="text-sm text-destructive">{{ error }}</p>
                <p v-if="validationMessage" class="text-sm text-yellow-600">
                    {{ validationMessage }}
                </p>

                <div class="flex items-center justify-end gap-2 pt-1">
                    <Button size="sm" variant="ghost" @click="onCancel">Cancel</Button>
                    <Button :disabled="!canSubmit" size="sm" @click="submit">
                        Create videos{{ filledCount ? ` (${filledCount})` : '' }}
                    </Button>
                </div>
            </div>
        </DialogContent>
    </Dialog>
</template>

<script setup lang="ts">
    import { Plus, X } from 'lucide-vue-next';
    import { computed, reactive, ref, watch } from 'vue';
    import { useRouter } from 'vue-router';
    import { Button } from '@/components/ui/button';
    import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
    import { Input } from '@/components/ui/input';
    import {
        Select,
        SelectContent,
        SelectItem,
        SelectTrigger,
        SelectValue,
    } from '@/components/ui/select';
    import { useAudioStore } from '@/stores/audio';
    import { useAssetsStore } from '@/stores/assets';
    import { useFoldersStore } from '@/stores/folders';
    import { useSessionsStore } from '@/stores/sessions';

    const props = defineProps<{ open: boolean }>();
    const emit = defineEmits<{ (e: 'update:open', v: boolean): void }>();

    const router = useRouter();
    const audioStore = useAudioStore();
    const assetsStore = useAssetsStore();
    const foldersStore = useFoldersStore();
    const sessionsStore = useSessionsStore();

    const submitting = ref(false);
    const error = ref('');
    const phrases = ref<string[]>(['']);

    const form = reactive({
        audioId: '',
        assetSource: 'all',
    });

    const selectedAudio = computed(
        () => audioStore.items.find((t) => t.id === form.audioId) ?? null,
    );

    const filledCount = computed(() => phrases.value.filter((p) => p.trim()).length);

    const assetCountByFolder = computed(() => {
        const counts: Record<string, number> = {};
        for (const asset of assetsStore.items) {
            const folderId = asset.folderId || 'none';
            counts[folderId] = (counts[folderId] ?? 0) + 1;
        }
        return counts;
    });

    const resolvedAssetIds = computed(() => {
        if (form.assetSource === 'all') return assetsStore.items.map((a) => a.id);
        return assetsStore.items.filter((a) => a.folderId === form.assetSource).map((a) => a.id);
    });

    const canSubmit = computed(
        () =>
            !submitting.value &&
            form.audioId &&
            resolvedAssetIds.value.length >= filledCount.value &&
            filledCount.value > 0,
    );

    const validationMessage = computed(() => {
        if (!form.audioId) return '';
        if (filledCount.value === 0) return '';
        if (resolvedAssetIds.value.length < filledCount.value) {
            return `Need at least ${filledCount.value} assets, but only ${resolvedAssetIds.value.length} available`;
        }
        return '';
    });

    watch(
        () => props.open,
        async (v) => {
            if (v) {
                await audioStore.fetchAll();
                await assetsStore.fetchAll();
                await foldersStore.fetchAll();
            } else {
                form.audioId = '';
                form.assetSource = 'all';
                phrases.value = [''];
                error.value = '';
            }
        },
    );

    function addPhrase() {
        phrases.value.push('');
    }

    function removePhrase(i: number) {
        phrases.value.splice(i, 1);
    }

    function onCancel() {
        emit('update:open', false);
    }

    async function submit() {
        if (!canSubmit.value) return;
        error.value = '';
        submitting.value = true;
        try {
            const audio = selectedAudio.value;
            const durationMs = Math.round(audio?.duration ?? 0);
            const session = await sessionsStore.create({
                audioId: form.audioId,
                assetIds: resolvedAssetIds.value,
                durationMs,
            });
            const filled = phrases.value.filter((p) => p.trim());
            await sessionsStore.generate(session.id, filled);
            emit('update:open', false);
            router.push(`/create/${session.id}`);
        } catch (e: unknown) {
            error.value =
                (e as { response?: { data?: { error?: string } } })?.response?.data?.error ??
                'Failed to create videos';
        } finally {
            submitting.value = false;
        }
    }
</script>

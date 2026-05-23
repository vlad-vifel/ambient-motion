h
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
                        <SelectTrigger
                            class="p-2 h-auto! border border-border bg-muted/20 hover:bg-muted/40"
                        >
                            <SelectValue as-child>
                                <div v-if="selectedAudio" class="w-full flex gap-3!">
                                    <div
                                        class="size-8 rounded-md bg-muted shrink-0 flex items-center justify-center overflow-hidden"
                                    >
                                        <img
                                            v-if="selectedAudio.coverUrl"
                                            :src="selectedAudio.coverUrl"
                                            class="size-full object-cover"
                                        />
                                        <Music v-else class="size-3.5 text-muted-foreground" />
                                    </div>
                                    <div class="flex-1 flex flex-col items-start gap-0.5">
                                        <span class="text-sm font-medium leading-none truncate">
                                            {{ selectedAudio.title }}
                                        </span>
                                        <span
                                            class="text-xs text-muted-foreground leading-none truncate"
                                        >
                                            {{ selectedAudio.artist }}
                                        </span>
                                    </div>
                                    <span class="text-xs text-muted-foreground shrink-0">{{
                                        formatDuration(selectedAudio.duration)
                                    }}</span>
                                </div>
                                <span v-else class="text-muted-foreground"
                                >Select an audio track</span
                                >
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem
                                v-for="track in audioStore.items"
                                :key="track.id"
                                :value="track.id"
                            >
                                <div class="flex items-center gap-3">
                                    <div
                                        class="size-8 rounded-md bg-muted shrink-0 flex items-center justify-center overflow-hidden"
                                    >
                                        <img
                                            v-if="track.coverUrl"
                                            :src="track.coverUrl"
                                            class="size-full object-cover"
                                        />
                                        <Music v-else class="size-3.5 text-muted-foreground" />
                                    </div>
                                    <div class="flex-1 flex flex-col items-start gap-0.5">
                                        <span class="text-sm font-medium leading-none truncate">
                                            {{ track.title }}
                                        </span>
                                        <span
                                            class="text-xs text-muted-foreground! leading-none truncate"
                                        >
                                            {{ track.artist }}
                                        </span>
                                    </div>
                                </div>
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div class="flex flex-col gap-1.5">
                    <label class="flex items-center text-xs text-muted-foreground">Assets</label>
                    <Select v-model="form.assetSource">
                        <SelectTrigger>
                            <SelectValue as-child>
                                <div v-if="form.assetSource" class="flex items-center gap-2">
                                    <Folders
                                        v-if="form.assetSource === 'all'"
                                        class="size-4 text-muted-foreground"
                                    />
                                    <Folder v-else class="size-4 text-muted-foreground" />
                                    <span>{{
                                        form.assetSource === 'all'
                                            ? `All assets (${totalAssetCount})`
                                            : `${foldersStore.items.find((f) => f.id === form.assetSource)?.name} (${assetCountByFolder[form.assetSource] ?? 0})`
                                    }}</span>
                                </div>
                                <span v-else class="text-muted-foreground">Select assets</span>
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">
                                <div class="flex items-center gap-2">
                                    <Folders class="size-4 text-muted-foreground" />
                                    <span>All assets ({{ totalAssetCount }})</span>
                                </div>
                            </SelectItem>
                            <SelectItem
                                v-for="folder in foldersStore.items"
                                :key="folder.id"
                                :value="folder.id"
                            >
                                <div class="flex items-center gap-2">
                                    <Folder class="size-4 text-muted-foreground" />
                                    <span
                                    >{{ folder.name }} ({{
                                        assetCountByFolder[folder.id] ?? 0
                                    }})</span
                                    >
                                </div>
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div class="flex flex-col gap-1.5">
                    <label class="text-xs text-muted-foreground">Style preset</label>
                    <Select v-model="form.presetId">
                        <SelectTrigger>
                            <SelectValue as-child>
                                <div v-if="selectedPreset" class="flex items-center gap-2 w-full">
                                    <span class="flex-1 flex justify-items-start">{{
                                        selectedPreset.name
                                    }}</span>
                                    <Badge
                                        variant="secondary"
                                        class="flex items-center gap-1 shrink-0"
                                    >
                                        <component
                                            :is="formatIcons[selectedPreset.format]"
                                            class="size-3"
                                        />
                                        <span>{{ formatLabels[selectedPreset.format] }}</span>
                                    </Badge>
                                </div>
                                <span v-else class="text-muted-foreground">Select a preset</span>
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem
                                v-for="preset in presetsStore.items"
                                :key="preset.id"
                                :value="preset.id"
                            >
                                <div class="flex items-center gap-2 w-full">
                                    <span class="flex-1 flex justify-items-start">{{
                                        preset.name
                                    }}</span>
                                    <Badge
                                        variant="secondary"
                                        class="flex items-center gap-1 shrink-0"
                                    >
                                        <component
                                            :is="formatIcons[preset.format]"
                                            class="size-3"
                                        />
                                        <span>{{ formatLabels[preset.format] }}</span>
                                    </Badge>
                                </div>
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
                                placeholder="Type a phrase"
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
    import {
        Plus,
        X,
        Music,
        Folder,
        Folders,
        Square,
        RectangleHorizontal,
        RectangleVertical,
    } from 'lucide-vue-next';
    import type { Component } from 'vue';
    import { computed, reactive, ref, watch } from 'vue';
    import { useRouter } from 'vue-router';
    import { Badge } from '@/components/ui/badge';
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
    import { usePresetsStore } from '@/stores/presets';
    import type { Asset } from '@/stores/assets';
    import api from '@/lib/api';

    const formatLabels: Record<string, string> = {
        LANDSCAPE_16_9: '16:9',
        STANDARD_4_3: '4:3',
        SQUARE_1_1: '1:1',
        PORTRAIT_3_4: '3:4',
        VERTICAL_9_16: '9:16',
    };

    const formatIcons: Record<string, Component> = {
        LANDSCAPE_16_9: RectangleHorizontal,
        STANDARD_4_3: RectangleHorizontal,
        SQUARE_1_1: Square,
        PORTRAIT_3_4: RectangleVertical,
        VERTICAL_9_16: RectangleVertical,
    };

    const props = defineProps<{ open: boolean }>();
    const emit = defineEmits<{ (e: 'update:open', v: boolean): void }>();

    const router = useRouter();
    const audioStore = useAudioStore();
    const assetsStore = useAssetsStore();
    const foldersStore = useFoldersStore();
    const sessionsStore = useSessionsStore();
    const presetsStore = usePresetsStore();

    const submitting = ref(false);
    const error = ref('');
    const phrases = ref<string[]>(['']);
    const allAssets = ref<Asset[]>([]);

    const form = reactive({
        audioId: '',
        assetSource: 'all',
        presetId: '',
    });

    const selectedAudio = computed(
        () => audioStore.items.find((t) => t.id === form.audioId) ?? null,
    );

    const selectedPreset = computed(
        () => presetsStore.items.find((p) => p.id === form.presetId) ?? null,
    );

    const filledCount = computed(() => phrases.value.filter((p) => p.trim()).length);

    const assetCountByFolder = computed(() => {
        const counts: Record<string, number> = {};
        for (const asset of allAssets.value) {
            const folderId = asset.folderId || 'none';
            counts[folderId] = (counts[folderId] ?? 0) + 1;
        }
        return counts;
    });

    const totalAssetCount = computed(() => allAssets.value.length);

    const resolvedAssetIds = computed(() => {
        if (form.assetSource === 'all') return allAssets.value.map((a) => a.id);
        return allAssets.value.filter((a) => a.folderId === form.assetSource).map((a) => a.id);
    });

    const canSubmit = computed(
        () =>
            !submitting.value &&
            form.audioId &&
            form.presetId &&
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
                await Promise.all([
                    audioStore.fetchAll(),
                    assetsStore.fetchAll(null),
                    foldersStore.fetchAll(),
                    presetsStore.fetchAll(),
                    api.get<Asset[]>('/api/assets').then((res) => {
                        allAssets.value = res.data;
                    }),
                ]);
            } else {
                form.audioId = '';
                form.assetSource = 'all';
                form.presetId = '';
                phrases.value = [''];
                error.value = '';
                allAssets.value = [];
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

    function formatDuration(ms: number): string {
        const totalSeconds = Math.round(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${String(seconds).padStart(2, '0')}`;
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
                presetId: form.presetId,
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

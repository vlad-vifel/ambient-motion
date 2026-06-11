<template>
    <div class="flex flex-col gap-6 pb-6">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <h2 class="text-xl font-semibold">Create</h2>
                <p class="text-sm text-muted-foreground mt-0.5">
                    Each session groups audio, assets and generated videos
                </p>
            </div>

            <div class="flex items-center gap-2">
                <Select v-if="availablePresets.length > 1" v-model="filterPresetId">
                    <SelectTrigger class="h-8! w-40 text-sm">
                        <SelectValue placeholder="All presets" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All presets</SelectItem>
                        <SelectItem
                            v-for="preset in availablePresets"
                            :key="preset.id"
                            :value="preset.id"
                        >
                            {{ preset.name }}
                        </SelectItem>
                    </SelectContent>
                </Select>
                <Button size="sm" @click="$router.push('/create/new')">
                    <Plus class="size-4" />
                    Create videos
                </Button>
            </div>
        </div>

        <div
            v-if="!sessionsStore.loading && !sessionsStore.items.length"
            class="rounded-xl border border-border/50 bg-card p-12 flex flex-col items-center justify-center gap-4 text-center min-h-64"
        >
            <div class="size-12 rounded-full bg-muted flex items-center justify-center">
                <Clapperboard class="size-6 text-muted-foreground" />
            </div>
            <div>
                <p class="font-medium">No sessions yet</p>
                <p class="text-sm text-muted-foreground mt-1">
                    Create your first session to start generating videos
                </p>
            </div>
        </div>

        <div v-else-if="sessionsStore.items.length" class="flex flex-col gap-2">
            <div
                v-for="session in filteredSessions"
                :key="session.id"
                class="group flex items-center gap-3 px-4 py-3 rounded-lg border border-transparent bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer"
                @click="$router.push(`/create/${session.id}`)"
            >
                <div
                    class="relative size-9 rounded-md bg-muted shrink-0 overflow-hidden flex items-center justify-center"
                >
                    <img
                        v-if="session.audio?.coverUrl"
                        :src="session.audio.coverUrl"
                        class="absolute inset-0 size-full object-cover"
                    />
                    <VolumeX v-else-if="session.noAudio" class="size-4 text-muted-foreground" />
                    <Music v-else class="size-4 text-muted-foreground" />
                </div>

                <div class="flex-1 min-w-0 flex flex-col">
                    <p class="text-sm font-medium truncate">
                        {{ sessionLabel(session) }}
                    </p>
                    <span
                        v-if="session.audio || session.noAudio"
                        class="flex text-xs text-muted-foreground truncate"
                    >
                        {{
                            session.noAudio
                                ? 'No audio'
                                : session.audio!.title +
                                    (session.audio!.artist ? ` – ${session.audio!.artist}` : '')
                        }}
                    </span>
                </div>

                <Badge
                    v-if="session.preset"
                    variant="secondary"
                    class="flex items-center gap-1 shrink-0"
                >
                    <span
                    >{{ session.preset.name }} ({{ formatLabels[session.preset.format] }})</span
                    >
                    <component :is="formatIcons[session.preset.format]" class="size-3" />
                </Badge>

                <div class="hidden sm:group-hover:flex items-center gap-1 shrink-0">
                    <button
                        class="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        title="Delete"
                        @click.stop="startDelete(session.id)"
                    >
                        <Trash2 class="size-3.5" />
                    </button>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger as-child class="sm:hidden" @click.stop>
                        <button
                            class="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
                        >
                            <MoreVertical class="size-4" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" @click.stop>
                        <DropdownMenuItem
                            class="text-destructive focus:text-destructive"
                            @click="startDelete(session.id)"
                        >
                            <Trash2 class="size-4" />
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    </div>

    <AlertDialog v-model:open="deleteOpen">
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Delete session?</AlertDialogTitle>
                <AlertDialogDescription class="text-wrap">
                    The session will be deleted. Videos generated in this session will be kept.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel @click="deleteOpen = false">No</AlertDialogCancel>
                <AlertDialogAction
                    class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    @click="submitDelete"
                >
                    Yes
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
</template>

<script setup lang="ts">
    import { Clapperboard, MoreVertical, Music, Plus, Trash2, VolumeX } from 'lucide-vue-next';
    import { computed, onMounted, ref } from 'vue';
    import { useBreadcrumbs } from '@/composables/useBreadcrumbs';
    import {
        AlertDialog,
        AlertDialogAction,
        AlertDialogCancel,
        AlertDialogContent,
        AlertDialogDescription,
        AlertDialogFooter,
        AlertDialogHeader,
        AlertDialogTitle,
    } from '@/components/ui/alert-dialog';
    import {
        DropdownMenu,
        DropdownMenuContent,
        DropdownMenuItem,
        DropdownMenuTrigger,
    } from '@/components/ui/dropdown-menu';
    import {
        Select,
        SelectContent,
        SelectItem,
        SelectTrigger,
        SelectValue,
    } from '@/components/ui/select';
    import { Button } from '@/components/ui/button';
    import { Badge } from '@/components/ui/badge';
    import { formatIcons, formatLabels } from '@/lib/presetFormat';
    import { useSessionsStore } from '@/stores/sessions';
    import type { GenerationSession } from '@/types/session';

    const sessionsStore = useSessionsStore();
    const breadcrumbsComposable = useBreadcrumbs();

    const filterPresetId = ref('all');
    const deleteOpen = ref(false);
    const deleteSessionId = ref('');

    const availablePresets = computed(() => {
        const seen = new Map<string, { id: string; name: string }>();
        for (const s of sessionsStore.items) {
            if (s.preset && !seen.has(s.preset.id)) {
                seen.set(s.preset.id, s.preset);
            }
        }
        return [...seen.values()];
    });

    const filteredSessions = computed(() => {
        if (filterPresetId.value === 'all') return sessionsStore.items;
        return sessionsStore.items.filter((s) => s.presetId === filterPresetId.value);
    });

    onMounted(async () => {
        await sessionsStore.fetchAll();
        breadcrumbsComposable.setBreadcrumbs([{ label: 'Create' }]);
    });

    function sessionLabel(session: GenerationSession): string {
        if (session.name) return session.name;
        return `Session #${session.index}`;
    }

    function startDelete(id: string) {
        deleteSessionId.value = id;
        deleteOpen.value = true;
    }

    async function submitDelete() {
        await sessionsStore.remove(deleteSessionId.value);
        deleteOpen.value = false;
    }
</script>

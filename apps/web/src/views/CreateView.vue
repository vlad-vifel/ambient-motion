<template>
    <div class="flex flex-col gap-6">
        <div class="flex items-center justify-between">
            <div>
                <h2 class="text-xl font-semibold">Sessions</h2>
                <p class="text-sm text-muted-foreground mt-0.5">
                    Each session groups audio, assets and generated videos
                </p>
            </div>

            <Button size="sm" @click="showCreate = true">
                <Plus class="size-4" />
                Create videos
            </Button>
        </div>

        <div
            v-if="!sessionsStore.items.length"
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
                v-for="(session, i) in sessionsStore.items"
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
                    <Music v-else class="size-4 text-muted-foreground" />
                </div>

                <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium truncate">
                        {{ sessionLabel(session, i) }}
                    </p>
                    <p v-if="session.audio" class="text-xs text-muted-foreground truncate">
                        {{ session.audio.title
                        }}{{ session.audio.artist ? ` – ${session.audio.artist}` : '' }}
                    </p>
                </div>

                <div class="hidden group-hover:flex items-center gap-1 shrink-0 ml-2">
                    <button
                        class="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        title="Rename"
                        @click.stop="startRename(session)"
                    >
                        <Pencil class="size-3.5" />
                    </button>
                    <button
                        class="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        title="Delete"
                        @click.stop="startDelete(session.id)"
                    >
                        <Trash2 class="size-3.5" />
                    </button>
                </div>
            </div>
        </div>
    </div>

    <SessionCreateDialog v-model:open="showCreate" />

    <Dialog v-model:open="renameOpen">
        <DialogContent
            class="max-w-sm p-0 gap-0 overflow-hidden"
            :disable-outside-close="true"
            :show-close-button="false"
        >
            <DialogHeader class="px-6 pt-6 pb-4">
                <DialogTitle>Rename session</DialogTitle>
            </DialogHeader>
            <div class="px-6 pb-6 flex flex-col gap-4">
                <div class="flex flex-col gap-1.5">
                    <label class="text-xs text-muted-foreground">Session name</label>
                    <Input
                        v-model="renameValue"
                        placeholder="Session name"
                        @keydown.enter="submitRename"
                    />
                </div>
                <div class="flex items-center justify-end gap-2">
                    <Button size="sm" variant="ghost" @click="renameOpen = false">Cancel</Button>
                    <Button size="sm" @click="submitRename">Save</Button>
                </div>
            </div>
        </DialogContent>
    </Dialog>

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
    import { Clapperboard, Music, Pencil, Plus, Trash2 } from 'lucide-vue-next';
    import { onMounted, ref } from 'vue';
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
    import { Button } from '@/components/ui/button';
    import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
    import { Input } from '@/components/ui/input';
    import { useSessionsStore } from '@/stores/sessions';
    import { useAudioStore } from '@/stores/audio';
    import { useAssetsStore } from '@/stores/assets';
    import { useFoldersStore } from '@/stores/folders';
    import SessionCreateDialog from '@/components/SessionCreateDialog.vue';
    import type { GenerationSession } from '@/types/session';

    const sessionsStore = useSessionsStore();
    const audioStore = useAudioStore();
    const assetsStore = useAssetsStore();
    const foldersStore = useFoldersStore();

    const showCreate = ref(false);
    const renameOpen = ref(false);
    const deleteOpen = ref(false);
    const renameSessionId = ref('');
    const renameValue = ref('');
    const deleteSessionId = ref('');

    onMounted(async () => {
        await Promise.all([
            sessionsStore.fetchAll(),
            audioStore.fetchAll(),
            assetsStore.fetchAll(),
            foldersStore.fetchAll(),
        ]);
    });

    function sessionLabel(session: GenerationSession, index: number): string {
        if (session.name) return session.name;
        return `#${sessionsStore.items.length - 1 - index}`;
    }

    function startRename(session: GenerationSession) {
        renameSessionId.value = session.id;
        renameValue.value = session.name ?? '';
        renameOpen.value = true;
    }

    async function submitRename() {
        await sessionsStore.rename(renameSessionId.value, renameValue.value);
        renameOpen.value = false;
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

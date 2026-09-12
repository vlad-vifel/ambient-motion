<template>
    <Dialog :open="open" @update:open="(v) => v && emit('update:open', v)">
        <DialogContent
            class="max-w-sm p-0 gap-0 overflow-hidden"
            :disable-outside-close="true"
            :show-close-button="false"
        >
            <DialogHeader class="px-6 pt-6 pb-4">
                <DialogTitle>{{ editTarget ? 'Rename folder' : 'New folder' }}</DialogTitle>
                <DialogDescription class="sr-only">Dialog</DialogDescription>
            </DialogHeader>

            <div class="px-6 pb-6 flex flex-col gap-4">
                <div class="flex flex-col gap-1.5">
                    <label class="text-xs text-muted-foreground">Folder name</label>
                    <Input v-model="name" placeholder="Folder name" @keydown.enter="submit" />
                </div>

                <div class="flex items-center justify-end gap-2">
                    <Button size="sm" variant="ghost" @click="onCancel">Cancel</Button>
                    <Button :disabled="!name.trim() || submitting" size="sm" @click="submit">
                        <Loader2 v-if="submitting" class="size-3.5 mr-1.5 animate-spin" />
                        {{ editTarget ? 'Save' : 'Create' }}
                    </Button>
                </div>
            </div>
        </DialogContent>
    </Dialog>
</template>

<script setup lang="ts">
    import { Loader2 } from 'lucide-vue-next';
    import { ref, watch } from 'vue';
    import { Button } from '@/components/ui/button';
    import {
        Dialog,
        DialogContent,
        DialogHeader,
        DialogTitle,
        DialogDescription,
    } from '@/components/ui/dialog';
    import { Input } from '@/components/ui/input';
    import { type Folder, useFoldersStore } from '@/stores/folders';

    const props = defineProps<{
        open: boolean;
        editTarget?: Folder | null;
    }>();

    const emit = defineEmits<{
        (e: 'update:open', v: boolean): void;
    }>();

    const foldersStore = useFoldersStore();
    const name = ref('');
    const submitting = ref(false);

    watch(
        () => props.open,
        (v) => {
            if (v) name.value = props.editTarget?.name ?? '';
        },
        { immediate: true },
    );

    function onCancel() {
        emit('update:open', false);
    }

    async function submit() {
        if (!name.value.trim() || submitting.value) return;
        submitting.value = true;
        try {
            if (props.editTarget) {
                await foldersStore.rename(props.editTarget.id, name.value);
            } else {
                await foldersStore.create(name.value);
            }
            emit('update:open', false);
        } finally {
            submitting.value = false;
        }
    }
</script>

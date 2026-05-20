<template>
    <Dialog :open="open" @update:open="(v) => !v && emit('update:open', false)">
        <DialogContent
            class="max-w-xl p-0 gap-0 overflow-hidden flex flex-col"
            :disable-outside-close="false"
        >
            <DialogHeader class="px-6 pt-6 pb-4">
                <DialogTitle>{{ filename }}</DialogTitle>
            </DialogHeader>
            <div class="flex-1 flex items-center justify-center overflow-hidden p-4 pt-1">
                <img
                    v-if="src"
                    :src="src"
                    :alt="filename"
                    class="max-w-full max-h-full object-contain rounded-md"
                />
            </div>
        </DialogContent>
    </Dialog>
</template>

<script setup lang="ts">
    import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

    defineProps<{
        open: boolean;
        src: string | null;
        filename?: string;
    }>();

    const emit = defineEmits<{
        (e: 'update:open', v: boolean): void;
    }>();
</script>

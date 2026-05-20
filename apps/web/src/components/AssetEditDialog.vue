<template>
    <Dialog :open="open" @update:open="(v) => v && emit('update:open', v)">
        <DialogContent
            class="max-w-sm p-0 gap-0 overflow-hidden"
            :disable-outside-close="true"
            :show-close-button="false"
        >
            <DialogHeader class="px-6 pt-6 pb-4">
                <DialogTitle>Rename asset</DialogTitle>
            </DialogHeader>

            <div class="px-6 pb-6 flex flex-col gap-4">
                <div class="flex flex-col gap-1.5">
                    <label class="text-xs text-muted-foreground">Filename</label>
                    <div
                        class="flex items-center rounded-md border border-input bg-transparent overflow-hidden focus-within:ring-1 focus-within:ring-ring"
                    >
                        <input
                            v-model="basename"
                            class="flex-1 min-w-0 px-3 py-2 text-sm bg-transparent outline-none placeholder:text-muted-foreground"
                            placeholder="image"
                            @keydown.enter="submit"
                        />
                        <span
                            class="px-3 py-2 text-sm text-muted-foreground bg-muted/40 border-l border-input shrink-0"
                        >{{ ext }}</span
                        >
                    </div>
                </div>

                <div class="flex items-center justify-end gap-2">
                    <Button size="sm" variant="ghost" @click="onCancel">Cancel</Button>
                    <Button :disabled="!basename.trim() || submitting" size="sm" @click="submit">
                        <Loader2 v-if="submitting" class="size-3.5 mr-1.5 animate-spin" />
                        Save
                    </Button>
                </div>
            </div>
        </DialogContent>
    </Dialog>
</template>

<script setup lang="ts">
    import { Loader2 } from 'lucide-vue-next';
    import { computed, ref, watch } from 'vue';
    import { Button } from '@/components/ui/button';
    import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
    import { type Asset, useAssetsStore } from '@/stores/assets';

    const props = defineProps<{
        open: boolean;
        asset?: Asset | null;
    }>();

    const emit = defineEmits<{
        (e: 'update:open', v: boolean): void;
    }>();

    const assetsStore = useAssetsStore();
    const basename = ref('');
    const ext = ref('');
    const submitting = ref(false);

    const fullFilename = computed(() =>
        ext.value ? `${basename.value}${ext.value}` : basename.value,
    );

    watch(
        () => props.open,
        (v) => {
            if (v && props.asset) {
                const name = props.asset.filename;
                const dotIdx = name.lastIndexOf('.');
                if (dotIdx > 0) {
                    basename.value = name.slice(0, dotIdx);
                    ext.value = name.slice(dotIdx);
                } else {
                    basename.value = name;
                    ext.value = '';
                }
            }
        },
        { immediate: true },
    );

    function onCancel() {
        emit('update:open', false);
    }

    async function submit() {
        if (!basename.value.trim() || !props.asset || submitting.value) return;
        submitting.value = true;
        try {
            await assetsStore.rename(props.asset.id, fullFilename.value);
            emit('update:open', false);
        } finally {
            submitting.value = false;
        }
    }
</script>

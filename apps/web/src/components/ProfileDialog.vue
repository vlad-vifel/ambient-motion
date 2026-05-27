<template>
    <Dialog v-model:open="isOpen">
        <DialogContent class="sm:max-w-md" :disable-outside-close="false">
            <DialogHeader>
                <DialogTitle>Edit profile</DialogTitle>
                <DialogDescription class="sr-only">Dialog</DialogDescription>
            </DialogHeader>

            <div class="flex flex-col gap-4">
                <div class="flex flex-col gap-2">
                    <h3 class="text-sm font-medium">Change name</h3>
                    <Input v-model="nameForm.name" placeholder="New name" @keyup.enter="saveName" />
                    <p v-if="nameError" class="text-destructive text-xs">{{ nameError }}</p>
                    <p v-if="nameSuccess" class="text-emerald-500 text-xs">{{ nameSuccess }}</p>
                    <Button size="sm" :disabled="nameSaving || !canSaveName" @click="saveName">
                        <Spinner v-if="nameSaving" class="size-4" />
                        <span>{{ nameSaving ? 'Saving' : 'Save' }}</span>
                    </Button>
                </div>

                <Separator />

                <div class="flex flex-col gap-2">
                    <h3 class="text-sm font-medium">Change password</h3>
                    <Input
                        v-model="passwordForm.oldPassword"
                        type="password"
                        placeholder="Current password"
                    />
                    <Input
                        v-model="passwordForm.newPassword"
                        type="password"
                        placeholder="New password"
                    />
                    <Input
                        v-model="passwordForm.confirmPassword"
                        type="password"
                        placeholder="Confirm new password"
                    />
                    <p v-if="passwordError" class="text-destructive text-xs">{{ passwordError }}</p>
                    <p v-if="passwordSuccess" class="text-emerald-500 text-xs">
                        {{ passwordSuccess }}
                    </p>
                    <Button
                        size="sm"
                        :disabled="passwordSaving || !canSavePassword"
                        @click="savePassword"
                    >
                        <Spinner v-if="passwordSaving" class="size-4" />
                        <span>{{ passwordSaving ? 'Saving' : 'Save' }}</span>
                    </Button>
                </div>
            </div>
        </DialogContent>
    </Dialog>
</template>

<script setup lang="ts">
    import { computed, reactive, ref, watch } from 'vue';
    import { useAuthStore } from '@/stores/auth';
    import { Button } from '@/components/ui/button';
    import {
        Dialog,
        DialogContent,
        DialogHeader,
        DialogTitle,
        DialogDescription,
    } from '@/components/ui/dialog';
    import { Input } from '@/components/ui/input';
    import { Separator } from '@/components/ui/separator';
    import Spinner from './ui/spinner/Spinner.vue';

    const props = defineProps<{
        open: boolean;
    }>();

    const emit = defineEmits<{
        'update:open': [boolean];
    }>();

    const auth = useAuthStore();

    const nameForm = reactive({ name: auth.user?.name || '' });
    const passwordForm = reactive({ oldPassword: '', newPassword: '', confirmPassword: '' });

    const nameSaving = ref(false);
    const passwordSaving = ref(false);
    const nameError = ref<string | null>(null);
    const nameSuccess = ref<string | null>(null);

    const canSaveName = computed(
        () => nameForm.name.trim().length > 0 && nameForm.name.trim() !== auth.user?.name,
    );
    const canSavePassword = computed(
        () =>
            passwordForm.oldPassword.length > 0 &&
            passwordForm.newPassword.length > 0 &&
            passwordForm.confirmPassword.length > 0,
    );
    const passwordError = ref<string | null>(null);
    const passwordSuccess = ref<string | null>(null);

    const isOpen = computed({
        get: () => props.open,
        set: (value) => emit('update:open', value),
    });

    watch(
        () => props.open,
        (open) => {
            if (open) {
                nameForm.name = auth.user?.name || '';
                passwordForm.oldPassword = '';
                passwordForm.newPassword = '';
                passwordForm.confirmPassword = '';
                nameError.value = null;
                passwordError.value = null;
                passwordSuccess.value = null;
            }
        },
    );

    async function saveName() {
        nameError.value = null;
        if (!nameForm.name.trim()) {
            nameError.value = 'Name is required';
            return;
        }
        nameSaving.value = true;
        try {
            await auth.updateProfile(nameForm.name.trim());
            nameSuccess.value = 'Name changed successfully';
        } catch (err: any) {
            nameError.value = err.response?.data?.error || 'Failed to save name';
        } finally {
            nameSaving.value = false;
        }
    }

    async function savePassword() {
        passwordError.value = null;
        passwordSuccess.value = null;
        if (!passwordForm.oldPassword) {
            passwordError.value = 'Current password is required';
            return;
        }
        if (!passwordForm.newPassword) {
            passwordError.value = 'New password is required';
            return;
        }
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            passwordError.value = 'Passwords do not match';
            return;
        }
        if (passwordForm.newPassword.length < 6) {
            passwordError.value = 'Password must be at least 6 characters';
            return;
        }
        passwordSaving.value = true;
        try {
            await auth.updatePassword(passwordForm.oldPassword, passwordForm.newPassword);
            passwordSuccess.value = 'Password changed successfully';
            passwordForm.oldPassword = '';
            passwordForm.newPassword = '';
            passwordForm.confirmPassword = '';
        } catch (err: any) {
            passwordError.value = err.response?.data?.error || 'Failed to change password';
        } finally {
            passwordSaving.value = false;
        }
    }
</script>

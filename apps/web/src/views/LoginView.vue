<template>
    <div class="min-h-screen flex items-center justify-center bg-background">
        <div class="w-full max-w-sm flex flex-col gap-4 px-4">
            <div class="flex flex-col items-center gap-2 text-center">
                <Logo :size="40" class="text-foreground" />
                <h1 class="text-2xl font-semibold tracking-tight">ambient motion</h1>
                <p class="text-sm text-muted-foreground">
                    {{
                        mode === AuthMode.Login ? 'Log in to your account' : 'Create a new account'
                    }}
                </p>
            </div>

            <Alert v-if="error" variant="destructive" class="flex">
                <AlertTitle>{{ error }}</AlertTitle>
            </Alert>

            <div class="flex flex-col gap-4">
                <div class="flex flex-col gap-1">
                    <label class="text-sm font-medium">Email</label>
                    <Input
                        v-model="email"
                        :disabled="loading"
                        placeholder="Email"
                        type="email"
                        @keyup.enter="handleSubmit"
                    />
                </div>

                <div v-if="mode === AuthMode.Register" class="flex flex-col gap-1">
                    <label class="text-sm font-medium">Name</label>
                    <Input
                        v-model="name"
                        :disabled="loading"
                        placeholder="Name"
                        type="text"
                        @keyup.enter="handleSubmit"
                    />
                </div>

                <div class="flex flex-col gap-1">
                    <label class="text-sm font-medium">Password</label>
                    <Input
                        v-model="password"
                        :disabled="loading"
                        placeholder="Password"
                        type="password"
                        @keyup.enter="handleSubmit"
                    />
                </div>

                <div v-if="mode === AuthMode.Register" class="flex flex-col gap-1">
                    <label class="text-sm font-medium">Confirm Password</label>
                    <Input
                        v-model="passwordConfirm"
                        :disabled="loading"
                        placeholder="Password again"
                        type="password"
                        @keyup.enter="handleSubmit"
                    />
                </div>

                <Button class="w-full mt-2" :disabled="loading" @click="handleSubmit">
                    <span v-if="loading" class="flex items-center gap-2">
                        <Spinner class="size-4" />
                        {{ mode === AuthMode.Login ? 'Logging in' : 'Creating account' }}
                    </span>
                    <span v-else>{{ mode === AuthMode.Login ? 'Log in' : 'Register' }}</span>
                </Button>
            </div>

            <p class="text-center text-sm text-muted-foreground">
                <template v-if="mode === AuthMode.Login">
                    Don't have an account?
                    <button
                        class="underline underline-offset-4 hover:text-foreground transition-colors font-medium"
                        @click="switchMode(AuthMode.Register)"
                    >
                        Register
                    </button>
                </template>
                <template v-else>
                    Already have an account?
                    <button
                        class="underline underline-offset-4 hover:text-foreground transition-colors font-medium"
                        @click="switchMode(AuthMode.Login)"
                    >
                        Log in
                    </button>
                </template>
            </p>
        </div>
    </div>
</template>

<script setup lang="ts">
    import axios from 'axios';
    import { ref } from 'vue';
    import { useRouter } from 'vue-router';
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import { Alert, AlertTitle } from '@/components/ui/alert';
    import { Spinner } from '@/components/ui/spinner';
    import { useAuthStore } from '@/stores/auth';
    import Logo from '@/components/layout/Logo.vue';
    import { AuthMode } from '@/types/ui';
    import { getAuthErrorMessage } from './utils';

    const router = useRouter();
    const auth = useAuthStore();

    const mode = ref<AuthMode>(AuthMode.Login);
    const email = ref('');
    const name = ref('');
    const password = ref('');
    const passwordConfirm = ref('');
    const loading = ref(false);
    const error = ref('');

    const API = (import.meta.env.VITE_API_URL as string) || 'http://localhost:3000';

    function switchMode(newMode: AuthMode) {
        mode.value = newMode;
        error.value = '';
        email.value = '';
        name.value = '';
        password.value = '';
        passwordConfirm.value = '';
    }

    async function handleSubmit() {
        error.value = '';

        if (!email.value.trim()) {
            error.value = 'Please enter your email.';
            return;
        }

        if (mode.value === AuthMode.Register) {
            if (!name.value.trim()) {
                error.value = 'Please enter your name.';
                return;
            }
            if (!password.value || password.value.length < 6) {
                error.value = 'Password must be at least 6 characters.';
                return;
            }
            if (!passwordConfirm.value) {
                error.value = 'Please confirm your password.';
                return;
            }
            if (password.value !== passwordConfirm.value) {
                error.value = 'Passwords do not match.';
                return;
            }
        } else {
            if (!password.value || password.value.length < 6) {
                error.value = 'Password must be at least 6 characters.';
                return;
            }
        }

        loading.value = true;
        try {
            const endpoint =
                mode.value === AuthMode.Login ? '/api/auth/login' : '/api/auth/register';
            const payload =
                mode.value === AuthMode.Login
                    ? { email: email.value.trim(), password: password.value }
                    : {
                          email: email.value.trim(),
                          name: name.value.trim(),
                          password: password.value,
                      };

            const { data } = await axios.post(`${API}${endpoint}`, payload);

            auth.setAuth(data.token, data.user);
            await router.push('/');
        } catch (err: unknown) {
            error.value = getAuthErrorMessage(err);
        } finally {
            loading.value = false;
        }
    }
</script>

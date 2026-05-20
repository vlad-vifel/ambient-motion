<template>
    <div class="min-h-screen flex items-center justify-center bg-background">
        <div class="w-full max-w-sm space-y-6 px-4">
            <div class="flex flex-col items-center gap-2 text-center">
                <div
                    class="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
                    AM
                </div>
                <h1 class="text-2xl font-semibold tracking-tight">ambient motion</h1>
                <p class="text-sm text-muted-foreground">
                    {{ mode === 'login' ? 'Sign in to your account' : 'Create a new account' }}
                </p>
            </div>

            <div class="space-y-4">
                <div class="space-y-2">
                    <label class="text-sm font-medium">Email</label>
                    <Input
                        v-model="email"
                        :disabled="loading"
                        placeholder="you@example.com"
                        type="email"
                        @keyup.enter="handleSubmit" />
                </div>
                <div class="space-y-2">
                    <label class="text-sm font-medium">Password</label>
                    <Input
                        v-model="password"
                        :disabled="loading"
                        placeholder="••••••••"
                        type="password"
                        @keyup.enter="handleSubmit" />
                </div>

                <p
                    v-if="error"
                    class="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
                    {{ error }}
                </p>

                <Button class="w-full" :disabled="loading" @click="handleSubmit">
                    <span v-if="loading" class="flex items-center gap-2">
                        <svg class="size-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle
                                class="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                stroke-width="4" />
                            <path
                                class="opacity-75"
                                d="M4 12a8 8 0 018-8v8H4z"
                                fill="currentColor" />
                        </svg>
                        {{ mode === 'login' ? 'Signing in…' : 'Creating account…' }}
                    </span>
                    <span v-else>{{ mode === 'login' ? 'Log in' : 'Register' }}</span>
                </Button>
            </div>

            <p class="text-center text-sm text-muted-foreground">
                <template v-if="mode === 'login'">
                    Don't have an account?
                    <button
                        class="underline underline-offset-4 hover:text-foreground transition-colors font-medium"
                        @click="switchMode('register')">
                        Register
                    </button>
                </template>
                <template v-else>
                    Already have an account?
                    <button
                        class="underline underline-offset-4 hover:text-foreground transition-colors font-medium"
                        @click="switchMode('login')">
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
    import { useAuthStore } from '@/stores/auth';

    const router = useRouter();
    const auth = useAuthStore();

    const mode = ref<'login' | 'register'>('login');
    const email = ref('');
    const password = ref('');
    const loading = ref(false);
    const error = ref('');

    const API = (import.meta.env.VITE_API_URL as string) || 'http://localhost:3001';

    function switchMode(newMode: 'login' | 'register') {
        mode.value = newMode;
        error.value = '';
    }

    async function handleSubmit() {
        error.value = '';

        if (!email.value.trim()) {
            error.value = 'Please enter your email.';
            return;
        }
        if (!password.value || password.value.length < 6) {
            error.value = 'Password must be at least 6 characters.';
            return;
        }

        loading.value = true;
        try {
            const endpoint = mode.value === 'login' ? '/api/auth/login' : '/api/auth/register';
            const { data } = await axios.post(`${API}${endpoint}`, {
                email: email.value.trim(),
                password: password.value,
            });

            auth.setAuth(data.token, data.user);
            await router.push('/');
        } catch (err: unknown) {
            if (err && typeof err === 'object' && 'response' in err) {
                const axiosErr = err as { response?: { data?: { error?: string } }; code?: string };
                const msg = axiosErr.response?.data?.error;
                if (msg) {
                    error.value = msg;
                } else if (axiosErr.code === 'ERR_NETWORK') {
                    error.value = 'Cannot connect to server. Make sure the API is running.';
                } else {
                    error.value = 'Something went wrong. Please try again.';
                }
            } else {
                error.value = 'Something went wrong. Please try again.';
            }
        } finally {
            loading.value = false;
        }
    }
</script>

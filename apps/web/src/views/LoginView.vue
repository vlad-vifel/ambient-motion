<template>
    <div class="min-h-screen flex items-center justify-center bg-background">
        <div class="w-full max-w-sm flex flex-col gap-4 px-4">
            <div class="flex flex-col items-center gap-2 text-center">
                <Logo :size="40" class="text-foreground" />
                <h1 class="text-2xl font-semibold tracking-tight">ambient motion</h1>
                <p class="text-sm text-muted-foreground">
                    {{ mode === 'login' ? 'Log in to your account' : 'Create a new account' }}
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

                <div v-if="mode === 'register'" class="flex flex-col gap-1">
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

                <div v-if="mode === 'register'" class="flex flex-col gap-1">
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
                        {{ mode === 'login' ? 'Logging in' : 'Creating account' }}
                    </span>
                    <span v-else>{{ mode === 'login' ? 'Log in' : 'Register' }}</span>
                </Button>
            </div>

            <p class="text-center text-sm text-muted-foreground">
                <template v-if="mode === 'login'">
                    Don't have an account?
                    <button
                        class="underline underline-offset-4 hover:text-foreground transition-colors font-medium"
                        @click="switchMode('register')"
                    >
                        Register
                    </button>
                </template>
                <template v-else>
                    Already have an account?
                    <button
                        class="underline underline-offset-4 hover:text-foreground transition-colors font-medium"
                        @click="switchMode('login')"
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
    import Logo from '@/components/Logo.vue';

    const router = useRouter();
    const auth = useAuthStore();

    const mode = ref<'login' | 'register'>('login');
    const email = ref('');
    const name = ref('');
    const password = ref('');
    const passwordConfirm = ref('');
    const loading = ref(false);
    const error = ref('');

    const API = (import.meta.env.VITE_API_URL as string) || 'http://localhost:3000';

    function switchMode(newMode: 'login' | 'register') {
        mode.value = newMode;
        error.value = '';
        email.value = '';
        name.value = '';
        password.value = '';
        passwordConfirm.value = '';
    }

    function getErrorMessage(err: unknown): string {
        if (!err || typeof err !== 'object') {
            return 'Something went wrong. Please try again.';
        }

        if ('response' in err) {
            const axiosErr = err as {
                response?: { data?: { error?: string; message?: string } };
                code?: string;
            };
            const msg = axiosErr.response?.data?.error || axiosErr.response?.data?.message;

            if (msg) {
                if (msg.toLowerCase().includes('email') && msg.toLowerCase().includes('already')) {
                    return 'This email is already registered. Please log in or use a different email.';
                }
                if (
                    msg.toLowerCase().includes('invalid') ||
                    msg.toLowerCase().includes('incorrect')
                ) {
                    return 'Invalid email or password. Please try again.';
                }
                return msg;
            }

            if (axiosErr.code === 'ERR_NETWORK') {
                return 'Cannot connect to server. Make sure the API is running.';
            }
        }

        return 'Something went wrong. Please try again.';
    }

    async function handleSubmit() {
        error.value = '';

        if (!email.value.trim()) {
            error.value = 'Please enter your email.';
            return;
        }

        if (mode.value === 'register') {
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
            const endpoint = mode.value === 'login' ? '/api/auth/login' : '/api/auth/register';
            const payload =
                mode.value === 'login'
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
            error.value = getErrorMessage(err);
        } finally {
            loading.value = false;
        }
    }
</script>

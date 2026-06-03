import { Response, Router } from 'express';
import OpenAI from 'openai';
import { AuthRequest, requireAuth } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

const groq = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: 'https://api.groq.com/openai/v1',
});

const GROQ_MODEL = 'llama-3.3-70b-versatile';

router.post('/phrases', async (req: AuthRequest, res: Response) => {
    try {
        const { theme, count } = req.body as { theme: string; count: number };

        if (!theme?.trim()) {
            res.status(400).json({ error: 'theme is required' });
            return;
        }

        const n = Math.min(Math.max(Number(count) || 5, 1), 30);

        const prompt = `Generate short emotional phrases on a given theme for cinematic ambient videos.

Rules:
- 5-9 words long
- maximum 40 characters per phrase (spaces are also taken into account)
- strictly in English, all lowercase
- personal, melancholic, emotional — about feelings, loss, love, longing
- feel like confessions, inner thoughts, or personal situations
- MUST contain a subject and an action or feeling (i / you / we + a verb) — someone doing, feeling, or wanting something
- NEVER write standalone descriptive noun phrases or pure scenery (e.g. "forgotten memories of summer", "a breeze that brings no peace") — every phrase must SAY something, not just paint a picture
- one phrase per line, nothing else — no numbering, no punctuation at the end

Good examples (notice each one has a subject doing/feeling something):
i still wait for you sometimes
you were never really mine to keep
i keep looking for you in empty rooms
i don't even know how to forget you
we let it fade too quietly
i miss who i was with you

Bad examples (avoid these — no action, just imagery):
forgotten memories of our summer
summer breeze that brings no peace
empty streets and quiet nights

Number of phrases: ${n}
Theme: ${theme.trim()}
Seed: ${Math.random().toString(36).slice(2)}`;

        let message;
        for (let attempt = 1; attempt <= 3; attempt++) {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 25000);
            try {
                message = await groq.chat.completions.create(
                    {
                        model: GROQ_MODEL,
                        messages: [{ role: 'user', content: prompt }],
                        temperature: 1,
                    },
                    { signal: controller.signal },
                );
                break;
            } catch (err: unknown) {
                clearTimeout(timeout);
                const msg = err instanceof Error ? err.message : String(err);
                if (msg.includes('429') && attempt < 3) {
                    console.log(`[AI] Rate limited, retry ${attempt}/3 in 4s...`);
                    await new Promise((r) => setTimeout(r, 4000));
                    continue;
                }
                throw err;
            } finally {
                clearTimeout(timeout);
            }
        }

        const output = message!.choices[0]?.message?.content ?? '';
        console.log('[AI] raw output:', JSON.stringify(output));

        const phrases = output
            .split('\n')
            .map((line: string) => line.trim().replace(/^[-*•\d.]+\s*/, ''))
            .filter((line: string) => line.length > 0 && line.length <= 80);

        res.json({ phrases });
    } catch (err: unknown) {
        const error = err instanceof Error ? err.message : String(err);
        console.error('Phrase generation error:', error);
        res.status(500).json({ error: 'Failed to generate phrases', details: error });
    }
});

export default router;

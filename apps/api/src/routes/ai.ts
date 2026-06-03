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
- 6-10 words long
- maximum 45 characters per phrase (spaces included)
- strictly in English, all lowercase
- personal, melancholic, emotional — about feelings, loss, love, longing
- feel like confessions, inner thoughts, or personal situations
- MUST contain a verb — action, feeling, or imperative
- add specific details that make the phrase feel real and vivid — a place, a time, a small gesture, a sensory detail (e.g. "in the heat of last summer", "your pretty smile", "these empty nights")
- vary the grammar structures — do NOT overuse "i'm + verb"; mix in: past simple (we never said goodbye to each other), present simple (i forget you every morning of our lige), imperative (hide my tears far away from me), "how it feels / when /you were / you never / we let / i keep", 
- NO more than 2-3 phrases with "i'm" out of the full set
- sound poetic and beautiful — simple everyday words only, NO complex or rare vocabulary
- NEVER write standalone noun phrases with no verb
- one phrase per line, nothing else — no numbering, no punctuation at the end

Good examples:
how it feels to love something that's already gone
when the past feels closer than the present
i forget you in the heat of summer
i keep looking for you in empty rooms
we never said goodbye to each other
you were never really mine to keep
hide my tears far away from me
tell me you still remember my name
we let it all fade too quietly
i'm forgetting how your voice sounds now
i still wait for you sometimes
you left without saying anything at all
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

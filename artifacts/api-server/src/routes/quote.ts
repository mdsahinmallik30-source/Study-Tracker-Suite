import { Router } from "express";
import { format } from "date-fns";

const router = Router();

const FALLBACK_QUOTES = [
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "Hard work beats talent when talent doesn't work hard.", author: "Tim Notke" },
  { text: "The pain of discipline is far less than the pain of regret.", author: "Sarah Bombell" },
  { text: "Don't wish it were easier. Wish you were better.", author: "Jim Rohn" },
  { text: "Study while others are sleeping; work while others are loafing; prepare while others are playing; and dream while others are wishing.", author: "William A. Ward" },
  { text: "The expert in anything was once a beginner.", author: "Helen Hayes" },
  { text: "Genius is one percent inspiration and ninety-nine percent perspiration.", author: "Thomas Edison" },
  { text: "The difference between ordinary and extraordinary is that little extra.", author: "Jimmy Johnson" },
  { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
  { text: "Nothing in the world is worth having or worth doing unless it means effort, pain, difficulty.", author: "Theodore Roosevelt" },
  { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
  { text: "Success usually comes to those who are too busy to be looking for it.", author: "Henry David Thoreau" },
];

let cachedQuote: { text: string; author: string; date: string } | null = null;
let cacheDate = "";

router.get("/quote", async (_req, res) => {
  const today = format(new Date(), "yyyy-MM-dd");

  if (cachedQuote && cacheDate === today) {
    return res.json(cachedQuote);
  }

  try {
    const response = await fetch("https://zenquotes.io/api/today", {
      headers: { "User-Agent": "JEETracker/1.0" },
      signal: AbortSignal.timeout(4000),
    });
    if (response.ok) {
      const data = await response.json() as { q: string; a: string }[];
      if (data?.[0]?.q) {
        cachedQuote = { text: data[0].q, author: data[0].a || "Unknown", date: today };
        cacheDate = today;
        return res.json(cachedQuote);
      }
    }
  } catch {
    // fall through to fallback
  }

  const idx = new Date().getDate() % FALLBACK_QUOTES.length;
  cachedQuote = { ...FALLBACK_QUOTES[idx], date: today };
  cacheDate = today;
  return res.json(cachedQuote);
});

export default router;

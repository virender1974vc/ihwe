const express = require('express');
const router = express.Router();

let cache = { rate: null, fetchedAt: null };
const CACHE_TTL_MS = 60 * 60 * 1000;
const FALLBACK_RATE = 93;

router.get('/usd-to-inr', async (req, res) => {
    try {
        const now = Date.now();
        if (cache.rate && cache.fetchedAt && (now - cache.fetchedAt) < CACHE_TTL_MS) {
            return res.json({ success: true, rate: cache.rate, cached: true });
        }

        let rate = null;
        try {
            const r1 = await fetch('https://open.er-api.com/v6/latest/USD');
            const d1 = await r1.json();
            rate = d1?.rates?.INR;
        } catch (_) {}

        if (!rate) {
            try {
                const r2 = await fetch('https://api.frankfurter.app/latest?from=USD&to=INR');
                const d2 = await r2.json();
                rate = d2?.rates?.INR;
            } catch (_) {}
        }

        if (!rate) throw new Error('All sources failed');

        cache = { rate, fetchedAt: now };
        res.json({ success: true, rate, cached: false });
    } catch (err) {
        const fallback = cache.rate || FALLBACK_RATE;
        res.json({ success: true, rate: fallback, cached: true, fallback: true });
    }
});

module.exports = router;

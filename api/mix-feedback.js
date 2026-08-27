// POST /api/mix-feedback
// Body: the measured audio metrics (JSON).
// Returns: { score, summary, strengths[], issues[] }
// Requires the ANTHROPIC_API_KEY environment variable to be set in your
// Vercel project settings (Project -> Settings -> Environment Variables).

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'Server is missing ANTHROPIC_API_KEY. Add it in your Vercel project settings.' });
    return;
  }

  let metrics;
  try {
    metrics = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch (e) {
    res.status(400).json({ error: 'Invalid JSON body' });
    return;
  }

  const prompt =
    'You are an experienced mixing and mastering engineer. You are given objective, ' +
    'machine-measured audio metrics for a track (you cannot hear the audio itself). Based only on these ' +
    'numbers, write a review.\n\n' +
    'Metrics:\n' + JSON.stringify(metrics, null, 2) + '\n\n' +
    'Respond with ONLY raw JSON (no markdown fences, no preamble) matching exactly this shape:\n' +
    '{"score": <integer 0-100 reflecting overall mix/master readiness>, ' +
    '"summary": "<2-3 sentence overall take>", ' +
    '"strengths": ["<short strength tied to a real metric>", ...up to 3], ' +
    '"issues": [{"metric": "<short metric name>", "observation": "<what the number suggests>", "suggestion": "<concrete actionable fix>"}, ...2-4 items]}\n' +
    'Ground every point in the actual numbers given. Be specific and practical, like notes from a mix engineer, not generic advice.';

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      res.status(502).json({ error: 'Anthropic API error', detail });
      return;
    }

    const data = await response.json();
    const text = (data.content || []).map((b) => b.text || '').join('\n').trim();
    const cleaned = text.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```\s*$/, '').trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (e) {
      res.status(502).json({ error: 'Could not parse model response', raw: text });
      return;
    }

    if (typeof parsed.score !== 'number') parsed.score = 50;
    parsed.score = Math.max(0, Math.min(100, Math.round(parsed.score)));

    res.status(200).json(parsed);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
};

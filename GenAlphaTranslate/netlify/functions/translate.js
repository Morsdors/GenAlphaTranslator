exports.handler = async (event) => {
	try {
		if (event.httpMethod !== 'POST') {
			return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
		}

		const { text = '', direction = 'en2genalpha', language = 'en' } = JSON.parse(event.body || '{}');

		const PROMPT_TEMPLATES = {
			['en2genalpha_en']: 'Translate the following text into GenAlpha slang: {text}',
			['genalpha2en_en']: 'Translate the following GenAlpha slang into standard English: {text}',
			['pl2genalpha_pl']: 'Translate the following Polish text into GenAlpha slang (in Polish): {text}',
			['genalpha2pl_pl']: 'Translate the following GenAlpha slang (in Polish) into standard Polish: {text}',
		};
		const key = `${direction}_${language}`;
		const template = PROMPT_TEMPLATES[key] || PROMPT_TEMPLATES['en2genalpha_en'];
		const prompt = template.replace('{text}', text);

		const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
		if (!OPENROUTER_API_KEY) {
			return { statusCode: 500, body: JSON.stringify({ error: 'Missing OPENROUTER_API_KEY env var' }) };
		}

		const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
				'Content-Type': 'application/json',
				'HTTP-Referer': process.env.SITE_URL || 'https://netlify.app',
				'X-Title': 'GenAlpha Translator'
			},
			body: JSON.stringify({
				model: 'qwen/qwen2.5-72b-instruct',
				messages: [{ role: 'user', content: prompt }]
			})
		});

		if (!resp.ok) {
			const errText = await resp.text();
			return { statusCode: resp.status, body: JSON.stringify({ error: `Upstream error: ${errText}` }) };
		}

		const json = await resp.json();
		const translation = json.choices?.[0]?.message?.content || '';
		return {
			statusCode: 200,
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ translation })
		};
	} catch (e) {
		return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
	}
}; 
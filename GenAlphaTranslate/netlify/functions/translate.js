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

		const MODELS = [
			"qwen/qwen3-coder:free",
			"moonshotai/kimi-k2:free",
			"google/gemma-3n-e2b-it:free",
		]

		async function callModel(modelName) {
			const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
					'Content-Type': 'application/json',
					'HTTP-Referer': process.env.SITE_URL || 'https://netlify.app',
					'X-Title': 'GenAlpha Translator'
				},
				body: JSON.stringify({
					model: modelName,
					messages: [{ role: 'user', content: prompt }]
				})
			});
			return resp;
		}

		async function discoverFreeModels() {
			try {
				const resp = await fetch('https://openrouter.ai/api/v1/models', {
					headers: {
						'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
						'Content-Type': 'application/json'
					}
				});
				
				if (!resp.ok) {
					return [];
				}
				
				const data = await resp.json();
				const freeModels = data.data
					?.filter(model => model.id.includes(':free'))
					?.map(model => model.id)
					?.slice(0, 5) || []; // Limit to 5 models
					
				return freeModels;
			} catch (e) {
				return [];
			}
		}

		// Try fallback models first
		for (let i = 0; i < MODELS.length; i++) {
			const model = MODELS[i];
			try {
				const resp = await callModel(model);
				if (resp.ok) {
					const json = await resp.json();
					const translation = json.choices?.[0]?.message?.content || '';
					return {
						statusCode: 200,
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ translation, model })
					};
				}
				const status = resp.status;
				const textBody = await resp.text();
				
				// Check for specific rate limit error
				let isRateLimit = status === 429;
				try {
					const errorData = JSON.parse(textBody);
					if (errorData.error?.message?.includes('free-models-per-day')) {
						isRateLimit = true;
					}
				} catch (e) {
					// If JSON parsing fails, use status code
				}
				
				// On rate limit / not found / provider errors, try next model
				if (status === 404 || isRateLimit || (status >= 500 && status < 600)) {
					if (i < MODELS.length - 1) {
						await new Promise(r => setTimeout(r, 250));
						continue;
					}
					// All fallback models failed, try to discover new ones
					const discoveredModels = await discoverFreeModels();
					if (discoveredModels.length > 0) {
						// Try discovered models
						for (const discoveredModel of discoveredModels) {
							try {
								const resp = await callModel(discoveredModel);
								if (resp.ok) {
									const json = await resp.json();
									const translation = json.choices?.[0]?.message?.content || '';
									return {
										statusCode: 200,
										headers: { 'Content-Type': 'application/json' },
										body: JSON.stringify({ translation, model: discoveredModel, discovered: true })
									};
								}
								await new Promise(r => setTimeout(r, 250));
							} catch (e) {
								continue;
							}
						}
					}
					return { statusCode: status, body: JSON.stringify({ error: `Upstream error after fallbacks: ${textBody}` }) };
				}
				// Other client errors: return immediately
				return { statusCode: status, body: JSON.stringify({ error: `Upstream error: ${textBody}` }) };
			} catch (e) {
				if (i < MODELS.length - 1) {
					await new Promise(r => setTimeout(r, 250));
					continue;
				}
				return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
			}
		}

		return { statusCode: 500, body: JSON.stringify({ error: 'No model succeeded' }) };
	} catch (e) {
		return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
	}
}; 
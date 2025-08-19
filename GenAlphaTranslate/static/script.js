let direction = 'en2genalpha'; // or 'genalpha2en', 'pl2genalpha', 'genalpha2pl'

const inputBox = document.getElementById('inputText');
const outputBox = document.getElementById('outputText');
const switchBtn = document.getElementById('switchBtn');
const languageSelect = document.getElementById('languageSelect');
const translateBtn = document.getElementById('translateBtn');
const leftChar = document.querySelector('.character.left');
const rightChar = document.querySelector('.character.right');
const toastEl = document.getElementById('toast');

function showToast(message) {
	if (!toastEl) return;
	toastEl.textContent = message;
	toastEl.classList.add('show');
	setTimeout(() => {
		toastEl.classList.remove('show');
	}, 4000);
}

function updateBackground() {
    // GenAlpha girl should always be next to GenAlpha text box
    if (direction.startsWith('genalpha')) {
        document.body.classList.remove('genalpha-left');
        document.body.classList.add('genalpha-right');
    } else {
        document.body.classList.remove('genalpha-right');
        document.body.classList.add('genalpha-left');
    }
}

function updateDirection() {
    const lang = languageSelect.value;
    if (lang === 'en') {
        direction = direction.startsWith('genalpha') ? 'genalpha2en' : 'en2genalpha';
    } else {
        direction = direction.startsWith('genalpha') ? 'genalpha2pl' : 'pl2genalpha';
    }
    // Swap input/output placeholders and positions
    if (direction.startsWith('genalpha')) {
        leftChar.querySelector('textarea').placeholder = 'GenAlpha text...';
        rightChar.querySelector('textarea').placeholder = lang === 'en' ? 'Standard English...' : 'Standard Polish...';
    } else {
        leftChar.querySelector('textarea').placeholder = lang === 'en' ? 'Standard English...' : 'Standard Polish...';
        rightChar.querySelector('textarea').placeholder = 'GenAlpha text...';
    }
    // Swap values
    const leftVal = leftChar.querySelector('textarea').value;
    leftChar.querySelector('textarea').value = rightChar.querySelector('textarea').value;
    rightChar.querySelector('textarea').value = leftVal;
    updateBackground();
}

switchBtn.addEventListener('click', () => {
    direction = direction.startsWith('genalpha') ? (languageSelect.value === 'en' ? 'en2genalpha' : 'pl2genalpha') : (languageSelect.value === 'en' ? 'genalpha2en' : 'genalpha2pl');
    updateDirection();
});

languageSelect.addEventListener('change', () => {
    direction = languageSelect.value === 'en' ? 'en2genalpha' : 'pl2genalpha';
    updateDirection();
});

translateBtn.addEventListener('click', async () => {
    const lang = languageSelect.value;
    const text = leftChar.querySelector('textarea').value;
    outputBox.value = 'Translating...';
    try {
        const res = await fetch('/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, direction, language: lang })
        });
        const data = await res.json();
        if (data.translation) {
            outputBox.value = data.translation;
            const defaultModel = 'qwen/qwen3-coder:free';
            if (data.model && data.model !== defaultModel) {
                showToast(`For technical reasons this prompt used: ${data.model}`);
            }
        } else {
            outputBox.value = 'Error: ' + (data.error || 'Unknown error');
        }
    } catch (e) {
        outputBox.value = 'Error: ' + e.message;
    }
});

inputBox.addEventListener('input', () => {
    if (inputBox.value.trim() === '') {
        outputBox.value = '';
    }
});

// Initial setup
updateBackground();
updateDirection(); 
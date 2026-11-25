"""Optional Gemini lesson rewrite | Mary Balemba | Group LearnPath | ITAI2376.
Only trusted topic/style/curated text leave the process. No learner answers or IDs.
It never selects tools, changes rewards, or controls assessment.
"""
import json
import os
import re
import urllib.error
import urllib.request


def rewrite_lesson(topic, style, text, *, enabled=False, opener=None):
    if not enabled:
        return {'text': text, 'mode': 'curated', 'notice': 'Offline curated lesson; no language-model call.'}
    key = os.environ.get('GEMINI_API_KEY', '')
    model = os.environ.get('GEMINI_MODEL', '')
    if not key or not re.fullmatch(r'[a-zA-Z0-9._-]{1,80}', model):
        return {'text': text, 'mode': 'fallback', 'notice': 'Set a valid GEMINI_MODEL and secret GEMINI_API_KEY, or keep offline mode.'}
    prompt = (f'Rewrite this beginner Python explanation in a {style} style for topic {topic}. '
              'Use at most 120 words, plain text, no links, no tools. Keep Python facts unchanged. '
              f'Lesson: {text}')
    body = {'contents': [{'parts': [{'text': prompt}]}],
            'generationConfig': {'maxOutputTokens': 250, 'temperature': 0.2}}
    req = urllib.request.Request(f'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent',
                                 data=json.dumps(body).encode(),
                                 headers={'Content-Type': 'application/json', 'x-goog-api-key': key})
    try:
        with (opener or urllib.request.urlopen)(req, timeout=15) as resp:
            raw = resp.read(100_001)
        if len(raw) > 100_000:
            raise ValueError('response too large')
        data = json.loads(raw)
        result = ''.join(p.get('text', '') for p in data['candidates'][0]['content']['parts']).strip()
        if not result or len(result) > 1800:
            raise ValueError('invalid generation')
        return {'text': result, 'mode': 'gemini', 'notice': 'AI-generated explanation; may be inaccurate. Curated source remains the reference.'}
    except (OSError, ValueError, KeyError, IndexError, TypeError):
        return {'text': text, 'mode': 'fallback', 'notice': 'Language service unavailable; showing the checked curated lesson.'}

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { LANGUAGE_STORAGE_KEY, preferredLanguage } from '../grainy/src/ver2-i18n.js';

function browser(t, { saved = null, languages, language, blocked = false }) {
  const values = {
    navigator: { languages, language },
    localStorage: {
      getItem(key) {
        assert.equal(key, LANGUAGE_STORAGE_KEY);
        if (blocked) throw new DOMException('Blocked', 'SecurityError');
        return saved;
      },
      setItem: () => assert.fail('Detection must not save a manual preference'),
    },
  };
  for (const [key, value] of Object.entries(values)) {
    const original = Object.getOwnPropertyDescriptor(globalThis, key);
    Object.defineProperty(globalThis, key, { value, configurable: true });
    t.after(() => original ? Object.defineProperty(globalThis, key, original) : delete globalThis[key]);
  }
}

for (const [locale, expected] of [['en-US', 'en'], ['ja-JP', 'ja'], ['zh-Hans-CN', 'zh'], ['ko-KR', 'ko']]) {
  test(`a first visit follows browser language ${locale}`, t => {
    browser(t, { languages: [locale] });
    assert.equal(preferredLanguage(), expected);
  });
}

for (const saved of ['ko', 'en', 'ja', 'zh']) {
  test(`an explicit ${saved} selection overrides browser preferences`, t => {
    browser(t, { saved, languages: saved === 'en' ? ['ja-JP'] : ['en-US'] });
    assert.equal(preferredLanguage(), saved);
  });
}

test('browser preference order skips unsupported languages', t => {
  browser(t, { languages: ['fr-FR', 'ja-JP', 'en-US'] });
  assert.equal(preferredLanguage(), 'ja');
});

test('an invalid saved selection falls back to browser preferences', t => {
  browser(t, { saved: 'invalid', languages: ['en-GB'] });
  assert.equal(preferredLanguage(), 'en');
});

test('unsupported browser languages fall back to Korean', t => {
  browser(t, { languages: ['fr-FR', 'de-DE'] });
  assert.equal(preferredLanguage(), 'ko');
});

test('navigator.language works when the preference list is unavailable', t => {
  browser(t, { language: 'ja-JP' });
  assert.equal(preferredLanguage(), 'ja');
});

test('navigator.language works when the preference list is empty', t => {
  browser(t, { languages: [], language: 'en-US' });
  assert.equal(preferredLanguage(), 'en');
});

test('blocked storage still follows the browser language', t => {
  browser(t, { blocked: true, languages: ['en-US'] });
  assert.equal(preferredLanguage(), 'en');
});

test('missing preferences safely fall back to Korean', t => {
  browser(t, {});
  assert.equal(preferredLanguage(), 'ko');
});

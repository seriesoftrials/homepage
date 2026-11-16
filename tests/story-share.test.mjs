import assert from 'node:assert/strict';
import { test } from 'node:test';
import { shareStory } from '../grainy/src/story-share.js';

const data = { title: '우리가 시작한 이유 · SERIAL', url: 'https://seriesoftrials.com/intro' };
const copy = { storyLinkCopied: '링크를 복사했어요.', storyCopyPrompt: '아래 링크를 복사해 공유해주세요.' };

function browser(t, values) {
  for (const [key, value] of Object.entries(values)) {
    const original = Object.getOwnPropertyDescriptor(globalThis, key);
    Object.defineProperty(globalThis, key, { value, configurable: true });
    t.after(() => original ? Object.defineProperty(globalThis, key, original) : delete globalThis[key]);
  }
}

test('native sharing sends the article permalink and does not copy anything', async t => {
  browser(t, { navigator: {
    share: async received => assert.deepEqual(received, data),
    clipboard: { writeText: () => assert.fail('Native sharing should not touch the clipboard') },
  } });
  assert.equal(await shareStory(data, copy), '');
});

test('canceling native sharing leaves the clipboard unchanged', async t => {
  browser(t, { navigator: {
    share: async () => { throw new DOMException('Canceled', 'AbortError'); },
    clipboard: { writeText: () => assert.fail('Cancel is not a request to copy') },
  } });
  assert.equal(await shareStory(data, copy), '');
});

test('unsupported or denied native sharing copies the clean article URL', async t => {
  let copied;
  const navigator = { clipboard: { writeText: async value => { copied = value; } } };
  browser(t, { navigator });
  for (const share of [undefined, async () => { throw new DOMException('Denied', 'NotAllowedError'); }]) {
    copied = undefined;
    navigator.share = share;
    assert.equal(await shareStory(data, copy), copy.storyLinkCopied);
    assert.equal(copied, data.url);
  }
});

test('clipboard fallback stays inside the modal and removes its temporary field', async t => {
  let selected = false;
  let removed = false;
  let parent;
  const input = { style: {}, select: () => { selected = true; }, remove: () => { removed = true; } };
  browser(t, {
    navigator: { clipboard: { writeText: async () => { throw new Error('Denied'); } } },
    document: {
      createElement: () => input,
      execCommand: command => {
        assert.equal(command, 'copy');
        assert.equal(selected, true);
        assert.equal(parent, input);
        assert.equal(input.value, data.url);
        return true;
      },
    },
  });
  assert.equal(await shareStory(data, copy, { append: element => { parent = element; } }), copy.storyLinkCopied);
  assert.equal(removed, true);
});

test('fully blocked clipboard offers manual copy without claiming success', async t => {
  let prompted = false;
  let removed = false;
  browser(t, {
    navigator: {},
    document: {
      createElement: () => ({ style: {}, select() {}, remove() { removed = true; } }),
      execCommand: () => { throw new Error('Unavailable'); },
    },
    window: { prompt: (message, value) => {
      assert.equal(message, copy.storyCopyPrompt);
      assert.equal(value, data.url);
      prompted = true;
    } },
  });
  assert.equal(await shareStory(data, copy, { append() {} }), '');
  assert.equal(prompted, true);
  assert.equal(removed, true);
});

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { buildStoryPage } from '../scripts/story-page.mjs';

test('the shared article serves the homepage reader with article metadata', async () => {
  const [homepage, intro] = await Promise.all([
    readFile(new URL('../grainy/index.html', import.meta.url), 'utf8'),
    readFile(new URL('../grainy/intro.html', import.meta.url), 'utf8'),
  ]);
  const article = intro.match(/<article class="manifesto">[\s\S]*?<\/article>/)[0];
  const story = buildStoryPage(homepage.replace('<!-- SPIRIT_ORIGIN_ARTICLE -->', article), intro);
  assert.match(story, /data-initial-dialog="origin-story"/);
  assert.doesNotMatch(story, /class="intro-pending"/);
  assert.match(story, /<dialog[^>]+id="origin-story"/);
  assert.ok(story.includes(article));
  assert.match(story, /src="\/ver2-hero\.js\?/);
  assert.match(story, /href="\/ver2\.css\?/);
  assert.doesNotMatch(story, /href="\/styles\.css\?/);
  assert.equal((story.match(/rel="canonical"/g) || []).length, 1);
  assert.equal((story.match(/property="og:title"/g) || []).length, 1);
  assert.match(story, /<title>우리가 시작한 이유 · SERIAL<\/title>/);
  assert.match(story, /property="og:type" content="article"/);
  assert.match(story, /property="og:url" content="https:\/\/seriesoftrials\.com\/intro"/);
});

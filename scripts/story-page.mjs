// Keep the share URL on the current homepage while exposing article metadata to crawlers.
export function buildStoryPage(homepage, intro) {
  const metadata = /<meta\s+(?:name="(?:description|twitter:[^"]+)"|property="og:[^"]+")[\s\S]*?>|<link rel="canonical"[^>]*>|<title>[^<]*<\/title>/g;
  const articleMetadata = intro.match(/<head>[\s\S]*?<\/head>/)?.[0].match(metadata);
  if (!articleMetadata?.length) throw new Error('The shared story needs article metadata.');
  return homepage
    .replace('class="intro-pending"', 'data-initial-dialog="origin-story"')
    .replace(/<head>[\s\S]*?<\/head>/, head => head.replace(metadata, '').replace('</head>', `${articleMetadata.join('\n')}\n</head>`));
}

# Support and recruitment release validation

| Area | Before | After |
| --- | --- | --- |
| Recruitment CTA | English omitted the cohort; wording differed between languages | Korean, English, Japanese and Chinese identify the 2027 first-cohort notification flow |
| Event title | Responsive desktop size; 36px on mobile | Fixed 28px on desktop and 24px on mobile |
| CAU watermark | 5% opacity | 9% opacity |
| Sponsorship | Email link on homepage | Dedicated multilingual `/support` page with 14px body text, activity reports and student UGC collaboration |

Validated locally on 2026-11-17 at 1113px and 390px viewport widths. Language switching and opening/closing the notification dialog worked in all four languages. No horizontal page overflow was measured; support text had no missing translations. No notification request or email was submitted.

`npm run check` passed: ESLint (three existing ribbon warnings), Next build, 15 tests, and Cloudflare Worker dry run. The installed Next version emitted a security upgrade reminder; an identical retry succeeded. No dependency upgrade was included.

Reviewed screenshots:

- [English homepage, desktop](home-en-1113.png)
- [English homepage, mobile](home-en-390.png)
- [Japanese notification dialog, mobile](dialog-ja-mobile.png)
- [Chinese homepage, mobile](home-zh-390.png)
- [Korean sponsorship page, desktop](support-1113.png)
- [Korean sponsorship page, mobile](support-390.png)

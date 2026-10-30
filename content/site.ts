import type { Localized } from "@/components/i18n/T";

// All copy lives here. Sources: memo/ founding documents, the full intro deck
// (memo/asset/전체 소개 덱), and the copy of the existing seriesoftrials.com
// (src/home-ui.js, scripts/build-brand.mjs, dist/intro.html).

type L = Localized;
type Lines = Localized<string[]>;

export const brand = {
  name: "SERIAL",
  society: { ko: "중앙대학교 실전창업학회", en: "Chung-Ang University Startup Society" } as L,
  established: "EST 2026 09",
  coordinates: "37.50439° N, 126.95676° E",
  // Opens the campus place page on Google Maps.
  mapUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent("중앙대학교 서울캠퍼스")}`,
};

export const nav: { href: string; label: L }[] = [
  { href: "/intro", label: { ko: "소개", en: "Intro" } },
  { href: "/members", label: { ko: "멤버", en: "Members" } },
  { href: "/projects", label: { ko: "프로젝트", en: "Projects" } },
  { href: "/updates", label: { ko: "업데이트", en: "Updates" } },
  { href: "/join", label: { ko: "함께하기", en: "Join Us" } },
];

// The home page: SERIAL unfolding into Series of Trials, and where to go next.
export const homeHero = {
  tagline: "See the real. Run the trial.",
  intro: { ko: "SERIAL 알아보기", en: "About SERIAL" } as L,
};

// The society line heads the home page. Each stage line goes with one stage of
// the ribbon forming on the intro page: loose loop, crossing, twist, S.
export const hero = {
  eyebrow: { ko: "중앙대학교 실전창업학회", en: "Chung-Ang University Startup Society" } as L,
  scroll: { ko: "Scroll to discover", en: "Scroll to discover" } as L,
  stages: [
    { ko: "열망은 흩어져 있었습니다.", en: "Ambition was scattered." },
    { ko: "서로를 발견하고,", en: "We find each other," },
    { ko: "생각을 행동으로 뒤집어,", en: "turn thought into action," },
    { ko: "이어지는 시도가 됩니다.", en: "and become a series of trials." },
  ] as L[],
};

export const problem = {
  statement: {
    ko: "중앙대학교에는 불확실성에 도전할 의지가 있는 사람들이 분명히 존재합니다. 다만 서로를 발견할 구조가 부족합니다. 어느 학교에 다니는지가 도전의 가능성을 결정할 이유는 없습니다.",
    en: "Chung-Ang has people who want to take on uncertainty. What it lacks is a way for them to find each other. Which school you attend should not decide what you can attempt.",
  } as L,
  // What students are missing, from the deck's "Cold start" page.
  needs: [
    {
      name: { ko: "경험", en: "Experience" },
      text: {
        ko: "창업에 관심이 있어도, 첫 프로젝트를 실행할 기회와 방법을 찾기 어렵습니다.",
        en: "Even with an interest in startups, it is hard to find the chance, and the way, to run a first project.",
      },
    },
    {
      name: { ko: "사람", en: "People" },
      text: {
        ko: "학과와 캠퍼스를 넘어 함께할 동료를 찾기 어렵습니다.",
        en: "It is hard to find teammates beyond your own department and campus.",
      },
    },
    {
      name: { ko: "선배", en: "Seniors" },
      text: {
        ko: "창업을 경험한 선배에게 조언을 구할 기회가 필요합니다.",
        en: "Students need chances to ask seniors who have founded companies.",
      },
    },
  ] as { name: L; text: L }[],
};

// SER·IAL unfold into SERies of trIALs on the home page; the Möbius lines
// close the intro page's logo story.
export const reveal = {
  parts: [
    { text: "SER", keep: true },
    { text: "IES OF TR", keep: false },
    { text: "IAL", keep: true },
    { text: "S", keep: false },
  ],
  mobius: {
    ko: ["SERIAL의 S와 뫼비우스의 띠.", "안과 밖이 끊기지 않고 이어지는 띠처럼,", "한 번의 시도가 다음 시도로 이어집니다."],
    en: ["The S of SERIAL and a Möbius strip.", "Like a band whose inside runs into its outside,", "one trial leads into the next."],
  } as Lines,
};

// One semester, from the deck's "Curriculum" pages: three trials, then DEMO DAY.
export const program = {
  lead: {
    ko: "이론보다 실행. 16주 동안 세 가지 프로젝트를 경험하고, DEMO DAY에서 결과를 공유합니다.",
    en: "Execution over theory. Over 16 weeks you run three projects and share the results at DEMO DAY.",
  } as L,
  steps: [
    {
      week: "Week 1",
      name: "OT",
      text: { ko: "기수 목표와 일정, 수료 기준과 규칙을 나누고 서로를 소개합니다.", en: "Cohort goals and schedule, completion rules, and introductions." },
    },
    {
      week: "Week 2–4",
      name: "100,000 Project",
      trial: 1,
      text: {
        ko: "팀별 10만 원으로 2~3주 동안 아이디어를 실행하고 고객 반응을 확인합니다. 손실이 나도 팀원이 메우지 않습니다.",
        en: "Each team gets ₩100,000 to run an idea for 2–3 weeks and see how customers respond. No one covers a loss out of pocket.",
      },
    },
    {
      week: "Week 5",
      name: "MT",
      text: { ko: "첫 프로젝트의 결과와 배운 점을 나누고, 기수끼리 가까워집니다.", en: "Results and lessons from the first project, and time together as a cohort." },
    },
    {
      week: "Week 6–12",
      name: "Theory + Validation",
      trial: 2,
      text: {
        ko: "창업 사례와 Y Combinator Startup School 중심의 최소한의 이론을 배우고, 연사 강연과 멘토 피드백으로 가설을 검증합니다.",
        en: "Case studies and a minimum of theory built on Y Combinator's Startup School; speakers and mentor feedback to test each hypothesis.",
      },
    },
    {
      week: "Week 13",
      name: "Short-term Project",
      trial: 3,
      text: { ko: "무박 2일 또는 2박 3일의 아이디어톤·해커톤. 활동마다 새 팀을 꾸립니다.", en: "A one- or two-night ideathon or hackathon, with a new team each time." },
    },
    {
      week: "Week 14",
      name: "DEMO DAY",
      text: {
        ko: "심사역과 선배 창업가 앞에서 결과를 발표합니다. 결과물의 권리는 팀원에게 있습니다.",
        en: "Teams pitch their results to VCs and founder alumni. What you build stays yours.",
      },
    },
    {
      week: "Week 15",
      name: "Homecoming Day",
      text: { ko: "현 기수와 OB가 만나 경험을 나눕니다.", en: "Current members and alumni meet and share what they learned." },
    },
  ] as { week: string; name: string; trial?: number; text: L }[],
};

// What a member comes away with, from the deck's "Benefits" page. Only what is
// planned is listed; support still under discussion with the school is not.
export const perks = {
  items: [
    {
      name: "Experience",
      text: { ko: "직접 실행한 프로젝트와, 고객 반응을 설명할 수 있는 경험", en: "Projects you ran yourself, and customer responses you can speak to" },
    },
    {
      name: "Network",
      text: { ko: "선배 창업가, 연사, 다른 학회와의 교류 기회", en: "Time with founder alumni, speakers and other societies" },
    },
    {
      name: "Mentor",
      text: { ko: "프로젝트의 어려움을 나누고, 경험자의 피드백을 받습니다", en: "Talk through what is hard and get feedback from people who have done it" },
    },
    {
      name: "Perks",
      text: { ko: "팀별 시드 머니 10만 원과 AI 도구 이용을 지원할 계획입니다", en: "₩100,000 seed money per team, with AI tools planned" },
    },
    {
      name: "Team",
      text: { ko: "프로젝트를 함께 실행하며 협업할 동료를 만납니다", en: "Teammates you find by building together" },
    },
    {
      name: "Direction",
      text: { ko: "프로젝트 경험을 바탕으로 자신의 강점과 관심 분야를 확인합니다", en: "Your strengths and interests, found through the projects" },
    },
  ] as { name: string; text: L }[],
};

export const join = {
  title: { ko: ["함께해요."], en: ["Join us."] } as Lines,
  text: {
    ko: "SERIAL은 매 학기 새로운 학회원을 모집합니다. 다음 시도를 함께 만들어요.",
    en: "SERIAL recruits new members every semester. Let's make the next trial together.",
  } as L,
  cta: { ko: "함께하기", en: "Join us" } as L,
};

export type MemberLink = { label: string; href: string };

// `quote` and `links` are filled in by each member; the profile shows a
// placeholder until a quote exists and simply omits missing links.
export type Member = {
  slug: string;
  name: string;
  role: string;
  major: L;
  quote?: L;
  links?: MemberLink[];
};

// Names stay in Korean in both languages until members confirm their own romanization.
export const members: Member[] = [
  { slug: "minseo", name: "김민서", role: "Ops", major: { ko: "경영학", en: "Business Administration" } },
  { slug: "rihyeon", name: "윤리현", role: "Ops", major: { ko: "건설환경플랜트공학", en: "Civil, Environmental & Plant Engineering" } },
  { slug: "hyoseok", name: "곽효석", role: "Partnerships", major: { ko: "경영학", en: "Business Administration" } },
  { slug: "yebin", name: "권예빈", role: "Ops", major: { ko: "심리학", en: "Psychology" } },
  { slug: "gun", name: "정건", role: "Ops", major: { ko: "전자전기공학", en: "Electrical & Electronics Engineering" } },
  { slug: "seojin", name: "홍서진", role: "Curriculums", major: { ko: "중국어문학", en: "Chinese Language & Literature" } },
  { slug: "taerin", name: "기태린", role: "Production", major: { ko: "산업보안학", en: "Industrial Security" } },
];

export const membersPage = {
  title: { ko: "멤버", en: "Members" } as L,
  lead: { ko: "SERIAL을 처음 시작한 창립 멤버입니다.", en: "The founding members who started SERIAL." } as L,
  hint: { ko: "눌러서 프로필 보기", en: "Tap to see the profile" } as L,
  next: { ko: "다음은 당신", en: "You, next" } as L,
  quotePlaceholder: { ko: "한마디를 준비하고 있어요.", en: "A few words, coming soon." } as L,
  close: { ko: "닫기", en: "Close" } as L,
};

// The intro page, "About SERIAL": one section per entry, in this order, with
// the entries listed beside them on wide screens. `id` is the section's anchor.
export const introPage = {
  title: { ko: "SERIAL 알아보기", en: "About SERIAL" } as L,
  sections: [
    {
      id: "problem",
      label: { ko: "문제의식", en: "The problem" },
      title: { ko: ["서로를 발견할", "구조가 필요합니다"], en: ["We need a way", "to find each other"] },
    },
    {
      id: "logo",
      label: { ko: "로고", en: "The logo" },
      title: { ko: ["흩어진 열망이", "이어지는 시도가 되기까지"], en: ["From scattered ambition", "to a series of trials"] },
    },
    {
      id: "program",
      label: { ko: "프로그램", en: "Program" },
      title: { ko: ["16주 동안", "세 번 시도합니다"], en: ["Sixteen weeks,", "three trials"] },
    },
    {
      id: "perks",
      label: { ko: "혜택", en: "Perks" },
      title: { ko: ["한 학기 동안", "얻게 되는 것"], en: ["What you get", "in one semester"] },
    },
  ] as { id: string; label: L; title: Lines }[],
};

export const placeholderPages = {
  projects: { title: { ko: "프로젝트", en: "Projects" } as L },
  updates: { title: { ko: "업데이트", en: "Updates" } as L },
  join: { title: { ko: "함께하기", en: "Join Us" } as L },
  soon: { ko: "다음 시도를 준비하고 있습니다.", en: "The next trial is in the works." } as L,
};

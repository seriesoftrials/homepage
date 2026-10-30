import type { Localized } from "@/components/i18n/T";

// All copy lives here. Sources: memo/ founding documents and the copy of the
// existing seriesoftrials.com (src/home-ui.js, scripts/build-brand.mjs, dist/intro.html).

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
};

export const reveal = {
  // SER·IAL expand into SERies of trIALs.
  parts: [
    { text: "SER", keep: true },
    { text: "IES OF TR", keep: false },
    { text: "IAL", keep: true },
    { text: "S", keep: false },
  ],
  slogan: "Keep it serial.",
  sloganSub: { ko: "계속, 진짜로.", en: "Again, for real." } as L,
  mobius: {
    ko: ["SERIAL의 S와 뫼비우스의 띠.", "안과 밖이 끊기지 않고 이어지는 띠처럼,", "한 번의 시도가 다음 시도로 이어집니다."],
    en: ["The S of SERIAL and a Möbius strip.", "Like a band whose inside runs into its outside,", "one trial leads into the next."],
  } as Lines,
};

export const values = {
  title: { ko: ["우리가 존재하는 이유"], en: ["Why we exist"] } as Lines,
  items: [
    {
      name: "Speed up Execution",
      text: {
        ko: "생각과 행동 사이의 간격을 줄입니다. 해보고, 확인하고, 고쳐서 다시 합니다.",
        en: "We shrink the gap between thinking and doing. Try it, check it, fix it, do it again.",
      },
    },
    {
      name: "Deeper Self-understanding",
      text: {
        ko: "해봐야 내가 보입니다. 여러 사람과 프로젝트 속에서 나의 강점과 Founder-Product Fit을 찾습니다.",
        en: "You see yourself by doing. Across people and projects we find our strengths and our founder-product fit.",
      },
    },
    {
      name: "Collision of Perspectives",
      text: {
        ko: "동의든 반대든, 자기 생각으로 말합니다. 생각끼리 부딪히고, 결정한 뒤에는 함께 실행합니다.",
        en: "Agree or disagree, we speak our own minds. Ideas collide, and once decided, we execute together.",
      },
    },
    {
      name: "Communication Under Pressure",
      text: {
        ko: "압박 속에서도 대화를 멈추지 않습니다. 의견을 전하고, 피드백을 주고받고, 다시 함께 일합니다.",
        en: "We keep talking under pressure. We share views, trade feedback, and get back to work together.",
      },
    },
  ] as { name: string; text: L }[],
};

export const activities = {
  title: { ko: ["함께 시도하는", "환경을 만듭니다"], en: ["We build a place", "to try together"] } as Lines,
  items: [
    {
      name: { ko: "커리큘럼", en: "Curriculum" },
      text: {
        ko: "10만원 프로젝트와 Validation. 작게 만들고 시장에 검증받는 기초 근력을 기릅니다.",
        en: "The ₩100k project and validation sprints. Build small, test with real users, and grow the core muscle.",
      },
    },
    {
      name: { ko: "세미나", en: "Seminars" },
      text: {
        ko: "창업자와 VC를 초청해 경험과 관점을 나누고, 데이터 분석·프로덕트 디자인·AI 활용을 주제별로 다룹니다.",
        en: "Founders and VCs share their experience and views, plus topic sessions on data, product design and AI.",
      },
    },
    {
      name: { ko: "자원", en: "Resources" },
      text: {
        ko: "만드는 데 필요한 것을 지원합니다. 개발을 위한 AI 크레딧과 플랜을 제공합니다.",
        en: "We back the building. AI credits and plans for whatever you are making.",
      },
    },
    {
      name: { ko: "네트워크", en: "Network" },
      text: {
        ko: "네트워킹 행사와 타 학회 공동 주최로 대학과 창업 현장을 잇습니다.",
        en: "Networking events and co-hosted sessions with other societies connect campus and the startup scene.",
      },
    },
  ] as { name: L; text: L }[],
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
      id: "story",
      label: { ko: "이야기", en: "The story" },
      title: { ko: ["흩어진 열망이", "이어지는 시도가 되기까지"], en: ["From scattered ambition", "to a series of trials"] },
    },
    {
      id: "problem",
      label: { ko: "문제의식", en: "The problem" },
      title: { ko: ["서로를 발견할", "구조가 필요합니다"], en: ["We need a way", "to find each other"] },
    },
    {
      id: "name",
      label: { ko: "이름", en: "The name" },
      title: { ko: ["이름에 담은 것"], en: ["What the name holds"] },
    },
    { id: "values", label: { ko: "존재 이유", en: "Why we exist" }, title: values.title },
    { id: "activities", label: { ko: "하는 일", en: "What we do" }, title: activities.title },
  ] as { id: string; label: L; title: Lines }[],
};

export const placeholderPages = {
  projects: { title: { ko: "프로젝트", en: "Projects" } as L },
  updates: { title: { ko: "업데이트", en: "Updates" } as L },
  join: { title: { ko: "함께하기", en: "Join Us" } as L },
  soon: { ko: "다음 시도를 준비하고 있습니다.", en: "The next trial is in the works." } as L,
};

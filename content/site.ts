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

// Each caption covers one stage of the ribbon forming: loose loop, crossing, twist, S.
export const hero = {
  eyebrow: { ko: "중앙대학교 실전창업학회", en: "Chung-Ang University Startup Society" } as L,
  title: "Series of Trials",
  scroll: { ko: "Scroll to discover", en: "Scroll to discover" } as L,
  stages: [
    { ko: "열망은 흩어져 있었습니다.", en: "Ambition was scattered." },
    { ko: "서로를 발견하고,", en: "We find each other," },
    { ko: "생각을 행동으로 뒤집어,", en: "turn thought into action," },
    { ko: "이어지는 시도가 됩니다.", en: "and become a series of trials." },
  ] as L[],
};

// Read in place: the words darken one by one while the section is pinned.
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
  hint: { ko: "멤버를 눌러 프로필 보기", en: "Select a member to see their profile" } as L,
  next: { ko: "다음은 당신", en: "You, next" } as L,
  quotePlaceholder: { ko: "한마디를 준비하고 있어요.", en: "A few words, coming soon." } as L,
  close: { ko: "닫기", en: "Close" } as L,
};

export const introPage = {
  title: { ko: "소개", en: "Intro" } as L,
  chapters: [
    {
      title: { ko: ["서로를 발견할", "구조가 필요합니다"], en: ["We need a way", "to find each other"] } as Lines,
      body: [
        {
          ko: "중앙대학교에 신입생으로 입학했을 때부터 스타트업 창업에 뜻이 있는 사람들과 연결되고 싶다는 갈증을 느꼈습니다. 함께 무언가를 시작할 동료를 만나고, 먼저 경험한 선배에게 질문하며, 창업이라는 길을 가까이에서 보고 싶었습니다.",
          en: "From my first semester at Chung-Ang, I wanted to connect with people who cared about building startups. I wanted peers to start something with, seniors to ask questions, and a close look at what founding a company really means.",
        },
        {
          ko: "지난 몇 년간 학생 창업 현장에서 여러 활동을 이어오면서, 그 갈증은 구체적인 문제의식이 되었습니다. 그동안 제가 만난 중앙대학교 학생은 단 한 명이었습니다. 다른 대학의 학생들은 학교를 구심점으로 동료를 만나고, 먼저 창업한 선배들과 경험을 나누며 관계를 이어가고 있었습니다. 입학할 때부터 찾고 싶었던 연결을 그곳에서 볼 수 있었습니다. (서울대학교 - SNUSV, 연세대학교 - VERY, 고려대학교 - NEXT, 연세·고려대학교 연합 - INSIDERS)",
          en: "Over several years in the student startup scene, that wish turned into a concrete problem. In all that time I met exactly one other Chung-Ang student. Students from other universities met peers through their school and kept learning from seniors who had founded companies before them. The connections I had been looking for existed there. (Seoul National University - SNUSV, Yonsei - VERY, Korea University - NEXT, Yonsei-Korea joint - INSIDERS)",
        },
        {
          ko: "학교에서 자주 접하는 진로는 자연스럽게 자신의 선택지가 됩니다. 먼저 걸어간 선배가 있고, 함께 준비하는 동료가 있으면 그 길을 구체적으로 상상할 수 있습니다. 창업도 마찬가지입니다. 함께할 사람을 찾고, 먼저 경험한 사람에게 질문하고, 자신의 생각을 처음 시험해볼 기회가 필요합니다. 이러한 연결이 부족하면 시작의 어려움은 개인의 몫으로 남습니다.",
          en: "The paths you see often at school naturally become your options. When seniors have walked a path and peers are preparing alongside you, you can picture it clearly. Founding is no different. You need people to work with, people to ask, and a first chance to test your ideas. Without those connections, the difficulty of starting is left to each person alone.",
        },
        {
          ko: "사람을 연결하고 개인의 경험을 다음 사람의 기회로 이어주는 일은 대학의 중요한 역할입니다. 그러나 지금 중앙대학교에는 학과와 학년을 넘어 스타트업 창업을 향한 뜻을 모으고, 그 경험을 지속적으로 축적할 구심점이 부족합니다. 처음 시작하는 사람은 어디로 가야 할지 알기 어렵고, 이미 시작한 사람의 경험도 후배에게 닿기 어렵습니다.",
          en: "Connecting people, and turning one person's experience into the next person's opportunity, is an important part of what a university does. Yet Chung-Ang lacks a center that gathers startup ambition across majors and years and keeps building on that experience. Newcomers struggle to know where to go, and the experience of those who have started rarely reaches the people after them.",
        },
        {
          ko: "중앙대학교에는 불확실성에 도전할 의지가 있는 사람들이 분명히 존재합니다. 다만 서로를 발견할 구조가 부족합니다. 어느 학교에 다니는지가 도전의 가능성을 결정할 이유는 없습니다. 우리가 가진 가능성을 함께 발견하고, 서로 연결되며 시너지를 낼 수 있어야 합니다. 이것이 중앙대학교 실전창업학회 SERIAL(Series of Trials)을 시작하려는 이유입니다.",
          en: "Chung-Ang has people who want to take on uncertainty. What it lacks is a way for them to find each other. Which school you attend should not decide what you can attempt. We should discover our potential together, connect, and build on each other. That is why we are starting SERIAL (Series of Trials), Chung-Ang University's startup society.",
        },
      ] as L[],
    },
    {
      title: { ko: ["불확실성을 다루는", "힘을 기릅니다"], en: ["We build the strength", "to handle uncertainty"] } as Lines,
      body: [
        {
          ko: "SERIAL은 스타트업을 만들어 운영했거나 창업에 관심이 있는 재학생들을 중심으로 시작합니다. 우리가 기르고자 하는 핵심 역량은 문제해결력입니다. 창업은 비즈니스를 만드는 일이며, 스타트업은 그중에서도 높은 불확실성을 전제로 합니다. 무엇이 작동할지, 어떤 선택이 옳을지 충분히 알 수 없는 상황에서도 판단하고 행동해야 합니다.",
          en: "SERIAL starts with students who have run a startup or want to. The core skill we want to build is problem solving. Founding means building a business, and a startup assumes high uncertainty from the start. You have to judge and act without knowing what will work or which choice is right.",
        },
        {
          ko: "그러한 상황을 다루기 위해서는 실용적인 힘이 필요합니다. 문제를 정확히 이해하고, 필요한 정보를 찾고, 가설을 세워 실행하고, 결과에 따라 자신의 판단을 수정하는 근육을 길러야 합니다. 영리하게 사고하고 대담하게 실행하며, 얼마나 빠르게 배우고 개선할 수 있는지가 중요합니다.",
          en: "Handling that takes practical strength: understanding the problem precisely, finding the information you need, forming and testing hypotheses, and revising your judgment based on results. Think smart, act boldly, and what matters most is how fast you learn and improve.",
        },
      ] as L[],
    },
    {
      title: { ko: ["함께 시도하는", "환경을 만듭니다"], en: ["We build a place", "to try together"] } as Lines,
      body: [
        {
          ko: "그 힘을 기르는 일에는 적절한 환경과 훈련이 필요합니다. 불확실성을 마주하며 학습하고 개선하는 일은 본능에 반하기 때문에 혼자서 수행하기 어렵습니다. 우리는 이 과정을 시스템화해서 불확실성을 더욱 현명하게 다룰 수 있도록 함께 훈련합니다. 앞으로 어떤 일을 하더라도 스스로 길을 찾아갈 수 있는 기초 체력을 기르고자 합니다.",
          en: "Building that strength takes the right environment and training. Learning and improving in the face of uncertainty goes against instinct, so it is hard to do alone. We turn the process into a system and train together to handle uncertainty more wisely, building the base fitness to find our own way in whatever we do next.",
        },
        {
          ko: "함께 시도하는 동료가 있고, 먼저 경험한 선배에게 질문할 수 있으며, 서로의 시행착오에서 배울 수 있을 때 시너지를 낼 수 있습니다. SERIAL은 대학과 창업 현장을 잇고, 한 사람의 경험이 다른 사람의 출발점이 되는 환경을 만들고자 합니다.",
          en: "Synergy comes when you have peers to try things with, seniors to ask, and each other's mistakes to learn from. SERIAL connects campus with the startup scene and builds a place where one person's experience becomes another's starting point.",
        },
      ] as L[],
    },
    {
      title: { ko: ["함께해요."], en: ["Join us."] } as Lines,
      body: [
        {
          ko: "앞으로 함께 SERIAL을 만들며 다양한 경험을 얻어갈 수 있습니다. 평소 학교생활에서 만나기 어려웠던 사람들과 교류하며 새로운 관점과 기회를 발견하고, 빠른 호흡으로 함께 실행하고 결과를 만들어가는 협업 경험을 쌓을 수 있습니다. 그 과정에서 앞으로 새로운 일을 시작할 때 함께할 동료를 찾을 수도 있습니다.",
          en: "Building SERIAL together brings a range of experiences. You meet people you would rarely meet in ordinary school life, discover new perspectives and opportunities, and gain experience executing quickly and producing results as a team. Along the way you may find the people you will start your next venture with.",
        },
        {
          ko: "그 과정에서 자신의 삶이 어떤 방향으로 나아가기를 원하는지도 깊이 고민할 수 있습니다. 무엇을 잘하는지, 무엇을 중요하게 여기는지, 어떤 문제에 시간을 쓰고 싶은지 실제 경험을 통해 알아갑니다. 이러한 경험은 자신을 더 깊이 이해하고, 앞으로의 선택을 더 단단하게 만들어가는 바탕이 됩니다.",
          en: "You can also think hard about where you want your life to go. Through real experience you learn what you are good at, what you value, and which problems deserve your time. That understanding makes your future choices more solid.",
        },
        {
          ko: "무엇보다 우리가 함께 만드는 연결은 누군가의 인생 궤적을 바꾸는 계기가 될 수 있습니다. 어디서 시작해야 할지 몰랐던 후배가 동료를 만나 첫 시도를 하고, 학회에서 만난 사람을 통해 전공과 관심에 맞는 기회를 얻으며 역량을 키울 수 있습니다. 지금 우리가 만드는 환경이 앞으로 들어올 사람들에게는 새로운 선택지가 됩니다. 저는 누군가의 인생 궤적을 바꾸는 일에 함께하는 것이 돈을 주고도 살 수 없는 가치 있는 경험이라고 생각합니다.",
          en: "Above all, the connections we build can change the course of someone's life. A student who did not know where to start meets peers and makes a first attempt, or finds an opportunity that fits their major and interests through someone met here. What we build now becomes a new option for those who come after. Helping change someone's trajectory is an experience money cannot buy.",
        },
        {
          ko: "언젠가 SERIAL이 중앙대학교를 대표하는 학회로 자리 잡고, 이곳을 거쳐간 후배들이 사회에 의미 있는 영향을 만들어내는 모습을 보게 된다면 큰 자부심을 느낄 수 있을 것 같습니다.",
          en: "If SERIAL one day becomes the society Chung-Ang is known for, and the people who pass through it make a meaningful impact on the world, I think we will be very proud.",
        },
        {
          ko: "누군가는 우리의 뜻에 공감하지 못할 수 있고, 심지어 우리의 시도를 조롱할 수도 있습니다. 기대와 다른 일이 펼쳐지거나, 우리가 바라는 모습에 이르기까지 오랜 시간이 걸릴 수도 있습니다. 그럼에도 지금 시작해야만 합니다. 함께 시작한 일이 다음 세대의 기회가 되고, 그들이 다시 후배들을 이끄는 전통이 쌓여 더 많은 사람에게 기회를 열어주는 학회를 만들어봅시다.",
          en: "Some will not share our view, and some may even mock our attempts. Things may not go as expected, and it may take a long time to become what we hope. Still, we have to start now. Let's build a society where what we start together becomes the next generation's opportunity, and a tradition of each class leading the next opens doors for many more people.",
        },
      ] as L[],
    },
  ],
  quote: {
    ko: "위험한 여정, 적은 임금, 혹한, 몇 달간 지속되는 길고 완전한 어둠, 끊임없는 위험, 안전한 귀환을 보장할 수 없음, 성공시 영광과 명예를 얻을 수 있음.",
    en: "Men wanted for hazardous journey. Small wages, bitter cold, long months of complete darkness, constant danger, safe return doubtful. Honour and recognition in case of success.",
  } as L,
  signature: { name: { ko: "민서", en: "Minseo" } as L, date: "2026 09 20" },
};

export const placeholderPages = {
  projects: { title: { ko: "프로젝트", en: "Projects" } as L },
  updates: { title: { ko: "업데이트", en: "Updates" } as L },
  join: { title: { ko: "함께하기", en: "Join Us" } as L },
  soon: { ko: "다음 시도를 준비하고 있습니다.", en: "The next trial is in the works." } as L,
};

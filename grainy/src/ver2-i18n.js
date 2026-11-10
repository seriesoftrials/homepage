export const LANGUAGE_STORAGE_KEY = 'serial-language';
export const SUPPORTED_LANGUAGES = ['ko', 'en', 'ja', 'zh'];

const englishPersonNames = {
  '김민서': 'Minseo Kim',
  '윤리현': 'Rihyeon Yoon',
  '곽효석': 'Hyoseok Kwak',
  '권예빈': 'Yebin Kwon',
  '정건': 'Gun Jung',
  '홍서진': 'Seojin Hong',
  '기태린': 'Taerin Ki',
};

export const translations = {
  ko: {
    locale: 'ko_KR', htmlLanguage: 'ko',
    pageTitle: 'SERIAL — 중앙대학교 학생창업 네트워크',
    pageDescription: '중앙대학교 학생창업 네트워크 SERIAL. 창업 동료와 선배를 연결하고, 함께 다음 시도를 시작합니다.',
    languageLabel: '언어 선택', menuLabel: '사이트 메뉴', mainNavigation: '사이트 메뉴', mobileNavigation: '모바일 사이트 메뉴',
    homeLabel: 'SERIAL 맨 위로', skipLabel: '본문으로 바로 가기',
    about: '소개', members: '멤버', projects: '프로젝트', records: '기록', join: '함께하기',
    spirit: 'Spirit', spiritCaption: '우리가 시도하는 방식',
    spiritLineOne: '영리하게 사고하고,', spiritLineTwo: '대담하게 실행합니다.',
    spiritDescription: '우리는 모든 답을 알고 시작하지 않습니다. 가설을 세우고, 직접 시도하고, 결과에서 배웁니다. 서로의 시행착오를 나누며 다음 시도로 나아갑니다.',
    spiritImageAlt: '푸른 잔상 속에서 앞으로 발을 내딛는 사람',
    heroLead: '계속되는 시도,', heroDescription: '중앙대학교 실전창업학회 SERIAL',
    networkName: '중앙대학교 학생창업 네트워크',
    aboutUniversity: '중앙대학교에서,', aboutPeople: '창업을 꿈꾸는 사람들이',
    aboutConnection: '서로를 발견하고', aboutStart: '함께 시작하는 네트워크.',
    originCaption: '첫 연결을 만든 사람들',
    originFirst: '다른 전공, 다른 경험을 가진 학생들이 모였습니다.',
    originSecond: '혼자 품었던 생각을 함께 해볼 수 있는 연결로 바꿉니다.',
    originLink: '우리가 시작한 이유', connectionsCaption: '우리가 잇는 것',
    studentPair: '학생과 학생', studentDescription: '함께 시작할 창업 동료를 만납니다.',
    mentorPair: '학생과 선배', mentorDescription: '먼저 시도한 사람의 경험을 나눕니다.',
    campusPair: '캠퍼스와 창업 현장', campusDescription: '학교에서의 생각을 실제 시도로 이어갑니다.',
    people: '사람들', majorBusiness: '경영학', majorCivil: '건설환경플랜트공학', majorPsychology: '심리학',
    majorElectrical: '전자전기공학', majorChinese: '중국어문학', majorSecurity: '산업보안학',
    collegeBusiness: '경영경제대학', collegeEngineering: '공과대학', collegeSocialSciences: '사회과학대학', collegeICT: '창의ICT공과대학', collegeHumanities: '인문대학',
    projectStatus: '준비 중', projectLineOne: '다음 시도는', projectLineTwo: '여기서 시작됩니다.',
    projectFirst: '첫 프로젝트를 준비하고 있습니다.', projectSecond: '문제를 함께 발견하고, 작은 실험부터 시작합니다.',
    ribbonAlt: '하나의 띠로 이어지는 SERIAL의 S 리본', portraitAlt: '흑백 인물 사진',
    storiesCaption: 'SERIAL', storiesTitle: '소개와 기록', storiesCount: '읽을거리 3개',
    introTitle: '시작한 이유', introDescription: 'SERIAL을 시작하며 민서가 쓴 글.',
    brandLabel: '브랜드', brandTitle: '이름과 로고', brandDescription: 'SERIAL의 이름과 S 심볼에 담은 생각.',
    memberRecordLabel: '멤버 기록', memberRecordTitle: '활동 기록', memberRecordDescription: '멤버 로그인 후 업데이트를 볼 수 있습니다.',
    joinTitle: '다음 시도를, 함께.', joinFirst: '창업에 대한 생각이 있다면, 지금 시작해보려 한다면.',
    joinSecond: '중앙대학교에서 다음 연결을 만들어갑니다.', emailAction: '함께하기',
    support: '후원하기', closeDialog: '닫기',
    supportTitle: '다음 시도를 응원해주세요.',
    supportDescription: 'SERIAL의 다음 시도를 함께 만들어주세요. 후원과 협업에 관한 이야기는 이메일로 편하게 남겨주세요.',
    supportContact: '이메일로 문의하기',
    joinImageAlt: '따뜻한 코랄빛 잔상 속에서 한 걸음을 내딛는 사람',
  },
  en: {
    locale: 'en_US', htmlLanguage: 'en',
    pageTitle: 'SERIAL — Chung-Ang University Student Entrepreneurship Network',
    pageDescription: 'SERIAL connects aspiring founders, peers, and alumni at Chung-Ang University to start the next trial together.',
    languageLabel: 'Choose language', menuLabel: 'Site menu', mainNavigation: 'Main navigation', mobileNavigation: 'Mobile navigation',
    homeLabel: 'SERIAL — back to top', skipLabel: 'Skip to content',
    about: 'About', members: 'People', projects: 'Projects', records: 'Stories', join: 'Join us',
    spirit: 'Spirit', spiritCaption: 'How we try',
    spiritLineOne: 'Think clearly.', spiritLineTwo: 'Act boldly.',
    spiritDescription: 'We start before we have every answer. We form a hypothesis, try it, and learn from what happens. By sharing our trials and errors, we move toward the next attempt together.',
    spiritImageAlt: 'A person taking a step forward through blue motion trails',
    heroLead: 'Series of trials,', heroDescription: 'SERIAL — Chung-Ang University Student Entrepreneurship Society',
    networkName: 'Chung-Ang University student entrepreneurship network',
    aboutUniversity: 'At Chung-Ang University,', aboutPeople: 'aspiring founders',
    aboutConnection: 'find each other', aboutStart: 'and get started together.',
    originCaption: 'Our first connections',
    originFirst: 'Students with different majors and experiences came together.',
    originSecond: 'We turn individual ideas into connections that make a shared start possible.',
    originLink: 'Why we started', connectionsCaption: 'What we connect',
    studentPair: 'Students and peers', studentDescription: 'Meet the people you can start a venture with.',
    mentorPair: 'Students and alumni', mentorDescription: 'Learn from people who have taken the first step.',
    campusPair: 'Campus and the startup world', campusDescription: 'Turn ideas from campus into real experiments.',
    people: 'People', majorBusiness: 'Business Administration', majorCivil: 'Civil, Environmental & Plant Engineering', majorPsychology: 'Psychology',
    majorElectrical: 'Electrical & Electronics Engineering', majorChinese: 'Chinese Language & Literature', majorSecurity: 'Industrial Security',
    collegeBusiness: 'College of Business and Economics', collegeEngineering: 'College of Engineering', collegeSocialSciences: 'College of Social Sciences', collegeICT: 'College of ICT Engineering', collegeHumanities: 'College of Humanities',
    projectStatus: 'Coming soon', projectLineOne: 'The next trial', projectLineTwo: 'starts here.',
    projectFirst: 'Our first project is taking shape.', projectSecond: 'We find problems together and start with small experiments.',
    ribbonAlt: 'The connected S ribbon of SERIAL', portraitAlt: 'black-and-white portrait',
    storiesCaption: 'SERIAL', storiesTitle: 'About and records', storiesCount: '3 stories',
    introTitle: 'Why we started', introDescription: 'Minseo’s essay on starting SERIAL.',
    brandLabel: 'Brand', brandTitle: 'Name and logo', brandDescription: 'The ideas behind SERIAL’s name and S symbol.',
    memberRecordLabel: 'Member records', memberRecordTitle: 'Activity log', memberRecordDescription: 'Members can sign in to view updates.',
    joinTitle: 'The next trial, together.', joinFirst: 'Have an idea for a venture, or feel ready to start?',
    joinSecond: 'Make your next connection at Chung-Ang University.', emailAction: 'Join us',
    support: 'Support', closeDialog: 'Close',
    supportTitle: 'Support our next trial.',
    supportDescription: 'Help make SERIAL’s next trial possible. Email us about support or collaboration.',
    supportContact: 'Contact us by email',
    joinImageAlt: 'A person taking a step through warm coral motion trails',
  },
  ja: {
    locale: 'ja_JP', htmlLanguage: 'ja',
    pageTitle: 'SERIAL — 中央大学学生起業ネットワーク',
    pageDescription: '韓国・中央大学の学生起業ネットワークSERIAL。起業を志す仲間や先輩とつながり、次の挑戦をともに始めます。',
    languageLabel: '言語を選択', menuLabel: 'サイトメニュー', mainNavigation: 'メインナビゲーション', mobileNavigation: 'モバイルナビゲーション',
    homeLabel: 'SERIAL — ページの先頭へ', skipLabel: '本文へ移動',
    about: '紹介', members: 'メンバー', projects: 'プロジェクト', records: '記録', join: '参加する',
    spirit: 'スピリット', spiritCaption: '私たちの挑戦のあり方',
    spiritLineOne: '深く考え、', spiritLineTwo: '大胆に行動する。',
    spiritDescription: 'すべての答えが揃う前に、私たちは動き始めます。仮説を立て、試し、結果から学ぶ。互いの試行錯誤を分かち合いながら、次の挑戦へ進みます。',
    spiritImageAlt: '青い残像の中で前へ一歩を踏み出す人',
    heroLead: '続く挑戦、', heroDescription: '韓国・中央大学の実践起業サークル SERIAL',
    networkName: '中央大学学生起業ネットワーク',
    aboutUniversity: '中央大学で、', aboutPeople: '起業を志す人々が',
    aboutConnection: '互いを見つけ、', aboutStart: 'ともに始めるネットワーク。',
    originCaption: '最初のつながりをつくった人たち',
    originFirst: '異なる専攻や経験を持つ学生が集まりました。',
    originSecond: '一人で温めていたアイデアを、ともに挑戦できるつながりに変えます。',
    originLink: '私たちが始めた理由', connectionsCaption: '私たちがつなぐもの',
    studentPair: '学生と学生', studentDescription: 'ともに起業に挑む仲間と出会います。',
    mentorPair: '学生と先輩', mentorDescription: '一歩先を歩んだ人の経験を分かち合います。',
    campusPair: 'キャンパスと起業の現場', campusDescription: '大学で生まれたアイデアを実際の挑戦につなげます。',
    people: 'メンバー', majorBusiness: '経営学', majorCivil: '建設・環境・プラント工学', majorPsychology: '心理学',
    majorElectrical: '電子電気工学', majorChinese: '中国語文学', majorSecurity: '産業保安学',
    collegeBusiness: '経営経済学部', collegeEngineering: '工学部', collegeSocialSciences: '社会科学部', collegeICT: '創意ICT工学部', collegeHumanities: '人文学部',
    projectStatus: '準備中', projectLineOne: '次の挑戦は、', projectLineTwo: 'ここから。',
    projectFirst: '最初のプロジェクトを準備しています。', projectSecond: 'ともに課題を見つけ、小さな実験から始めます。',
    ribbonAlt: '一本の帯でつながるSERIALのSリボン', portraitAlt: 'モノクロのポートレート',
    storiesCaption: 'SERIAL', storiesTitle: '紹介と記録', storiesCount: '3つのストーリー',
    introTitle: '始めた理由', introDescription: 'SERIALの立ち上げにあたり、Minseoが書いた文章。',
    brandLabel: 'ブランド', brandTitle: '名前とロゴ', brandDescription: 'SERIALの名前とSシンボルに込めた思い。',
    memberRecordLabel: 'メンバーの記録', memberRecordTitle: '活動記録', memberRecordDescription: 'メンバーログイン後に更新情報をご覧いただけます。',
    joinTitle: '次の挑戦を、ともに。', joinFirst: '起業のアイデアがある方も、今から始めたい方も。',
    joinSecond: '中央大学で、次のつながりをつくりましょう。', emailAction: '参加する',
    support: '支援する', closeDialog: '閉じる',
    supportTitle: '次の挑戦を応援してください。',
    supportDescription: 'SERIALの次の挑戦を、ともにつくりませんか。ご支援や協業について、お気軽にメールでご連絡ください。',
    supportContact: 'メールで問い合わせる',
    joinImageAlt: '暖かなコーラル色の残像の中で一歩を踏み出す人',
  },
  zh: {
    locale: 'zh_CN', htmlLanguage: 'zh-Hans',
    pageTitle: 'SERIAL — 韩国中央大学学生创业网络',
    pageDescription: '韩国中央大学学生创业网络SERIAL。连接创业伙伴与前辈，一起开启下一次尝试。',
    languageLabel: '选择语言', menuLabel: '网站菜单', mainNavigation: '主导航', mobileNavigation: '移动导航',
    homeLabel: 'SERIAL — 返回顶部', skipLabel: '跳转到正文',
    about: '介绍', members: '成员', projects: '项目', records: '记录', join: '加入我们',
    spirit: '精神', spiritCaption: '我们如何尝试',
    spiritLineOne: '认真思考，', spiritLineTwo: '大胆行动。',
    spiritDescription: '不必等到所有答案都已明晰，我们就开始行动。提出假设，亲自尝试，从结果中学习。分享彼此的试错经验，一起迈向下一次尝试。',
    spiritImageAlt: '一个人在蓝色残影中向前迈步',
    heroLead: '不断尝试，', heroDescription: '韩国中央大学学生创业社团 SERIAL',
    networkName: '中央大学学生创业网络',
    aboutUniversity: '在中央大学，', aboutPeople: '怀揣创业梦想的人们',
    aboutConnection: '发现彼此，', aboutStart: '共同开启新的尝试。',
    originCaption: '建立最初连接的人们',
    originFirst: '来自不同专业、拥有不同经历的学生相聚于此。',
    originSecond: '把独自酝酿的想法，变成能够共同实践的连接。',
    originLink: '我们为何开始', connectionsCaption: '我们连接的事物',
    studentPair: '学生与学生', studentDescription: '结识可以一起开启创业之路的伙伴。',
    mentorPair: '学生与前辈', mentorDescription: '分享先行者的经验。',
    campusPair: '校园与创业一线', campusDescription: '让校园里的想法走向真实的实践。',
    people: '成员', majorBusiness: '经营学', majorCivil: '建设环境与工厂工程', majorPsychology: '心理学',
    majorElectrical: '电子电气工程', majorChinese: '中国语言文学', majorSecurity: '产业安全学',
    collegeBusiness: '经营经济学院', collegeEngineering: '工科学院', collegeSocialSciences: '社会科学学院', collegeICT: '创意ICT工科学院', collegeHumanities: '人文学院',
    projectStatus: '筹备中', projectLineOne: '下一次尝试，', projectLineTwo: '从这里开始。',
    projectFirst: '我们正在筹备第一个项目。', projectSecond: '一起发现问题，从小小的实验开始。',
    ribbonAlt: '由一条丝带连接而成的SERIAL S标志', portraitAlt: '黑白肖像',
    storiesCaption: 'SERIAL', storiesTitle: '介绍与记录', storiesCount: '3篇内容',
    introTitle: '创立的初衷', introDescription: 'Minseo在创立SERIAL时写下的文章。',
    brandLabel: '品牌', brandTitle: '名称与标志', brandDescription: 'SERIAL的名称与S标志背后的理念。',
    memberRecordLabel: '成员记录', memberRecordTitle: '活动记录', memberRecordDescription: '成员登录后即可查看更新内容。',
    joinTitle: '下一次尝试，一起。', joinFirst: '无论你已有创业想法，还是正准备迈出第一步。',
    joinSecond: '在中央大学，建立下一次连接。', emailAction: '加入我们',
    support: '支持我们', closeDialog: '关闭',
    supportTitle: '支持我们的下一次尝试。',
    supportDescription: '一起助力SERIAL的下一次尝试。有关赞助与合作，欢迎通过邮件联系我们。',
    supportContact: '邮件咨询',
    joinImageAlt: '一个人在温暖的珊瑚色残影中迈出一步',
  },
};

export function normalizeLanguage(value) {
  const language = typeof value === 'string' ? value.trim().toLowerCase().split('-')[0] : '';
  return SUPPORTED_LANGUAGES.includes(language) ? language : 'ko';
}

export function applyLanguage(document, value) {
  const language = normalizeLanguage(value);
  const copy = translations[language];
  document.documentElement.lang = copy.htmlLanguage;
  document.title = copy.pageTitle;
  for (const element of document.querySelectorAll('[data-i18n]')) {
    element.textContent = copy[element.dataset.i18n];
  }
  for (const element of document.querySelectorAll('[data-i18n-aria]')) {
    element.setAttribute('aria-label', copy[element.dataset.i18nAria]);
  }
  for (const element of document.querySelectorAll('[data-i18n-alt]')) {
    element.alt = copy[element.dataset.i18nAlt];
  }
  for (const element of document.querySelectorAll('[data-person-name]')) {
    const koreanName = element.dataset.personName;
    const name = language === 'ko' ? koreanName : englishPersonNames[koreanName] || koreanName;
    if (element.matches('img')) element.alt = `${name} — ${copy.portraitAlt}`;
    else {
      element.textContent = name;
      element.lang = language === 'ko' ? 'ko' : 'en';
    }
  }
  for (const button of document.querySelectorAll('[data-language-choice]')) {
    button.setAttribute('aria-pressed', String(button.dataset.languageChoice === language));
  }
  for (const element of document.querySelectorAll('meta[name="description"], meta[property="og:description"], meta[name="twitter:description"]')) element.content = copy.pageDescription;
  for (const element of document.querySelectorAll('meta[property="og:title"], meta[name="twitter:title"]')) element.content = copy.pageTitle;
  const locale = document.querySelector('meta[property="og:locale"]');
  if (locale) locale.content = copy.locale;
  document.querySelector('#hero-title').lang = copy.htmlLanguage;
  document.querySelector('#projects-title').lang = copy.htmlLanguage;
  return language;
}

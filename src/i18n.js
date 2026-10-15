// Vettalon 官網雙語內容。zh-TW 為主、en 為輔。
// 內容紀律：誠實、不誇大，數字直接呈現並附限制。

import { PLAN, LEGAL_NAME_EN, LEGAL_NAME_ZH } from './plan.js';

export const GITHUB = 'https://github.com/zhixuli0406/vettalon';
export const SITE_URL = 'https://vettalon.dudustudio.monster';
export const EMAIL = 'info@dudustudio.monster';
// Commercial / enterprise inquiries go to the vendor directly.
export const CONTACT = 'mailto:' + EMAIL;
// Purchase links. Until a payment provider approves the store these open a
// pre-filled email; swap in the hosted checkout URLs once it goes live.
export const BUY_PRO = 'mailto:' + EMAIL + '?subject=' + encodeURIComponent('Vettalon Pro purchase');
export const BUY_TEAM = 'mailto:' + EMAIL + '?subject=' + encodeURIComponent('Vettalon Team purchase');

// Locale-aware path for a site page ('' = home).
export const pagePath = (locale, page = '') =>
  (locale === 'en' ? '/en/' : '/') + (page ? page + '/' : '');

const P = PLAN;

export const LOCALES = ['zh', 'en'];
export const DEFAULT_LOCALE = 'zh';

// og:locale / html lang per locale
export const LOCALE_META = {
  zh: { lang: 'zh-Hant', ogLocale: 'zh_TW', path: '/' },
  en: { lang: 'en', ogLocale: 'en_US', path: '/en/' },
};

export const content = {
  zh: {
    meta: {
      title: 'Vettalon｜多模型對抗式資安稽核器',
      description:
        'Vettalon 用多個 AI 模型互相對抗覆核，找出程式碼漏洞並壓低誤報；程式碼不離開你的機器。開源核心加上企業版報告、供應鏈獵捕與桌面 App。',
      keywords:
        'Vettalon, 程式碼安全稽核, SAST, 多模型, AI 資安, 供應鏈安全, 漏洞掃描, 嘟嘟數位',
    },
    nav: {
      links: [
        { href: '#product', label: '功能' },
        { href: '#how', label: '怎麼運作' },
        { href: '#benchmarks', label: '基準數字' },
        { href: '#editions', label: '價格' },
        { href: '#faq', label: '常見問題' },
      ],
      cta: '購買',
      github: 'GitHub',
    },
    hero: {
      kicker: 'DUDU STUDIO · 多模型對抗式資安稽核',
      h1a: '讓多個 AI 模型',
      h1em: '互相拆台',
      h1b: '，把真漏洞挑出來',
      lead: 'Vettalon 不靠單一模型的自我判斷。它讓不同家族的模型分頭找洞、再交叉覆核彼此的發現，壓下誤報，留下值得人看的候選。程式碼在你的機器上分析，不經我們手。',
      ctaPrimary: '看 GitHub 原始碼',
      ctaSecondary: '快速開始',
      ctaTertiary: '看版本',
      note: '開源核心採 Apache 2.0，可自行取用。企業版與商業授權由嘟嘟數位直接提供。',
    },
    product: {
      tag: 'CAPABILITIES｜核心能力',
      lead: '一條管線把靜態掃描、多模型 AI 審查、對抗式覆核與沙箱 PoC 串起來。',
      cards: [
        {
          name: '多模型對抗覆核',
          desc: '一個模型找洞，另一個不同家族的模型試著駁倒它。跨家族的覆核才有降誤報效果，單一模型的自我確認不算數。',
          points: ['跨家族 finder／verifier 分工', '每個候選都記錄覆核投票', '誤報在報告裡看得到被誰、用什麼理由駁回'],
        },
        {
          name: '碼不離機',
          desc: '檢測在你的電腦上跑。AI 審查時，程式碼片段只送到你自己設定的模型（你的 CLI 帳號或 API 金鑰，本機 Ollama 則完全不出機器）。Vettalon 不經手、不轉售。',
          points: ['預設零網路', '模型後端你自己挑', '報告與 SARIF 寫出前自動遮蔽秘密'],
        },
        {
          name: '供應鏈獵捕',
          desc: '給企業稽核相依的 OSS 套件原始碼，找尚未登錄成 CVE 的新漏洞，驗證後替企業向上游負責任揭露。私有碼不出境，只送相依的 name@version。',
          points: ['Cargo／npm／pip／Go lockfile', 'OSV 分「已知／可能新」', '只產揭露草稿，永不自動送出'],
        },
      ],
    },
    how: {
      tag: 'HOW IT WORKS｜怎麼運作',
      lead: '深掃的每個階段都留痕，報告寫出前先跑驗證器。',
      steps: [
        { n: '01', t: 'Intake', d: '統計語言、找進入點、讀 git 歷史把常出安全修補的檔案標為熱點，再依風險排序模組。' },
        { n: '02', t: '多模型找洞', d: '前 N 個高風險模組分配給各 finder；高風險模組自動再交一家不同家族覆審。' },
        { n: '03', t: '對抗式覆核', d: '每個候選交給不同家族的 verifier 試圖駁倒。覆核獨立性只算有給出判定的覆核。' },
        { n: '04', t: '沙箱 PoC', d: '對合理的高風險發現，在斷網、唯讀、非 root 的 Docker 容器裡嘗試產生並執行最小 PoC。' },
        { n: '05', t: '報告', d: '輸出 JSON／SARIF，寫出前一律跑驗證器；可利用性分級、CWE／CAPEC 攻擊情境、提交草稿一併附上。' },
      ],
    },
    benchmarks: {
      tag: 'BENCHMARKS｜基準數字',
      lead: '以下數字來自可重現的基準測試，照實寫，連限制也一併列出。',
      items: [
        { v: '9/9', k: '聚焦召回', d: '脆弱檔在掃描範圍內時，9 個真實 CVE 全部識別出正確檔案、行號與漏洞類別。' },
        { v: '0', k: 'OWASP 誤報', d: 'OWASP Benchmark 160 案：91% 召回、0 誤報（上界 ≤ 3.8%）。跨家族覆核把 7B 本機模型的誤報率 57%→0%。' },
        { v: '8/9', k: 'Jev 排序 hit@40', d: '選配的 metadata-only 排序把深掃命中從啟發式的 6/9 提到 8/9，只送 metadata、碼不離機。' },
      ],
      note: '整庫召回 5/9（脆弱檔是超大檔、落在頁數上限外時會漏）；我們把限制也寫清楚。',
    },
    editions: {
      tag: 'PRICING｜版本與價格',
      lead: '開源核心夠你在 CLI／CI 裡用。要給人看的報告和桌面 App，選 Pro 或 Team。',
      cards: [
        {
          name: 'vettalon（開源核心）',
          type: 'Apache 2.0',
          price: '免費',
          priceNote: '開源授權，可商用',
          desc: '命令列稽核器：開源靜態掃描 + 多模型 AI 審查 + 對抗式覆核 + SARIF 輸出。適合塞進 CI、設政策門檻。',
          points: ['scan / hunt / disclose 子命令', 'SARIF 2.1 可上 GitHub code scanning', '政策門檻 --gate 控 CI 結果'],
          cta: '看 GitHub',
          href: GITHUB,
        },
        {
          name: 'Vettalon Pro',
          type: '個人',
          price: P.proPrice,
          priceNote: `一次買斷，含 ${P.updateMonths} 個月更新。之後續訂更新 ${P.proRenewal}／年，不續也能永久使用。`,
          desc: '桌面 App 與本機 dashboard、對齊台灣資安檢測報告慣例的企業報告（PDF／Word／HTML）、供應鏈獵捕與上游揭露草稿。讀同一份掃描 JSON，核心不依賴 Pro。',
          points: ['桌面 App＋本機 dashboard', '企業報告 PDF／Word／HTML', '供應鏈獵捕＋揭露草稿', `單人授權，最多 ${P.proDevices} 台裝置`],
          cta: '洽購 Pro',
          href: BUY_PRO,
        },
        {
          name: 'Vettalon Team',
          type: '團隊',
          price: P.teamPrice,
          priceNote: `年費，含 ${P.teamSeats} 席。`,
          desc: `給資安或開發團隊。Pro 的全部功能，同一組織最多 ${P.teamSeats} 人使用，訂閱期間持續更新並有優先 email 支援。`,
          points: ['Pro 全部功能', `最多 ${P.teamSeats} 位具名使用者`, '訂閱期間所有更新', '優先 email 支援'],
          cta: '洽購 Team',
          href: BUY_TEAM,
        },
      ],
      note: `價格以美元計，未含稅，結帳時依所在地計算。付款完成後，授權金鑰與下載連結會寄到你的 email。首次購買與續訂 ${P.refundDays} 天內可全額退款。台灣企業與政府採購可來信索取新台幣報價。`,
    },
    faq: {
      tag: 'FAQ｜常見問題',
      items: [
        { q: '程式碼會被送到哪裡？', a: '檢測在你的機器上執行。AI 審查時程式碼片段只送到你自己設定的模型（你的 CLI 帳號或 API 金鑰）；用本機 Ollama 則完全不出機器。Vettalon 不經手、不留存、不轉售。' },
        { q: '為什麼要多個模型？', a: '單一模型對自己的判斷沒有抵抗力。讓不同家族的模型互相覆核，才壓得下誤報。OWASP Benchmark 上，跨家族覆核把 7B 本機模型的誤報率從 57% 降到 0%。' },
        { q: '選配的 Jev 排序會外洩程式碼嗎？', a: '不會。Jev 只排序模組審查順序，送出的只有 metadata（路徑、大小、git 熱點數），送出前逐檔比對原始碼 fail-closed。預設關閉，要明確開啟才連網。' },
        { q: '供應鏈獵捕會送出我的私有碼嗎？', a: '不會。獵捕只連套件登錄處與 OSV，送出的只有相依的 name@version。審查的是相依套件的公開原始碼，你的私有碼不出境。揭露一律只產草稿，由人決定送不送。' },
        { q: '開源版和企業版差在哪？', a: '開源核心是完整的命令列稽核器，CI 需要的都有。企業版加上桌面 App、本機 dashboard、企業報告排版與供應鏈獵捕，讀的是同一份掃描 JSON。' },
        { q: '買了不合用可以退款嗎？', a: `可以。Pro 與 Team 首次購買和每次續訂，付款後 ${P.refundDays} 天內來信就能全額退款，不用說明原因。` },
      ],
    },
    contact: {
      tag: 'GET STARTED｜開始使用',
      lead: '',
      options: [
        { t: '自助試用', d: '從 GitHub 取得開源核心，在你的 repo 上跑一次深掃。', cta: '看 GitHub', href: GITHUB },
        { t: '企業版', d: '企業版（桌面 App、企業報告、供應鏈獵捕）與商業授權由嘟嘟數位直接提供。', cta: '聯絡嘟嘟數位', href: CONTACT },
        { t: '原廠回饋', d: '找到 bug 或有功能需求，直接到 GitHub 開 issue。', cta: '回報問題', href: GITHUB + '/issues' },
      ],
    },
    footer: {
      tagline: '多模型對抗式資安稽核。由嘟嘟數位科技開發。',
      groups: [
        { title: '產品', links: [{ t: 'GitHub 原始碼', href: GITHUB }, { t: '價格', href: pagePath('zh') + '#editions' }, { t: '企業版', href: CONTACT }] },
        { title: '原廠', links: [{ t: '嘟嘟數位', href: 'https://www.dudustudio.monster/' }, { t: 'DuDuClaw', href: 'https://duduclaw.dudustudio.monster/' }] },
        { title: '聯絡', links: [{ t: EMAIL, href: 'mailto:' + EMAIL }] },
        { title: '法律', links: [{ t: '服務條款', href: pagePath('zh', 'terms') }, { t: '隱私權政策', href: pagePath('zh', 'privacy') }, { t: '退款政策', href: pagePath('zh', 'refund') }] },
      ],
      copyright: `${LEGAL_NAME_ZH}（${LEGAL_NAME_EN}）`,
    },
  },

  en: {
    meta: {
      title: 'Vettalon | Multi-model adversarial security auditor',
      description:
        'Vettalon has multiple AI models cross-check each other to surface real code vulnerabilities and cut false positives. Your code never leaves your machine. Open-source core plus an enterprise edition with reports, supply-chain hunting and a desktop app.',
      keywords:
        'Vettalon, code security audit, SAST, multi-model, AI security, supply chain security, vulnerability scanning, DuDu Studio',
    },
    nav: {
      links: [
        { href: '#product', label: 'Features' },
        { href: '#how', label: 'How it works' },
        { href: '#benchmarks', label: 'Benchmarks' },
        { href: '#editions', label: 'Pricing' },
        { href: '#faq', label: 'FAQ' },
      ],
      cta: 'Buy',
      github: 'GitHub',
    },
    hero: {
      kicker: 'DUDU STUDIO · MULTI-MODEL SECURITY AUDIT',
      h1a: 'Let several AI models ',
      h1em: 'argue each other down',
      h1b: ' and keep the real bugs',
      lead: "Vettalon doesn't trust one model's own judgment. Different model families hunt for issues, then cross-check each other's findings, cutting false positives and leaving candidates worth a human's time. Your code is analysed on your machine; we never touch it.",
      ctaPrimary: 'View source on GitHub',
      ctaSecondary: 'Quick start',
      ctaTertiary: 'See editions',
      note: 'Open-source core under Apache 2.0, free to use. The enterprise edition and commercial licensing come directly from DuDu Studio.',
    },
    product: {
      tag: 'CAPABILITIES',
      lead: 'One pipeline ties together OSS static scanners, multi-model AI review, adversarial cross-checking and sandboxed PoCs.',
      cards: [
        {
          name: 'Multi-model adversarial review',
          desc: 'One model finds an issue; a model from a different family tries to refute it. Only cross-family review lowers false positives — a single model confirming itself does not count.',
          points: ['Cross-family finder / verifier split', 'Every candidate records its review votes', 'The report shows which model refuted a false positive and why'],
        },
        {
          name: 'Code never leaves your machine',
          desc: 'Analysis runs on your computer. During AI review, code snippets go only to the models you configure (your own CLI account or API key; a local Ollama keeps everything on-device). Vettalon never handles or resells them.',
          points: ['Zero-network by default', 'You choose the model backend', 'Secrets are redacted before any report or SARIF is written'],
        },
        {
          name: 'Supply-chain hunting',
          desc: "Audit the source of your dependencies for not-yet-CVE'd vulnerabilities, then responsibly disclose upstream. Your private code stays put; only each dependency's public name@version is sent.",
          points: ['Cargo / npm / pip / Go lockfiles', 'OSV splits known vs possibly-new', 'Drafts only — nothing is ever auto-sent'],
        },
      ],
    },
    how: {
      tag: 'HOW IT WORKS',
      lead: 'Every stage of a deep audit is recorded, and a validator runs before any report is written.',
      steps: [
        { n: '01', t: 'Intake', d: 'Census languages, find entry points, read git history to flag files that keep getting security fixes, then rank modules by risk.' },
        { n: '02', t: 'Multi-model finding', d: 'The top-ranked modules are dealt to finders; high-risk modules get a second read from a different family.' },
        { n: '03', t: 'Adversarial review', d: 'Each candidate goes to a verifier from another family that tries to refute it. Independence counts only reviews that gave a verdict.' },
        { n: '04', t: 'Sandbox PoC', d: 'For plausible high-risk findings, a minimal PoC is generated and run in a no-network, read-only, non-root Docker container.' },
        { n: '05', t: 'Report', d: 'JSON / SARIF output, validated before writing; exploitability tiers, CWE/CAPEC attack scenarios and disclosure drafts are included.' },
      ],
    },
    benchmarks: {
      tag: 'BENCHMARKS',
      lead: 'The numbers below come from reproducible benchmarks; we report them as measured, limits included.',
      items: [
        { v: '9/9', k: 'Focused recall', d: 'With the vulnerable file in scope, all 9 real CVEs were identified with the right file, line and vulnerability class.' },
        { v: '0', k: 'OWASP false positives', d: 'OWASP Benchmark, 160 cases: 91% recall, 0 false positives (upper bound ≤ 3.8%). Cross-family review took a 7B local model from 57% FP to 0%.' },
        { v: '8/9', k: 'Jev ranking hit@40', d: 'The optional metadata-only ranker lifts deep-audit recall from 6/9 to 8/9, sending metadata only — code never leaves the machine.' },
      ],
      note: 'Whole-repo recall is 5/9 (a vulnerable file that is huge and falls past the page cap can be missed); we state the limits too.',
    },
    editions: {
      tag: 'PRICING',
      lead: 'The open-source core is enough for CLI and CI. For reports people can read and a desktop app, pick Pro or Team.',
      cards: [
        {
          name: 'vettalon core',
          type: 'Open source · Apache 2.0',
          price: 'Free',
          priceNote: 'Open-source license, commercial use allowed',
          desc: 'The command-line auditor: OSS static scanners + multi-model AI review + adversarial cross-checking + SARIF output. Drop it into CI and set policy gates.',
          points: ['scan / hunt / disclose subcommands', 'SARIF 2.1 for GitHub code scanning', 'Policy gates (--gate) control CI outcome'],
          cta: 'View on GitHub',
          href: GITHUB,
        },
        {
          name: 'Vettalon Pro',
          type: 'Individual',
          price: P.proPrice,
          priceNote: `One-time purchase with ${P.updateMonths} months of updates. Renew updates for ${P.proRenewal}/year after that, or keep using your version forever.`,
          desc: 'Desktop app and local dashboard, enterprise reports aligned with Taiwan security-assessment conventions (PDF / Word / HTML), supply-chain hunting and upstream disclosure drafts. Reads the same scan JSON; the core never depends on Pro.',
          points: ['Desktop app + local dashboard', 'Enterprise reports: PDF / Word / HTML', 'Supply-chain hunting + disclosure drafts', `One user, up to ${P.proDevices} devices`],
          cta: 'Get Pro',
          href: BUY_PRO,
        },
        {
          name: 'Vettalon Team',
          type: 'Team',
          price: P.teamPrice,
          priceNote: `Per year, ${P.teamSeats} seats included.`,
          desc: `For security and engineering teams. Everything in Pro for up to ${P.teamSeats} people in one organisation, with updates and priority email support for the whole term.`,
          points: ['Everything in Pro', `Up to ${P.teamSeats} named users`, 'All updates during the term', 'Priority email support'],
          cta: 'Get Team',
          href: BUY_TEAM,
        },
      ],
      note: `Prices in USD, excluding tax, which is calculated at checkout for your location. Your license key and download link are emailed once payment completes. Full refund within ${P.refundDays} days of a first purchase or renewal. Businesses and government agencies in Taiwan can request a TWD quote.`,
    },
    faq: {
      tag: 'FAQ',
      items: [
        { q: 'Where does my code go?', a: 'Analysis runs on your machine. During AI review, code snippets go only to the models you configure (your CLI account or API key); with a local Ollama, nothing leaves the device at all. Vettalon never handles, stores or resells them.' },
        { q: 'Why multiple models?', a: 'A single model has no resistance to its own judgment. Having different families cross-check is what lowers false positives. On the OWASP Benchmark, cross-family review took a 7B local model from 57% FP to 0%.' },
        { q: 'Does the optional Jev ranker leak code?', a: 'No. Jev only reorders which modules are audited first, and sends metadata only (paths, sizes, git hotspot counts), checked against the source file-by-file and failing closed before each request. It is off by default and only reaches the network when you explicitly enable it.' },
        { q: 'Does supply-chain hunting send my private code?', a: "No. Hunting only reaches package registries and OSV, sending each dependency's name@version. It audits the dependency's public source; your private code stays put. Disclosures are always drafts a human decides to send." },
        { q: 'Open-source vs enterprise?', a: 'The open-source core is a complete command-line auditor with everything CI needs. The enterprise edition adds a desktop app, local dashboard, enterprise report layouts and supply-chain hunting, all reading the same scan JSON.' },
        { q: "Can I get a refund if it doesn't fit?", a: `Yes. Email us within ${P.refundDays} days of a first purchase or any renewal of Pro or Team for a full refund, no reason needed.` },
      ],
    },
    contact: {
      tag: 'GET STARTED',
      lead: '',
      options: [
        { t: 'Self-serve', d: 'Get the open-source core from GitHub and run a deep audit on your repo.', cta: 'View on GitHub', href: GITHUB },
        { t: 'Enterprise', d: 'The enterprise edition (desktop app, reports, supply-chain hunting) and commercial licensing come directly from DuDu Studio.', cta: 'Contact DuDu Studio', href: CONTACT },
        { t: 'Feedback', d: 'Found a bug or want a feature? Open an issue on GitHub.', cta: 'Report an issue', href: GITHUB + '/issues' },
      ],
    },
    footer: {
      tagline: 'Multi-model adversarial security auditing. Built by DuDu Studio.',
      groups: [
        { title: 'Product', links: [{ t: 'Source on GitHub', href: GITHUB }, { t: 'Pricing', href: pagePath('en') + '#editions' }, { t: 'Enterprise', href: CONTACT }] },
        { title: 'Vendor', links: [{ t: 'DuDu Studio', href: 'https://www.dudustudio.monster/' }, { t: 'DuDuClaw', href: 'https://duduclaw.dudustudio.monster/' }] },
        { title: 'Contact', links: [{ t: EMAIL, href: 'mailto:' + EMAIL }] },
        { title: 'Legal', links: [{ t: 'Terms of Service', href: pagePath('en', 'terms') }, { t: 'Privacy Policy', href: pagePath('en', 'privacy') }, { t: 'Refund Policy', href: pagePath('en', 'refund') }] },
      ],
      copyright: LEGAL_NAME_EN,
    },
  },
};

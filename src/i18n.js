// Vettalon 官網雙語內容。zh-TW 為主、en 為輔。
// 內容紀律：誠實、不誇大，數字直接呈現並附限制。

import { PLAN, LEGAL_NAME_EN, LEGAL_NAME_ZH, TAX_ID, ADDRESS_EN, ADDRESS_ZH } from './plan.js';
import { DESKTOP_VERSION } from './downloads.js';

export const GITHUB = 'https://github.com/zhixuli0406/vettalon';
export const SITE_URL = 'https://vettalon.dudustudio.monster';
export const EMAIL = 'info@dudustudio.monster';
// Commercial / enterprise inquiries go to the vendor directly.
export const CONTACT = 'mailto:' + EMAIL;
// Hosted checkout (Polar, merchant of record). The license key is emailed by
// Polar; installers are offered on the site's own download page.
export const BUY_PRO = 'https://buy.polar.sh/polar_cl_Ho83TonhMJOzLP6RoHLuT5tu84UZlilt7qkKw393Lvt';
export const BUY_TEAM = 'https://buy.polar.sh/polar_cl_EJBhntqvKHajZm2HspEXqIx8ChPPKwirmH4Z33b57co';
// Locale-aware path for a site page ('' = home).
export const pagePath = (locale, page = '') =>
  (locale === 'en' ? '/en/' : '/') + (page ? page + '/' : '');

export const downloadPath = (locale) => pagePath(locale, 'download');

export const countLabel = (label, count) =>
  typeof label === 'string' ? label : (count === 1 ? label.one : label.other);

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
      title: 'Vettalon｜安全 finding 的獨立第二意見',
      description:
        'Vettalon 替 AI 工具與掃描器產出的安全 finding 提供獨立第二意見：不同家族的模型逐筆反駁，留下證據等級與缺口，最後由人判定。0.5.0 對限定 Python 目標提供來源綁定重現與修補檢查。深掃會將選取的程式碼送到你設定的模型。',
      keywords:
        'Vettalon, 程式碼安全稽核, SAST, 多模型, AI 資安, 供應鏈安全, 漏洞掃描, Dudu Technology Ltd., 嘟嘟數位科技有限公司',
    },
    nav: {
      links: [
        { href: '#product', label: '功能' },
        { href: '#how', label: '怎麼運作' },
        { href: '#benchmarks', label: '案例證據' },
        { href: '#editions', label: '價格' },
        { href: '#faq', label: '常見問題' },
      ],
      cta: '購買',
      github: 'GitHub',
      menu: '選單',
    },
    hero: {
      kicker: 'Dudu Technology Ltd. · 安全 finding 的獨立第二意見',
      h1a: '別讓一個模型',
      h1em: '說了算',
      h1b: '，讓另一家模型來拆台',
      lead: 'AI 工具與掃描器丟出的安全 finding 越來越多。Vettalon 用不同家族的模型逐筆反駁，留下證據等級、還缺的證明與最強反證，沒做完的標成沒做完，最後由人判定。掃描由你的機器編排；深掃時，選取的程式碼與上下文會送到你設定的模型。',
      terminalCaption: '範例輸出，取自 GitHub README（fixtures/demo-app，deep 模式）。',
      ctaPrimary: '看 GitHub 原始碼',
      ctaSecondary: '快速開始',
      ctaTertiary: '看版本',
      note: '開源核心採 Apache 2.0，可自行取用。企業版與商業授權由 Dudu Technology Ltd. 直接提供。',
    },
    product: {
      tag: '核心能力',
      lead: '一條管線串起靜態掃描、多模型覆核、來源綁定重現與修補檢查；每一步都留下可回查的證據。',
      cards: [
        {
          name: '多模型對抗覆核',
          desc: '一個模型找洞，另一個不同家族的模型試著駁倒它。覆核理由會留下來，最後仍需人工判定。',
          points: ['跨家族 finder／verifier 分工', '每個候選都記錄覆核投票', '誤報在報告裡看得到被誰、用什麼理由駁回'],
        },
        {
          name: '程式碼去向由你決定',
          desc: '掃描在本機編排。AI 審查會把選取的程式碼與上下文交給你設定的模型；雲端 API／CLI 會接收這些內容。只有工具、模型與規則資料都已備妥，才可安排離線流程。',
          points: ['依模式確認資料去向', '模型後端你自己挑', '報告與 SARIF 寫出前自動遮蔽秘密'],
        },
        {
          name: '供應鏈獵捕',
          desc: '稽核 OSS 相依套件原始碼，留下需要驗證的候選。獵捕會下載公開套件並向 OSV 查詢 name@version；AI 審查另依模型設定送出套件程式碼。揭露由人決定。',
          points: ['Cargo／npm／pip／Go lockfile', 'OSV 分「已知／可能新」', '只產揭露草稿，永不自動送出'],
        },
        {
          name: '來源綁定重現與修補檢查',
          desc: '從報告選定 finding，在隔離副本中重現效果，或檢查候選 diff 是否擋住攻擊並通過指定測試。原始碼、目標、容器映像與驗證結果都會寫進獨立收據。',
          points: ['每個階段使用斷網的新容器', '不修改工作目錄或 finding 狀態', '目前限 Python command／path／SQL 目標'],
        },
      ],
    },
    how: {
      tag: '怎麼運作',
      lead: '深掃的每個階段都留痕，報告寫出前先跑驗證器。報告分列發生可能性與影響程度，只有另一個家族的模型也評了影響，嚴重程度才會往下調；沒有發現也沒列出檢查項目的模組不算審過。',
      steps: [
        { n: '01', t: 'Intake', d: '統計語言、找進入點、讀 git 歷史把常出安全修補的檔案標為熱點，再依風險排序模組。' },
        { n: '02', t: '多模型找洞', d: '前 N 個高風險模組分配給各 finder；高風險模組自動再交一家不同家族覆審。' },
        { n: '03', t: '對抗式覆核', d: '每個候選交給不同家族的 verifier 試圖駁倒。覆核獨立性只算有給出判定的覆核。' },
        { n: '04', t: '來源綁定驗證', d: '對符合條件的 Python finding，以綁定來源的結構化目標分別執行攻擊、良性控制與全新重跑；未知結果或控制組失敗都不算驗證成功。' },
        { n: '05', t: '報告與可核對收據', d: '輸出 JSON／SARIF，並為重現或修補檢查另寫收據，綁定來源、目標、容器映像與候選 diff。檢查不會修改工作目錄，也不會自動改變 finding 狀態。' },
      ],
    },
    benchmarks: {
      tag: '案例證據',
      lead: '從公開公告、測試結果與限制，逐案核對我們做了什麼。',
      collection: { public: '筆公開案例', historical: '筆歷史識別測試', discovery: '筆原創發現', reported: '筆上游通報', boundary: '這只是已公開案例的集合，不是召回率或誤報率的分母。' },
      items: [
        { k: 'Ammonia：通報與回歸', d: 'Vettalon 找到 needs_human 候選並產生揭露草稿；公開的是人工逐欄選編的節錄，完整原始 hunt.json／JSONL 未公開。Louis Li 人工重現與送件，上游修補後的固定五項政策測試於 4.2.3 有兩項失敗，官方 4.2.4 全數通過。', id: 'ammonia-ghsa-x43w-36pp-96g3', link: '查看候選、回歸與限制' },
        { k: 'aiohttp：歷史識別與版本對照', d: '已公開漏洞的聚焦候選仍是 needs_human；後續另以官方 3.9.1／3.9.2 完成固定輸入的本地 HTTP 四格對照，保留原始讀回與離線驗證器。', id: 'aiohttp-cve-2024-23334', link: '查看候選、版本對照與限制' },
        { k: 'PHPUnit：歷史聚焦識別', d: '已公開漏洞的候選位置；覆核模型呼叫失敗，沒有有效判定，執行狀態為 incomplete。', id: 'phpunit-cve-2017-9841', link: '查看識別紀錄' },
        { k: 'minimist：封存版本掃描', d: '1.2.5 發布檔整樹掃描，在 setKey 提出原型污染候選（needs_human）；1.2.6 同參數掃描沒有標記。比對標準在掃描前登錄。', id: 'minimist-cve-2021-44906', link: '查看掃描與對照' },
        { k: 'PyJWT：封存版本掃描', d: '2.3.0 發布檔整樹掃描，在 HMAC 金鑰檢查提出演算法混淆候選（needs_human）；2.4.0 沒有標記。', id: 'pyjwt-cve-2022-29217', link: '查看掃描與對照' },
        { k: 'guzzlehttp/psr7：封存版本掃描', d: '2.1.0 發布檔整樹掃描，在標頭值處理提出 CR／LF 注入候選（needs_human）；2.1.1 沒有標記。', id: 'guzzle-psr7-cve-2022-24775', link: '查看掃描與對照' },
        { k: 'gorilla/websocket：封存版本掃描', d: 'v1.4.0 發布檔整樹掃描，在訊框長度處理提出整數溢位候選；覆核逾時，停在 candidate。v1.4.1 沒有標記。', id: 'gorilla-websocket-cve-2020-27813', link: '查看掃描與對照' },
        { k: 'smallvec：封存版本掃描', d: '1.6.0 發布檔整樹掃描，在 insert_many 提出緩衝區溢位候選（needs_human）；1.6.1 沒有標記。', id: 'smallvec-cve-2021-25900', link: '查看掃描與對照' },
      ],
      note: '逐案材料不能推估整庫召回、誤報率或自動發現能力。',
    },
    editions: {
      tag: '版本與價格',
      lead: '開源核心夠你在 CLI／CI 裡用。要給人看的報告和桌面 App，選 Pro 或 Team。',
      cards: [
        {
          name: 'vettalon（開源核心）',
          type: 'Apache 2.0',
          price: '免費',
          priceNote: '開源授權，可商用',
          desc: '開源命令列稽核器，提供靜態掃描、多模型覆核、供應鏈獵捕，以及限定 Python 目標的來源綁定重現與修補檢查。適合放進 CI 或設政策門檻。',
          points: ['scan／hunt／reproduce／fix check／disclose', 'JSON／SARIF 與獨立驗證收據', '深掃時 AI 引擎全部不可用會標記 incomplete 並回傳 exit 4'],
          cta: '看 GitHub',
          href: GITHUB,
        },
        {
          name: 'Vettalon Pro',
          type: '個人',
          price: P.proPrice,
          priceNote: `一次買斷，永久使用。含 ${P.updateMonths} 個月的功能更新與新版本，之後 Update Plan ${P.proRenewal}／年，不續也能繼續用。安全更新至少免費 ${P.supportYears} 年，不需要 Update Plan。`,
          desc: '桌面 App、dashboard 與企業報告使用同一套稽核核心。你可以從 finding 畫面執行來源綁定重現或檢查候選修補，再把更新後的報告帶回介面審查。',
          points: ['桌面 App＋本機 dashboard', '來源綁定 PoC／修補檢查，目前限支援的 Python 目標', '企業報告 PDF／Word／HTML', `單人授權，最多 ${P.proDevices} 台裝置`, `安全更新至少免費到購買日起第 ${P.supportYears} 年同月月底`, '桌面 App 支援 Apple Silicon Mac、Windows、Linux，不支援 Intel Mac'],
          cta: '購買 Pro',
          href: BUY_PRO,
        },
        {
          name: 'Vettalon Team',
          type: '團隊',
          price: P.teamPrice,
          priceNote: `年費，含 ${P.teamSeats} 席。`,
          desc: `給資安或開發團隊。Pro 的全部功能，同一組織最多 ${P.teamSeats} 人使用，訂閱期間持續更新並有優先 email 支援。`,
          points: ['Pro 全部功能', `最多 ${P.teamSeats} 位具名使用者`, '訂閱期間所有更新', '優先 email 支援', '桌面 App 不支援 Intel Mac'],
          cta: '購買 Team',
          href: BUY_TEAM,
        },
      ],
      note: `價格以美元計，未含稅，結帳時依所在地計算。付款完成後，授權金鑰會寄到你的 email，桌面 App 從下載頁安裝（Apple Silicon Mac、Windows、Linux；不支援 Intel Mac）。首次購買與續訂 ${P.refundDays} 天內可全額退款。台灣企業與政府採購可來信索取新台幣報價。`,
      support: {
        rule: `每筆購買的安全更新至少免費到購買日起第 ${P.supportYears} 年同一個月的月底，不需要 Update Plan。Update Plan 只涵蓋新功能與新的主要版本。`,
        today: (end) => `今天購買，安全更新至少到 ${end}。`,
        link: { label: '支援期與安全更新', href: pagePath('zh', 'support') },
      },
      download: { label: `下載桌面 App ${DESKTOP_VERSION}`, href: downloadPath('zh') },
    },
    faq: {
      tag: '常見問題',
      items: [
        { q: '程式碼會被送到哪裡？', a: '掃描由你的機器編排。深掃會把選取的程式碼與上下文送到你設定的模型；使用雲端 API／CLI 時，請先確認供應商的資料政策。本機模型只在你備妥所有工具與規則資料時，才可安排離線流程。' },
        { q: '為什麼要多個模型？', a: '不同家族模型可用不同角度挑戰候選，留下可供人工判斷的理由。實際偵測成效仍須用有公開輸入、對照與逐案結果的測試衡量。' },
        { q: '選配的 Jev 排序會外洩程式碼嗎？', a: '不會。Jev 只排序模組審查順序，送出的只有 metadata（路徑、大小、git 熱點數），送出前逐檔比對原始碼 fail-closed。預設關閉，要明確開啟才連網。' },
        { q: '供應鏈獵捕會送出我的私有碼嗎？', a: '獵捕處理公開相依套件，會連套件登錄處並向 OSV 查詢 name@version；AI 審查可能把選取的套件原始碼送到你設定的模型。它不會自動送出漏洞通報，揭露草稿由人決定。' },
        { q: '開源版和企業版差在哪？', a: '開源核心提供 CLI、CI、供應鏈獵捕，以及限定 Python 目標的來源綁定重現與修補檢查。Pro 使用相同核心，另外提供桌面操作、dashboard、企業報告與授權管理。' },
        { q: 'Vettalon 會直接套用修補嗎？', a: '不會。Fix check 只在隔離副本套用候選 diff，檢查攻擊效果是否消失、指定測試是否仍通過，並另寫驗證收據。你的工作目錄與原本的 finding 狀態都不會被更動。' },
        { q: 'Pro 的授權驗證會連網嗎？', a: '只有啟用時，以及之後每 30 天一次。送出的是授權金鑰、一組裝置 ID（本機識別碼的雜湊值，無法還原）和版本號，不含程式碼或報告；其餘時間可以完全離線使用。開源核心 vettalon 不做授權檢查。' },
        { q: 'Intel Mac 可以用嗎？', a: '桌面 App 不行，只支援 Apple Silicon（M1 以上）的 Mac，Windows 與 Linux 不受影響。購買前請點左上角蘋果選單 →「關於這台 Mac」確認：顯示「晶片 Apple M…」可以使用，顯示「處理器 … Intel」則無法使用。免費的開源 CLI 仍可在 Intel Mac 上執行。' },
        { q: 'Update Plan 到期後還有安全更新嗎？', a: `有。每筆購買的安全更新至少免費提供到購買日起第 ${P.supportYears} 年同一個月的月底，例如 2026 年 10 月購買，至少到 2031 年 10 月底。安全更新和 Update Plan 分開計算，Update Plan 只涵蓋新功能與新的主要版本；如果新版本要付費，我們會替你能免費使用的版本另外出安全修補。桌面 App 0.4.0 起，「設定 → 關於 Vettalon」會顯示你的結束年月。` },
        { q: '買了不合用可以退款嗎？', a: `可以。Pro 與 Team 首次購買和每次續訂，付款後 ${P.refundDays} 天內來信就能全額退款，不用說明原因。` },
      ],
    },
    contact: {
      tag: '開始使用',
      lead: '',
      options: [
        { t: '自助試用', d: '從 GitHub 取得開源核心，在你的 repo 上跑一次深掃。', cta: '看 GitHub', href: GITHUB },
        { t: '企業版', d: 'Desktop、來源綁定重現、修補檢查、dashboard、企業報告或導入需求，由 Dudu Technology Ltd. 直接提供。', cta: '聯絡 Dudu Technology Ltd.', href: CONTACT },
        { t: '原廠回饋', d: '找到 bug 或有功能需求，直接到 GitHub 開 issue。', cta: '回報問題', href: GITHUB + '/issues' },
      ],
    },
    footer: {
      tagline: '安全 finding 的獨立第二意見。由 Dudu Technology Ltd. 開發。',
      groups: [
        { title: '產品', links: [{ t: 'GitHub 原始碼', href: GITHUB }, { t: '證據牆', href: pagePath('zh', 'evidence') }, { t: '價格', href: pagePath('zh') + '#editions' }, { t: `下載桌面 App ${DESKTOP_VERSION}`, href: downloadPath('zh') }, { t: '企業版', href: CONTACT }] },
        { title: '原廠', links: [{ t: 'Dudu Technology Ltd.', href: 'https://www.dudustudio.monster/' }, { t: 'DuDuClaw', href: 'https://duduclaw.dudustudio.monster/' }] },
        { title: '聯絡', links: [{ t: EMAIL, href: 'mailto:' + EMAIL }] },
        { title: '法律', links: [{ t: '服務條款', href: pagePath('zh', 'terms') }, { t: '隱私權政策', href: pagePath('zh', 'privacy') }, { t: '退款政策', href: pagePath('zh', 'refund') }, { t: '支援期與安全更新', href: pagePath('zh', 'support') }] },
      ],
      company: `${LEGAL_NAME_EN} · ${LEGAL_NAME_ZH} · 統編 ${TAX_ID} · ${ADDRESS_ZH}`,
    },
  },

  en: {
    meta: {
      title: 'Vettalon | A second opinion on security findings',
      description:
        'Vettalon gives an independent second opinion on security findings from AI tools and scanners: a model from a different vendor refutes each one, evidence levels and proof gaps stay visible, and a human makes the call. Version 0.5.0 adds source-bound reproduction and fix checks for supported Python targets. Deep scans send selected code to the models you configure.',
      keywords:
        'Vettalon, code security audit, SAST, multi-model, AI security, supply chain security, vulnerability scanning, Dudu Technology Ltd.',
    },
    nav: {
      links: [
        { href: '#product', label: 'Features' },
        { href: '#how', label: 'How it works' },
        { href: '#benchmarks', label: 'Case evidence' },
        { href: '#editions', label: 'Pricing' },
        { href: '#faq', label: 'FAQ' },
      ],
      cta: 'Buy',
      github: 'GitHub',
      menu: 'Menu',
    },
    hero: {
      kicker: 'Dudu Technology Ltd. · A second opinion on security findings',
      h1a: "Don't let one model ",
      h1em: 'have the last word',
      h1b: ' on a security finding',
      lead: "AI tools and scanners raise more security findings than anyone can check. Vettalon has a model from a different vendor try to refute each one, keeps the evidence level, the missing proof and the strongest counterevidence, marks unfinished work as unfinished, and leaves the decision to a human. Scans are orchestrated on your machine; deep review sends selected code and context to the models you configure.",
      terminalCaption: 'Sample output from the GitHub README (fixtures/demo-app, deep mode). The terminal summary prints in Traditional Chinese.',
      ctaPrimary: 'View source on GitHub',
      ctaSecondary: 'Quick start',
      ctaTertiary: 'See editions',
      note: 'Open-source core under Apache 2.0, free to use. The enterprise edition and commercial licensing come directly from Dudu Technology Ltd.',
    },
    product: {
      tag: 'Capabilities',
      lead: 'One pipeline connects static scanning, multi-model review, source-bound reproduction, and fix checking—with evidence you can trace at every step.',
      cards: [
        {
          name: 'Multi-model adversarial review',
          desc: 'One model raises an issue; a model from a different family tries to refute it. The reasons remain visible, and a human makes the final determination.',
          points: ['Cross-family finder / verifier split', 'Every candidate records its review votes', 'The report shows which model refuted a false positive and why'],
        },
        {
          name: 'You decide where code goes',
          desc: 'Scans are orchestrated locally. AI review sends selected code and context to the models you configure; cloud APIs and CLIs receive that material. An offline flow requires tools, models, and rule data to be available locally.',
          points: ['Check data flow for each mode', 'You choose the model backend', 'Secrets are redacted before any report or SARIF is written'],
        },
        {
          name: 'Supply-chain hunting',
          desc: "Audit public dependency source and preserve candidates for review. Hunting downloads public packages and queries OSV with name@version; AI review may send selected package code to your configured model. Humans decide on disclosure.",
          points: ['Cargo / npm / pip / Go lockfiles', 'OSV splits known vs possibly-new', 'Drafts only — nothing is ever auto-sent'],
        },
        {
          name: 'Source-bound reproduction and fix checks',
          desc: 'Select a finding from a report, reproduce its effect in an isolated copy, or check whether a candidate diff blocks the attack and passes the requested tests. Source, target, container image, and verdict are recorded in a separate receipt.',
          points: ['Fresh network-disabled container for each phase', 'No working-tree or finding-status changes', 'Currently limited to Python command, path, and SQL targets'],
        },
      ],
    },
    how: {
      tag: 'How it works',
      lead: 'Every stage of a deep audit is recorded, and a validator runs before any report is written. Reports separate likelihood and impact, and severity only goes down when a model from another family also rates the impact. A module with no findings and no listed checks does not count as reviewed.',
      steps: [
        { n: '01', t: 'Intake', d: 'Census languages, find entry points, read git history to flag files that keep getting security fixes, then rank modules by risk.' },
        { n: '02', t: 'Multi-model finding', d: 'The top-ranked modules are dealt to finders; high-risk modules get a second read from a different family.' },
        { n: '03', t: 'Adversarial review', d: 'Each candidate goes to a verifier from another family that tries to refute it. Independence counts only reviews that gave a verdict.' },
        { n: '04', t: 'Source-bound verification', d: 'For supported Python findings, run the attack, benign control, and a fresh rerun against a source-bound structured target. Unknown results and failed controls never count as verified.' },
        { n: '05', t: 'Reports and reviewable receipts', d: 'Export JSON or SARIF and write a separate receipt for reproduction or fix checks, bound to the source, target, container image, and candidate diff. Checks do not modify the working tree or automatically change finding status.' },
      ],
    },
    benchmarks: {
      tag: 'Case evidence',
      lead: 'Review public advisories, test results, and limits case by case.',
      collection: { public: { one: 'public case', other: 'public cases' }, historical: { one: 'historical detection test', other: 'historical detection tests' }, discovery: { one: 'original discovery', other: 'original discoveries' }, reported: { one: 'upstream report', other: 'upstream reports' }, boundary: 'This is the published case collection, not a denominator for recall or false-positive rates.' },
      items: [
        { k: 'Ammonia: report and regression', d: 'Vettalon surfaced a needs_human candidate and generated a disclosure draft. The public attachment is a human-curated excerpt; the full original hunt.json and JSONL are not public. Louis Li reproduced and submitted the report. In five scoped policy checks after the upstream fix, two failed on 4.2.3 and all passed on official 4.2.4.', id: 'ammonia-ghsa-x43w-36pp-96g3', link: 'Review candidate, regression and limits' },
        { k: 'aiohttp: historical detection and local pair', d: 'The known-issue focused candidate remains needs_human. A separate fixed-input local HTTP four-cell pair on official 3.9.1/3.9.2 preserves raw readback and an offline verifier.', id: 'aiohttp-cve-2024-23334', link: 'Review candidate, pair and limits' },
        { k: 'PHPUnit: historical focused detection', d: 'A candidate location for a known vulnerability; the reviewer model failed, leaving no valid verdict and an incomplete run.', id: 'phpunit-cve-2017-9841', link: 'Review detection record' },
        { k: 'minimist: release-archive scan', d: 'A whole-tree scan of the 1.2.5 release raised a prototype-pollution candidate in setKey (needs_human); 1.2.6 with the same parameters was not flagged. Criteria were registered before scanning.', id: 'minimist-cve-2021-44906', link: 'Review scan and control' },
        { k: 'PyJWT: release-archive scan', d: 'A whole-tree scan of the 2.3.0 release raised an algorithm-confusion candidate in the HMAC key check (needs_human); 2.4.0 was not flagged.', id: 'pyjwt-cve-2022-29217', link: 'Review scan and control' },
        { k: 'guzzlehttp/psr7: release-archive scan', d: 'A whole-tree scan of the 2.1.0 release raised a CR/LF injection candidate in header-value handling (needs_human); 2.1.1 was not flagged.', id: 'guzzle-psr7-cve-2022-24775', link: 'Review scan and control' },
        { k: 'gorilla/websocket: release-archive scan', d: 'A whole-tree scan of the v1.4.0 release raised an integer-overflow candidate in frame-length handling; the verifier timed out, so it stays a candidate. v1.4.1 was not flagged.', id: 'gorilla-websocket-cve-2020-27813', link: 'Review scan and control' },
        { k: 'smallvec: release-archive scan', d: 'A whole-tree scan of the 1.6.0 release raised a buffer-overflow candidate in insert_many (needs_human); 1.6.1 was not flagged.', id: 'smallvec-cve-2021-25900', link: 'Review scan and control' },
      ],
      note: 'These case records do not establish whole-repository recall, false-positive rates, or automated discovery.',
    },
    editions: {
      tag: 'Pricing',
      lead: 'The open-source core is enough for CLI and CI. For reports people can read and a desktop app, pick Pro or Team.',
      cards: [
        {
          name: 'vettalon core',
          type: 'Open source · Apache 2.0',
          price: 'Free',
          priceNote: 'Open-source license, commercial use allowed',
          desc: 'The open-source command-line auditor includes static scanning, multi-model review, supply-chain hunting, and source-bound reproduction and fix checks for supported Python targets. Use it in CI or set policy gates.',
          points: ['scan / hunt / reproduce / fix check / disclose', 'JSON / SARIF and separate verification receipts', 'Deep scans return exit 4 and incomplete when every AI engine is unavailable'],
          cta: 'View on GitHub',
          href: GITHUB,
        },
        {
          name: 'Vettalon Pro',
          type: 'Individual',
          price: P.proPrice,
          priceNote: `One-time purchase, yours to keep. Includes ${P.updateMonths} months of feature updates and new versions; after that the Update Plan is ${P.proRenewal}/year, or keep using your version. Security updates stay free for at least ${P.supportYears} years, no Update Plan needed.`,
          desc: 'The desktop app, dashboard, and enterprise reports use the same audit core. Run source-bound reproduction or check a candidate fix from a finding, then bring the updated report back into the interface for review.',
          points: ['Desktop app + local dashboard', 'Source-bound PoC and fix checks for supported Python targets', 'Enterprise reports: PDF / Word / HTML', `One user, up to ${P.proDevices} devices`, `Free security updates until at least the end of the same month ${P.supportYears} years after purchase`, 'Desktop app runs on Apple Silicon Macs, Windows and Linux; Intel Macs are not supported'],
          cta: 'Get Pro',
          href: BUY_PRO,
        },
        {
          name: 'Vettalon Team',
          type: 'Team',
          price: P.teamPrice,
          priceNote: `Per year, ${P.teamSeats} seats included.`,
          desc: `For security and engineering teams. Everything in Pro for up to ${P.teamSeats} people in one organisation, with updates and priority email support for the whole term.`,
          points: ['Everything in Pro', `Up to ${P.teamSeats} named users`, 'All updates during the term', 'Priority email support', 'Desktop app does not support Intel Macs'],
          cta: 'Get Team',
          href: BUY_TEAM,
        },
      ],
      note: `Prices in USD, excluding tax, which is calculated at checkout for your location. Your license key is emailed once payment completes; install the desktop app from the download page (Apple Silicon Macs, Windows, Linux; Intel Macs are not supported). Full refund within ${P.refundDays} days of a first purchase or renewal. Businesses and government agencies in Taiwan can request a TWD quote.`,
      support: {
        rule: `Security updates are free for every purchase until at least the end of the same calendar month ${P.supportYears} years after the purchase date, with no Update Plan needed. The Update Plan covers new features and new major versions only.`,
        today: (end) => `Buy today and security updates are free until at least ${end}.`,
        link: { label: 'Support and security updates', href: pagePath('en', 'support') },
      },
      download: { label: `Download desktop app ${DESKTOP_VERSION}`, href: downloadPath('en') },
    },
    faq: {
      tag: 'FAQ',
      items: [
        { q: 'Where does my code go?', a: 'Scans are orchestrated on your machine. Deep review sends selected code and context to the models you configure. Check the provider data policy when using a cloud API or CLI. Offline use requires all tools, models, and rule data to be available locally.' },
        { q: 'Why multiple models?', a: 'Different model families can challenge a candidate from different angles and preserve their reasons for human review. Detection performance still needs public inputs, controls, and per-case results to measure it.' },
        { q: 'Does the optional Jev ranker leak code?', a: 'No. Jev only reorders which modules are audited first, and sends metadata only (paths, sizes, git hotspot counts), checked against the source file-by-file and failing closed before each request. It is off by default and only reaches the network when you explicitly enable it.' },
        { q: 'Does supply-chain hunting send my private code?', a: "Hunting works on public dependency packages, reaches package registries, and queries OSV with name@version. AI review may send selected package code to your configured model. It does not submit vulnerability reports automatically; a human decides what to do with each draft." },
        { q: 'Open-source vs enterprise?', a: 'The open-source core provides CLI and CI workflows, supply-chain hunting, and source-bound reproduction and fix checks for supported Python targets. Pro uses the same core and adds the desktop interface, dashboard, enterprise reports, and license management.' },
        { q: 'Does Vettalon apply the fix to my code?', a: 'No. Fix check applies the candidate diff only to an isolated copy, verifies that the attack is blocked and the requested tests still pass, then writes a separate receipt. Your working tree and original finding status remain unchanged.' },
        { q: 'Does the Pro license check go online?', a: 'Only when you activate, and then once every 30 days. It sends the license key, a device ID (a one-way hash of the system identifier of this computer) and the app version, never code or reports; the rest of the time Pro works fully offline. The open-source vettalon core never checks a license.' },
        { q: 'Does it run on Intel Macs?', a: 'The desktop app does not. It needs a Mac with Apple Silicon (M1 or later); Windows and Linux are unaffected. Before buying, open the Apple menu > About This Mac: "Chip Apple M…" is supported, "Processor … Intel" is not. The free open-source CLI still runs on Intel Macs.' },
        { q: 'Do security updates continue after the Update Plan ends?', a: `Yes. Every purchase gets free security updates until at least the end of the same calendar month ${P.supportYears} years after the purchase date; a purchase in October 2026 is covered until at least the end of October 2031. Security updates are separate from the Update Plan, which covers new features and new major versions only. If a newer version requires payment, we release security fixes for the version you can use for free. From desktop app 0.4.0, Settings > About Vettalon shows your end month.` },
        { q: "Can I get a refund if it doesn't fit?", a: `Yes. Email us within ${P.refundDays} days of a first purchase or any renewal of Pro or Team for a full refund, no reason needed.` },
      ],
    },
    contact: {
      tag: 'Get started',
      lead: '',
      options: [
        { t: 'Self-serve', d: 'Get the open-source core from GitHub and run a deep audit on your repo.', cta: 'View on GitHub', href: GITHUB },
        { t: 'Enterprise', d: 'Desktop, source-bound reproduction, fix checks, dashboards, enterprise reports, or deployment needs come directly from Dudu Technology Ltd.', cta: 'Contact Dudu Technology Ltd.', href: CONTACT },
        { t: 'Feedback', d: 'Found a bug or want a feature? Open an issue on GitHub.', cta: 'Report an issue', href: GITHUB + '/issues' },
      ],
    },
    footer: {
      tagline: 'A second opinion on security findings. Built by Dudu Technology Ltd.',
      groups: [
        { title: 'Product', links: [{ t: 'Source on GitHub', href: GITHUB }, { t: 'Evidence wall', href: pagePath('en', 'evidence') }, { t: 'Pricing', href: pagePath('en') + '#editions' }, { t: `Download desktop app ${DESKTOP_VERSION}`, href: downloadPath('en') }, { t: 'Enterprise', href: CONTACT }] },
        { title: 'Vendor', links: [{ t: 'Dudu Technology Ltd.', href: 'https://www.dudustudio.monster/' }, { t: 'DuDuClaw', href: 'https://duduclaw.dudustudio.monster/' }] },
        { title: 'Contact', links: [{ t: EMAIL, href: 'mailto:' + EMAIL }] },
        { title: 'Legal', links: [{ t: 'Terms of Service', href: pagePath('en', 'terms') }, { t: 'Privacy Policy', href: pagePath('en', 'privacy') }, { t: 'Refund Policy', href: pagePath('en', 'refund') }, { t: 'Support and security updates', href: pagePath('en', 'support') }] },
      ],
      company: `${LEGAL_NAME_EN} · ${LEGAL_NAME_ZH} · Tax ID ${TAX_ID} · ${ADDRESS_EN}`,
    },
  },
};

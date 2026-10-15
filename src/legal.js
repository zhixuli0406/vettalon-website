// Legal pages (Terms / Privacy / Refund), bilingual.
// Payment-provider review (Paddle / Polar / Dodo) requires these to be public,
// reachable from site navigation, and to name the seller's legal entity.

import { EMAIL } from './i18n.js';
import { LEGAL_NAME_EN, LEGAL_NAME_ZH, PLAN } from './plan.js';

export { LEGAL_NAME_EN, LEGAL_NAME_ZH, EFFECTIVE_DATE } from './plan.js';

export const LEGAL_PAGES = ['terms', 'privacy', 'refund'];

const P = PLAN;

export const legal = {
  zh: {
    effective: '生效日期',
    back: '回首頁',
    terms: {
      title: '服務條款',
      metaDescription: `Vettalon 付費產品的服務條款。提供者：${LEGAL_NAME_EN}（${LEGAL_NAME_ZH}）。`,
      sections: [
        {
          h: '1. 適用範圍與提供者',
          p: [
            `本條款規範你對 Vettalon 官網，以及 Vettalon Pro、Vettalon Team（以下合稱「付費產品」）的購買與使用。付費產品由 ${LEGAL_NAME_EN}（${LEGAL_NAME_ZH}，以下稱「我們」）提供，公司設立於台灣。`,
            `聯絡方式：${EMAIL}。購買或使用付費產品，即表示你同意本條款。代表公司或組織購買時，你須有權代表該組織同意本條款。`,
          ],
        },
        {
          h: '2. 開源核心',
          p: [
            'vettalon 開源核心（命令列稽核器）依 Apache License 2.0 授權，使用規則以該授權條款為準。本條款關於付款、授權金鑰與退款的部分，只適用於付費產品。',
          ],
        },
        {
          h: '3. 訂購與付款',
          p: [
            '付費產品的訂單由我們的線上經銷商處理。該經銷商是交易的 Merchant of Record（記錄商家），負責收款、開立收據，以及依你所在地計算並代繳銷售稅或加值稅（VAT）。經銷商名稱會顯示在結帳頁面與你的收據上，你的付款也會受經銷商的購買條款規範。',
            '官網標示的價格以美元計，未含稅。台灣企業與政府機關可來信索取新台幣報價，以個別報價單為準。',
          ],
        },
        {
          h: '4. 授權內容',
          p: [
            `Vettalon Pro：一次付費，取得單一使用者的永久使用授權，可安裝在該使用者自己的最多 ${P.proDevices} 台裝置上。購買後 ${P.updateMonths} 個月內釋出的版本都可免費更新；之後如需繼續取得新版本，可選擇續訂更新服務（每年 ${P.proRenewal}）。不續訂也能永久使用已取得的版本。`,
            `Vettalon Team：年費訂閱，同一組織內最多 ${P.teamSeats} 位具名使用者可使用。訂閱期間包含所有更新與優先 email 支援。訂閱到期且未續約時，Team 授權隨之終止。`,
            '授權金鑰與下載連結會在付款完成後寄到你購買時填寫的 email。',
            '你不得轉售、出租或散布授權金鑰，不得讓超過授權人數或裝置數的人使用，也不得規避授權檢查機制。付費產品的著作權與其他智慧財產權屬於我們，本條款沒有明示授予的權利，均予保留。',
          ],
        },
        {
          h: '5. 合法使用',
          p: [
            '你只能用 Vettalon 稽核你擁有，或已取得明確授權可測試的程式碼與系統。',
            '供應鏈獵捕模式審查的是公開發佈的第三方套件原始碼。Vettalon 只產生漏洞揭露草稿，不會自動送出；是否送出、送給誰，由你決定，並由你負責遵守各專案的揭露政策與相關法律。',
            '禁止將 Vettalon 用於未經授權存取他人系統或資料，或用於任何違法用途。沙箱 PoC 只在你本機的隔離容器內執行，不得改用來攻擊第三方系統。',
          ],
        },
        {
          h: '6. 第三方 AI 模型',
          p: [
            'AI 審查使用你自行設定的模型供應商帳號或 API 金鑰（例如 Anthropic、OpenAI、Google），或你本機執行的模型。你與模型供應商之間的關係與費用，受該供應商的條款規範。程式碼片段由你的機器直接送到你選的供應商，我們不會收到。',
          ],
        },
        {
          h: '7. 結果的性質與免責',
          p: [
            'AI 與靜態分析都可能漏報或誤報。Vettalon 的報告是協助人工判斷的參考資料，不保證程式碼沒有漏洞，也不能取代專業資安人員的判斷。',
            '在法律允許的範圍內，付費產品依「現狀」提供，我們不提供適售性、特定用途適用性等任何明示或默示的保證。',
          ],
        },
        {
          h: '8. 責任限制',
          p: [
            '在法律允許的最大範圍內，我們對你的全部賠償責任，以你在損害發生前 12 個月內為該付費產品實際支付的金額為上限；對於間接、附帶或衍生性損害（包括利潤損失、資料遺失），我們不負賠償責任。',
            '本條款不排除依適用法律不得排除的消費者權利。',
          ],
        },
        {
          h: '9. 退款',
          p: [`退款依《退款政策》辦理：首次購買與每次續訂，自付款日起 ${P.refundDays} 天內可申請全額退款。`],
          link: { page: 'refund', label: '查看退款政策' },
        },
        {
          h: '10. 條款變更',
          p: [
            '我們可能修改本條款，修改後的版本會公布在本頁並更新生效日期。重大變更會在生效前至少 14 天公告。你已購買的授權範圍不會因為日後的條款修改而縮減。',
          ],
        },
        {
          h: '11. 準據法與管轄',
          p: [
            '本條款以中華民國（台灣）法律為準據法。因本條款產生的爭議，雙方同意以臺灣臺北地方法院為第一審管轄法院；但適用法律賦予消費者向其住所地法院起訴的權利，不受影響。',
          ],
        },
      ],
    },
    privacy: {
      title: '隱私權政策',
      metaDescription: `Vettalon 如何處理你的資料：產品在本機執行、不回傳程式碼；購買資料由經銷商處理。提供者：${LEGAL_NAME_EN}。`,
      sections: [
        {
          h: '1. 負責單位',
          p: [`${LEGAL_NAME_EN}（${LEGAL_NAME_ZH}）負責本政策所述個人資料的處理。聯絡方式：${EMAIL}。`],
        },
        {
          h: '2. Vettalon 產品本身',
          p: [
            'Vettalon 在你的電腦上執行，預設不連網，也不回傳使用統計或遙測資料。你的程式碼與掃描報告存在你自己的機器上，不會傳給我們。',
            '你啟用 AI 審查時，程式碼片段會從你的機器直接送到你設定的模型供應商，這部分受該供應商的隱私權政策規範。使用本機 Ollama 等本機模型時，程式碼不會離開你的機器。',
            '選配的 Jev 模組排序功能預設關閉。開啟後只會把 metadata（檔案路徑、大小、git 修改熱度）送到 TypeSafe 的服務，不含程式碼內容。',
            '供應鏈獵捕模式會連到套件登錄處（crates.io、npm、PyPI、Go proxy）與 OSV 漏洞資料庫（api.osv.dev），只送出相依套件的名稱與版本號。',
          ],
        },
        {
          h: '3. 購買與授權',
          p: [
            '付款由我們的線上經銷商（Merchant of Record）處理，信用卡等付款資料由經銷商直接蒐集，我們看不到完整卡號。',
            '經銷商會提供我們以下資料：姓名、email、帳單國家、公司名稱（若有填寫）、訂單內容與授權資訊。我們用這些資料寄送授權金鑰、提供客服、處理退款，以及依法記帳。',
            '啟用授權時，以及之後每 30 天一次，App 會把授權金鑰、一組裝置識別值與 App 版本號送到經銷商的授權服務，用來核對授權是否有效與已啟用的裝置數。裝置識別值是把作業系統的電腦識別碼加上本產品專用前綴後做單向雜湊（SHA-256）得到的值，無法還原成原本的識別碼或硬體資訊，也不包含你的程式碼或檔案內容；讀不到電腦識別碼時，改用安裝時隨機產生的值。',
          ],
        },
        {
          h: '4. 官網',
          p: [
            '本官網不使用 cookie，也沒有載入第三方分析或廣告追蹤程式。',
            '網站主機（Google Cloud）會留存標準存取紀錄，例如 IP 位址、時間、瀏覽器資訊與請求的網址，用於資安防護與維運排錯。',
          ],
        },
        {
          h: '5. 來信聯絡',
          p: ['你寄 email 給我們時，我們會保存來信內容與你的 email 地址，用於回覆與後續服務。'],
        },
        {
          h: '6. 保存期間',
          p: [
            '訂單與帳務紀錄依台灣《商業會計法》等法規規定的期間保存（會計憑證至少 5 年）。客服往來信件在問題處理完畢後最多保存 2 年。網站存取紀錄依主機服務的設定保存，通常不超過 30 天。',
          ],
        },
        {
          h: '7. 資料分享與境外傳輸',
          p: [
            '我們不販售個人資料。只有在提供服務所需的範圍內，才會由經銷商、網站主機與 email 服務等受託廠商處理你的資料；依法令要求時，也可能提供給主管機關。',
            '這些廠商可能在台灣以外的地區處理資料，我們會選擇有適當資料保護措施的廠商。',
          ],
        },
        {
          h: '8. 你的權利',
          p: [
            '依台灣《個人資料保護法》第 3 條，你可以向我們請求查詢、閱覽、製給複製本、補充或更正、停止蒐集處理或利用，以及刪除你的個人資料。',
            '若你位於歐盟或英國，你也享有 GDPR 規定的資料可攜權與反對權等權利，並可向你所在地的資料保護主管機關申訴。',
            `行使上述權利，請寄信到 ${EMAIL}，我們會在 30 天內回覆。法定保存期間內的帳務資料無法刪除。`,
          ],
        },
        {
          h: '9. 政策變更',
          p: ['本政策修改時，會公布在本頁並更新生效日期；涉及資料用途的重大變更，會另外以 email 通知已購買的客戶。'],
        },
      ],
    },
    refund: {
      title: '退款政策',
      metaDescription: `Vettalon Pro 與 Team 首次購買及續訂，${P.refundDays} 天內可申請全額退款。`,
      sections: [
        {
          h: `${P.refundDays} 天全額退款`,
          p: [
            `Vettalon Pro 與 Vettalon Team 的首次購買，自付款日起 ${P.refundDays} 天內都可以申請全額退款，不需要說明原因。`,
            `Pro 的更新續訂與 Team 的年費續約，同樣在每次扣款後 ${P.refundDays} 天內可申請全額退款。`,
          ],
        },
        {
          h: '怎麼申請',
          p: [
            `寄信到 ${EMAIL}，附上訂單編號或購買時使用的 email。我們通常在 2 個工作天內處理。`,
            '退款由經銷商退回原付款方式，入帳時間依發卡銀行或付款方式而定，一般為 5 到 10 個工作天。',
          ],
        },
        {
          h: '退款後',
          p: ['退款完成後，對應的授權金鑰會失效，請移除已安裝的付費版本。開源核心不受影響，仍可依 Apache 2.0 繼續使用。'],
        },
        {
          h: `超過 ${P.refundDays} 天`,
          p: [
            `超過 ${P.refundDays} 天原則上不退款。但如果付費產品有重大缺陷，讓你無法正常使用，而我們在合理期間內沒有修好，你仍可來信，我們會個別處理退款。`,
          ],
        },
        {
          h: '取消自動續約',
          p: ['Team 年費與 Pro 更新續訂都可以隨時取消自動續約。取消後，當期結束前仍可正常使用。'],
        },
        {
          h: '法定權利',
          p: ['本政策不影響你依所在地消費者保護法規享有的權利。'],
        },
      ],
    },
  },

  en: {
    effective: 'Effective date',
    back: 'Back to home',
    terms: {
      title: 'Terms of Service',
      metaDescription: `Terms of Service for Vettalon paid products, provided by ${LEGAL_NAME_EN}.`,
      sections: [
        {
          h: '1. Scope and provider',
          p: [
            `These terms govern your purchase and use of the Vettalon website, Vettalon Pro and Vettalon Team (together, the "Paid Products"). The Paid Products are provided by ${LEGAL_NAME_EN} (${LEGAL_NAME_ZH}, "we", "us"), a company incorporated in Taiwan.`,
            `Contact: ${EMAIL}. By buying or using a Paid Product you agree to these terms. If you buy on behalf of a company or organisation, you confirm you are authorised to accept these terms for it.`,
          ],
        },
        {
          h: '2. Open-source core',
          p: [
            'The vettalon open-source core (the command-line auditor) is licensed under the Apache License 2.0, and that license governs its use. The payment, license-key and refund sections of these terms apply only to the Paid Products.',
          ],
        },
        {
          h: '3. Orders and payment',
          p: [
            'Orders for the Paid Products are processed by our online reseller, which acts as the Merchant of Record for the transaction. The reseller collects payment, issues your receipt, and calculates and remits sales tax or VAT for your location. The reseller is named on the checkout page and on your receipt, and its buyer terms also apply to your payment.',
            'Prices on this site are in US dollars and exclude tax. Businesses and government agencies in Taiwan can request a quote in New Taiwan dollars; the individual quote then applies.',
          ],
        },
        {
          h: '4. License',
          p: [
            `Vettalon Pro: a one-time payment gives one named user a perpetual license to install the product on up to ${P.proDevices} of their own devices. Versions released within ${P.updateMonths} months of purchase are included. After that, you can renew the update plan for ${P.proRenewal} per year to keep receiving new versions. If you don't renew, you can keep using the versions you already have, forever.`,
            `Vettalon Team: an annual subscription for up to ${P.teamSeats} named users within one organisation, including all updates and priority email support during the term. If the subscription expires without renewal, the Team license ends.`,
            'Your license key and download link are emailed to the address you used at checkout once payment completes.',
            'You may not resell, rent or distribute license keys, let more users or devices use the product than your license allows, or circumvent license checks. We retain all copyright and other intellectual property in the Paid Products; any right not expressly granted here is reserved.',
          ],
        },
        {
          h: '5. Lawful use',
          p: [
            'Use Vettalon only on code and systems you own or are explicitly authorised to test.',
            "Supply-chain hunting reviews the public source of published third-party packages. Vettalon only produces disclosure drafts and never sends them automatically. Whether and where to send a disclosure is your decision, and you are responsible for following each project's disclosure policy and applicable law.",
            "You may not use Vettalon to gain unauthorised access to anyone's systems or data, or for any unlawful purpose. Sandbox PoCs run in an isolated container on your own machine and must not be repurposed against third-party systems.",
          ],
        },
        {
          h: '6. Third-party AI models',
          p: [
            "AI review uses the model-provider account or API key you configure (for example Anthropic, OpenAI or Google), or a model running locally on your machine. Your relationship with, and any charges from, a model provider are governed by that provider's terms. Code snippets go straight from your machine to the provider you choose; we never receive them.",
          ],
        },
        {
          h: '7. Nature of results and disclaimer',
          p: [
            "AI and static analysis can miss issues and can report false positives. Vettalon's reports support human judgement. They do not guarantee that code is free of vulnerabilities and do not replace a qualified security professional.",
            'To the extent permitted by law, the Paid Products are provided "as is", without any express or implied warranty, including merchantability or fitness for a particular purpose.',
          ],
        },
        {
          h: '8. Limitation of liability',
          p: [
            'To the maximum extent permitted by law, our total liability to you is limited to the amount you actually paid for the relevant Paid Product in the 12 months before the event giving rise to the claim. We are not liable for indirect, incidental or consequential damages, including lost profits or lost data.',
            'Nothing in these terms excludes consumer rights that cannot be excluded under applicable law.',
          ],
        },
        {
          h: '9. Refunds',
          p: [`Refunds follow our Refund Policy: you can get a full refund within ${P.refundDays} days of your first purchase or of any renewal charge.`],
          link: { page: 'refund', label: 'Read the Refund Policy' },
        },
        {
          h: '10. Changes',
          p: [
            'We may update these terms. The updated version will be posted on this page with a new effective date, and material changes will be announced at least 14 days before they take effect. Later changes will never reduce the scope of a license you have already bought.',
          ],
        },
        {
          h: '11. Governing law and jurisdiction',
          p: [
            'These terms are governed by the laws of the Republic of China (Taiwan). The Taiwan Taipei District Court has jurisdiction as the court of first instance, without affecting any right a consumer has under applicable law to bring proceedings in their home courts.',
          ],
        },
      ],
    },
    privacy: {
      title: 'Privacy Policy',
      metaDescription: `How Vettalon handles your data: the product runs locally and never sends us your code; purchase data is handled by our reseller. Provided by ${LEGAL_NAME_EN}.`,
      sections: [
        {
          h: '1. Who is responsible',
          p: [`${LEGAL_NAME_EN} (${LEGAL_NAME_ZH}) is responsible for the personal data described in this policy. Contact: ${EMAIL}.`],
        },
        {
          h: '2. The Vettalon product',
          p: [
            "Vettalon runs on your computer, makes no network connections by default, and sends no usage statistics or telemetry. Your code and scan reports stay on your machine and are never sent to us.",
            "When you enable AI review, code snippets go straight from your machine to the model provider you configure, under that provider's privacy policy. With a local model such as Ollama, your code never leaves your machine.",
            'The optional Jev module ranker is off by default. When enabled, it sends only metadata (file paths, sizes, git change hotspots) to the TypeSafe service, never code content.',
            'Supply-chain hunting connects to package registries (crates.io, npm, PyPI, the Go proxy) and the OSV vulnerability database (api.osv.dev), sending only dependency names and versions.',
          ],
        },
        {
          h: '3. Purchases and licensing',
          p: [
            'Payments are processed by our online reseller (the Merchant of Record). The reseller collects card and other payment details directly; we never see your full card number.',
            'The reseller shares with us your name, email, billing country, company name (if provided), order details and license information. We use these to deliver your license key, provide support, handle refunds and keep legally required accounting records.',
            "When you activate a license, and then once every 30 days, the app sends the license key, a device identifier and the app version to the reseller's licensing service to check that the license is valid and how many devices are activated. The device identifier is a one-way SHA-256 hash of the operating system's computer identifier under a product-specific prefix; it cannot be turned back into that identifier or any hardware detail, and it contains none of your code or file contents. Where no computer identifier can be read, a value generated randomly at install time is used instead.",
          ],
        },
        {
          h: '4. This website',
          p: [
            'This website sets no cookies and loads no third-party analytics or advertising trackers.',
            'Our hosting provider (Google Cloud) keeps standard access logs, such as IP address, time, browser details and the requested URL, for security and troubleshooting.',
          ],
        },
        {
          h: '5. Emails',
          p: ['When you email us, we keep your message and email address to reply and to support you afterwards.'],
        },
        {
          h: '6. Retention',
          p: [
            "Order and accounting records are kept for the periods required by Taiwan law, including the Business Entity Accounting Act (at least 5 years for accounting vouchers). Support emails are kept for up to 2 years after the issue is resolved. Website access logs follow our hosting provider's settings, normally no longer than 30 days.",
          ],
        },
        {
          h: '7. Sharing and international transfers',
          p: [
            'We do not sell personal data. Your data is processed by service providers, such as our reseller, hosting provider and email provider, only as needed to provide the service, and may be disclosed to authorities where the law requires it.',
            'These providers may process data outside Taiwan. We choose providers with appropriate data-protection safeguards.',
          ],
        },
        {
          h: '8. Your rights',
          p: [
            "Under Article 3 of Taiwan's Personal Data Protection Act you may ask to access, review or obtain a copy of your personal data, supplement or correct it, have us stop collecting, processing or using it, and delete it.",
            'If you are in the EU or UK, you also have your GDPR rights, including data portability and the right to object, and you may complain to your local data-protection authority.',
            `To exercise these rights, email ${EMAIL}. We reply within 30 days. Accounting records still within their legal retention period cannot be deleted.`,
          ],
        },
        {
          h: '9. Changes',
          p: ['If we change this policy, we will post the update here with a new effective date. Material changes to how we use data will also be emailed to existing customers.'],
        },
      ],
    },
    refund: {
      title: 'Refund Policy',
      metaDescription: `Full refund within ${P.refundDays} days for Vettalon Pro and Team, on first purchase and on every renewal.`,
      sections: [
        {
          h: `${P.refundDays}-day full refund`,
          p: [
            `You can get a full refund on a first purchase of Vettalon Pro or Vettalon Team within ${P.refundDays} days of payment. No reason needed.`,
            `Pro update-plan renewals and Team annual renewals can also be fully refunded within ${P.refundDays} days of each charge.`,
          ],
        },
        {
          h: 'How to request',
          p: [
            `Email ${EMAIL} with your order number or the email address you used at checkout. We normally process requests within 2 business days.`,
            'The reseller returns the money to your original payment method. How long it takes to appear depends on your bank or payment method, usually 5 to 10 business days.',
          ],
        },
        {
          h: 'After a refund',
          p: ['Once refunded, the matching license key is deactivated; please remove the paid version. The open-source core is unaffected and remains available under Apache 2.0.'],
        },
        {
          h: `After ${P.refundDays} days`,
          p: [
            `As a rule we don't refund after ${P.refundDays} days. If a Paid Product has a serious defect that stops you using it and we fail to fix it within a reasonable time, email us anyway and we will handle a refund case by case.`,
          ],
        },
        {
          h: 'Cancelling auto-renewal',
          p: ['You can cancel auto-renewal for Team and for the Pro update plan at any time. You keep access until the end of the current period.'],
        },
        {
          h: 'Statutory rights',
          p: ['This policy does not affect your rights under the consumer-protection laws where you live.'],
        },
      ],
    },
  },
};

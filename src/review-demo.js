// Fictional teaching examples. These are not scan results or benchmark evidence.
export const REVIEW_STAGES = ['finder', 'verifier', 'human'];

export const reviewCopy = {
  zh: {
    label: '互動示意', title: '一個候選，如何被覆核？',
    disclaimer: '虛構程式碼案例，僅解說流程。不是實際掃描、產品報告或測試成績。',
    casesLabel: '選擇示意案例', stagesLabel: '選擇覆核階段', codeLabel: '示意程式碼',
    stages: ['Finder 找出候選', 'Verifier 試著駁倒', '人工 Review'],
    show: '展開判斷理由', hide: '收起判斷理由', next: '看下一階段', reset: '回到 Finder',
    fallback: '閱讀三個案例的完整說明', source: '示意檔案',
    cases: [
      { id: 'query', label: '字串拼接查詢', file: 'example/search.ts', category: 'CWE-89 · SQL injection',
        code: ['const id = request.query.id;', 'const sql = "SELECT * FROM users"', '  + " WHERE id = " + id;', 'return database.query(sql);'], highlight: [2, 3],
        states: [
          { status: '候選：輸入可能進入 SQL', title: '先把可疑路徑指出來。', body: 'Finder 看見請求輸入直接拼進 SQL 字串，提出注入候選。', reason: '來源是 request.query.id；資料經字串拼接後傳入 database.query。這一步只提出候選，還沒證明可利用性。' },
          { status: '保留候選：需要進一步驗證', title: '換個家族，試著推翻判斷。', body: 'Verifier 檢查中間是否存在參數化、轉義或固定值限制。示意片段沒有呈現這些保護。', reason: '在這段示意中，輸入到查詢的路徑仍成立。保留候選不等於已確認漏洞；還需查實際驅動、呼叫點與可到達性。' },
          { status: '待人工覆核', title: '證據交到人手上。', body: '人工確認可到達性、資料庫行為與影響範圍，再決定是否修補。', reason: '這個示意沒有執行 PoC。只有對真實專案補齊前置條件與重現證據，才能判定實際風險。' },
        ],
      },
      { id: 'parameter', label: '參數化查詢', file: 'example/account.ts', category: 'CWE-89 · SQL injection',
        code: ['const name = request.query.name;', 'return database.query(', '  "SELECT * FROM users WHERE name = ?",', '  [name],', ');'], highlight: [3, 4],
        states: [
          { status: '候選：輸入流向查詢', title: '有輸入，不一定有漏洞。', body: 'Finder 從輸入流向資料庫的線索提出候選，交給覆核繼續判讀。', reason: '僅看見外部輸入進入查詢 API，不能直接判定 SQL injection。仍需讀取 API 的參數語意。' },
          { status: '示意判定：駁回候選', title: '找到反證，就留下駁回理由。', body: 'Verifier 看見查詢文字與參數分開傳遞，在這個案例的 API 假設下駁回注入候選。', reason: '示意假設 database.query 正確實作 ? 參數綁定，name 會被當成資料值。真實覆核仍須確認驅動契約，不能只憑函式名稱推論。' },
          { status: '人工檢視駁回依據', title: '駁回也要能回頭檢查。', body: '人工可核對驅動與參數綁定契約，決定這份反證是否充分。', reason: '駁回結果應與理由一起保留。若真實 API 不提供參數綁定，或查詢在更早的路徑已被拼接，就應重新審查。' },
        ],
      },
      { id: 'access', label: '存取權限缺口', file: 'example/invoice.ts', category: 'CWE-862 · Authorization',
        code: ['app.get("/invoices/:id", async (req) => {', '  const invoice = await invoices.get(req.params.id);', '  return invoice;', '});'], highlight: [2, 3],
        states: [
          { status: '候選：資源讀取未見授權', title: '把看不到的保護也當成問題。', body: 'Finder 在路由片段中沒有看到發票擁有者或角色檢查，提出權限候選。', reason: '以請求 ID 讀取並回傳資源，但片段沒有顯示授權判斷。候選成立的前提是上游沒有其他保護。' },
          { status: '資訊不足：需要上下文', title: '證據不夠，就不要強下結論。', body: 'Verifier 無法從片段確認全域 middleware 或資料層是否已檢查權限。', reason: '缺少上下文不能當成已確認漏洞，也不能當成安全證明。應追查 middleware、資料層約束與租戶隔離。' },
          { status: '待人工補齊上下文', title: '把不確定的地方明確交接。', body: '人工追查授權邊界，確認不同使用者是否能取得不屬於自己的發票。', reason: '需要真實路由鏈、帳號權限與跨租戶測試才能判斷。此示意不假設任何測試已執行。' },
        ],
      },
    ],
  },
  en: {
    label: 'Interactive illustration', title: 'How does a candidate get reviewed?',
    disclaimer: 'Fictional code to explain the workflow. Not a live scan, product report or benchmark.',
    casesLabel: 'Choose an illustrative case', stagesLabel: 'Choose a review stage', codeLabel: 'Illustrative code',
    stages: ['Finder', 'Verifier', 'Human review'],
    show: 'Show the reasoning', hide: 'Hide the reasoning', next: 'Next stage', reset: 'Back to Finder',
    fallback: 'Read all three illustrated cases', source: 'Example file',
    cases: [
      { id: 'query', label: 'String-built query', file: 'example/search.ts', category: 'CWE-89 · SQL injection',
        code: ['const id = request.query.id;', 'const sql = "SELECT * FROM users"', '  + " WHERE id = " + id;', 'return database.query(sql);'], highlight: [2, 3],
        states: [
          { status: 'Candidate: input may reach SQL', title: 'First, identify a suspicious path.', body: 'The finder sees request input concatenated into a SQL string and proposes an injection candidate.', reason: 'request.query.id flows through string concatenation to database.query. This proposes a candidate; it does not establish exploitability.' },
          { status: 'Retained: further validation needed', title: 'A different family tries to refute it.', body: 'The verifier checks for parameter binding, escaping or a fixed-value constraint. None appears in this fragment.', reason: 'The illustrated input-to-query path remains. Retaining a candidate is not confirmation: the actual driver, call sites and reachability still need checking.' },
          { status: 'Needs human review', title: 'Hand the evidence to a person.', body: 'A human checks reachability, database behavior and impact before deciding on a fix.', reason: 'No PoC runs in this illustration. A real project needs verified prerequisites and reproduction evidence before actual risk can be determined.' },
        ],
      },
      { id: 'parameter', label: 'Parameterized query', file: 'example/account.ts', category: 'CWE-89 · SQL injection',
        code: ['const name = request.query.name;', 'return database.query(', '  "SELECT * FROM users WHERE name = ?",', '  [name],', ');'], highlight: [3, 4],
        states: [
          { status: 'Candidate: input reaches a query', title: 'Input alone does not make a bug.', body: 'The finder proposes a candidate from the input-to-database path and passes it on for review.', reason: 'External input entering a query API is not sufficient evidence of SQL injection. The API parameter contract still needs inspection.' },
          { status: 'Illustrated verdict: refuted', title: 'Record the counter-evidence.', body: 'The verifier sees query text and values passed separately, and refutes the candidate under this example’s API assumptions.', reason: 'This example assumes database.query implements ? binding correctly and treats name as a data value. A real review must check the driver contract, not infer safety from a function name.' },
          { status: 'Human checks the refutation', title: 'A refutation should be inspectable.', body: 'A human can verify the driver and parameter-binding contract, then judge whether that evidence is sufficient.', reason: 'Keep the reason alongside the verdict. Revisit the finding if the real API does not bind parameters or the query was already concatenated upstream.' },
        ],
      },
      { id: 'access', label: 'Missing access context', file: 'example/invoice.ts', category: 'CWE-862 · Authorization',
        code: ['app.get("/invoices/:id", async (req) => {', '  const invoice = await invoices.get(req.params.id);', '  return invoice;', '});'], highlight: [2, 3],
        states: [
          { status: 'Candidate: no visible authorization', title: 'Make the missing protection explicit.', body: 'The finder sees no owner or role check in this route fragment and proposes an authorization candidate.', reason: 'A request ID selects a resource that is returned without a visible permission check. The candidate assumes no upstream protection exists.' },
          { status: 'Insufficient context', title: 'Do not force a verdict.', body: 'The verifier cannot tell whether global middleware or the data layer already enforces authorization.', reason: 'Missing context is neither a confirmed vulnerability nor proof of safety. Check middleware, data constraints and tenant isolation.' },
          { status: 'Human context needed', title: 'Hand over the uncertainty, clearly.', body: 'A human traces the authorization boundary and checks whether a user can fetch someone else’s invoice.', reason: 'The real route chain, permissions and cross-tenant tests are needed. This illustration does not imply any test has run.' },
        ],
      },
    ],
  },
};

export const initialReviewState = { caseId: 'query', stage: 0, expanded: false };
export function reviewReducer(state, action) {
  switch (action.type) {
    case 'case':
      return reviewCopy.en.cases.some((c) => c.id === action.id)
        ? { caseId: action.id, stage: 0, expanded: false } : state;
    case 'stage':
      return Number.isInteger(action.stage) && action.stage >= 0 && action.stage < REVIEW_STAGES.length
        ? { ...state, stage: action.stage, expanded: false } : state;
    case 'reason': return { ...state, expanded: !state.expanded };
    case 'next': return { ...state, stage: (state.stage + 1) % REVIEW_STAGES.length, expanded: false };
    default: return state;
  }
}

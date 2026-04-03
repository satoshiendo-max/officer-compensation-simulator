/**
 * メインUI制御
 * 入力バリデーション、イベントハンドラ、結果表示
 */

document.addEventListener("DOMContentLoaded", () => {
  // イベントリスナー登録
  document
    .getElementById("simulateBtn")
    .addEventListener("click", handleSimulate);
  document.getElementById("pdfBtn").addEventListener("click", exportPDF);

  // タブ切り替え
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const tabId = e.target.dataset.tab;
      switchTab(tabId);
    });
  });

  // 金額入力のフォーマット
  document.getElementById("profit").addEventListener("blur", (e) => {
    const val = parseInt(e.target.value.replace(/,/g, ""));
    if (!isNaN(val)) {
      e.target.value = val.toLocaleString();
    }
  });
  document.getElementById("profit").addEventListener("focus", (e) => {
    e.target.value = e.target.value.replace(/,/g, "");
  });

  document.getElementById("otherIncome").addEventListener("blur", (e) => {
    const val = parseInt(e.target.value.replace(/,/g, ""));
    if (!isNaN(val) && val > 0) {
      e.target.value = val.toLocaleString();
    }
  });
  document.getElementById("otherIncome").addEventListener("focus", (e) => {
    e.target.value = e.target.value.replace(/,/g, "");
  });
});

/**
 * シミュレーション実行ハンドラ
 */
function handleSimulate() {
  // 入力値取得
  const profitStr = document.getElementById("profit").value.replace(/,/g, "");
  const profit = parseInt(profitStr);

  if (isNaN(profit) || profit <= 0) {
    alert("想定利益を正しく入力してください。");
    return;
  }

  const ageGroup = document.querySelector('input[name="ageGroup"]:checked').value;
  const hasSpouse = document.getElementById("hasSpouse").checked;
  const dependentsGeneral = parseInt(document.getElementById("dependentsGeneral").value) || 0;
  const dependentsSpecific = parseInt(document.getElementById("dependentsSpecific").value) || 0;
  const dependentsElderly = parseInt(document.getElementById("dependentsElderly").value) || 0;
  const otherIncomeStr = document.getElementById("otherIncome").value.replace(/,/g, "");
  const otherIncome = parseInt(otherIncomeStr) || 0;

  const params = {
    profit,
    ageGroup,
    hasSpouse,
    dependentsGeneral,
    dependentsSpecific,
    dependentsElderly,
    otherIncome,
  };

  // シミュレーション実行
  const results = runSimulation(params);

  // 結果表示
  displayResults(results);

  // 結果エリアを表示
  document.getElementById("resultSection").style.display = "block";

  // 結果エリアにスクロール
  document.getElementById("resultSection").scrollIntoView({ behavior: "smooth" });
}

/**
 * 結果を全タブに表示
 */
function displayResults(results) {
  displaySummary(results);
  displayCorpTable(results);
  displayIndividualResult(results);
  displayComparison(results);
  renderBurdenChart(results);
  renderBreakdownChart(results);
  renderComparisonChart(results);

  // 前提条件を表示
  displayConditions(results.params);

  // PDF用の日付
  document.getElementById("reportDate").textContent = new Date().toLocaleDateString("ja-JP");
}

/**
 * 前提条件を表示
 */
function displayConditions(params) {
  const ageLabels = {
    [AGE_GROUP.UNDER_40]: "40歳未満",
    [AGE_GROUP.AGE_40_64]: "40歳以上65歳未満",
    [AGE_GROUP.AGE_65_OVER]: "65歳以上",
  };

  let html = `
    <div class="condition-grid">
      <div class="condition-item">
        <span class="condition-label">想定利益</span>
        <span class="condition-value">${formatYen(params.profit)}</span>
      </div>
      <div class="condition-item">
        <span class="condition-label">年齢区分</span>
        <span class="condition-value">${ageLabels[params.ageGroup]}</span>
      </div>
      <div class="condition-item">
        <span class="condition-label">配偶者控除</span>
        <span class="condition-value">${params.hasSpouse ? "あり" : "なし"}</span>
      </div>
      <div class="condition-item">
        <span class="condition-label">扶養親族</span>
        <span class="condition-value">一般${params.dependentsGeneral}人 / 特定${params.dependentsSpecific}人 / 老人${params.dependentsElderly}人</span>
      </div>
      ${params.otherIncome > 0 ? `
      <div class="condition-item">
        <span class="condition-label">他の所得</span>
        <span class="condition-value">${formatYen(params.otherIncome)}</span>
      </div>` : ""}
    </div>
  `;
  document.getElementById("conditions").innerHTML = html;
}

/**
 * サマリー（最適額の提案）を表示
 */
function displaySummary(results) {
  const opt = results.optimal;
  const ind = results.individualResult;
  const diff = ind.totalBurden - opt.totalBurden;

  let html = `
    <div class="summary-cards">
      <div class="summary-card optimal">
        <div class="summary-icon">★</div>
        <div class="summary-title">最適な役員報酬額</div>
        <div class="summary-amount">${formatYen(opt.compensation)}</div>
        <div class="summary-detail">合計負担: ${formatYen(opt.totalBurden)}</div>
      </div>
      <div class="summary-card">
        <div class="summary-title">個人手取り</div>
        <div class="summary-amount">${formatYen(opt.result.netIncome)}</div>
        <div class="summary-detail">報酬 - 税金 - 社保（個人）</div>
      </div>
      <div class="summary-card">
        <div class="summary-title">法人内部留保</div>
        <div class="summary-amount">${formatYen(opt.result.corpRetainedEarnings)}</div>
        <div class="summary-detail">法人所得 - 法人税等</div>
      </div>
      ${diff > 0 ? `
      <div class="summary-card merit">
        <div class="summary-title">法人化メリット</div>
        <div class="summary-amount">${formatYen(diff)}</div>
        <div class="summary-detail">個人事業との負担差額</div>
      </div>` : `
      <div class="summary-card demerit">
        <div class="summary-title">法人化デメリット</div>
        <div class="summary-amount">${formatYen(Math.abs(diff))}</div>
        <div class="summary-detail">個人事業の方が負担が少ない</div>
      </div>`}
    </div>
  `;
  document.getElementById("summary").innerHTML = html;
}

/**
 * 法人パターン一覧表を表示
 */
function displayCorpTable(results) {
  const optComp = results.optimal.compensation;

  let html = `
    <div class="table-wrapper">
      <table class="result-table">
        <thead>
          <tr>
            <th>役員報酬</th>
            <th>法人税等</th>
            <th>所得税</th>
            <th>住民税</th>
            <th>社保（会社）</th>
            <th>社保（個人）</th>
            <th>合計負担</th>
            <th>個人手取り</th>
            <th>法人留保</th>
          </tr>
        </thead>
        <tbody>
  `;

  for (const r of results.corpResults) {
    const isOptimal =
      Math.abs(r.compensation - optComp) < 500000 &&
      r.compensation ===
        results.corpResults.reduce((closest, curr) =>
          Math.abs(curr.compensation - optComp) <
          Math.abs(closest.compensation - optComp)
            ? curr
            : closest
        ).compensation;

    html += `
      <tr class="${isOptimal ? "optimal-row" : ""}">
        <td class="num">${formatYen(r.compensation)}</td>
        <td class="num">${formatYen(r.corpTaxes.total)}</td>
        <td class="num">${formatYen(r.incomeTax)}</td>
        <td class="num">${formatYen(r.residentTax)}</td>
        <td class="num">${formatYen(r.socialInsurance.totalEmployer)}</td>
        <td class="num">${formatYen(r.socialInsurance.totalEmployee)}</td>
        <td class="num total">${formatYen(r.totalBurden)}</td>
        <td class="num net">${formatYen(r.netIncome)}</td>
        <td class="num">${formatYen(r.corpRetainedEarnings)}</td>
      </tr>
    `;
  }

  html += `</tbody></table></div>`;
  document.getElementById("corpTable").innerHTML = html;
}

/**
 * 個人事業パターンを表示
 */
function displayIndividualResult(results) {
  const r = results.individualResult;

  let html = `
    <div class="individual-result">
      <h4>個人事業（青色申告65万円控除適用）</h4>
      <div class="table-wrapper">
        <table class="result-table detail-table">
          <tbody>
            <tr><td>事業所得</td><td class="num">${formatYen(r.businessIncome)}</td></tr>
            <tr><td>所得税（復興税含む）</td><td class="num">${formatYen(r.incomeTax)}</td></tr>
            <tr><td>住民税</td><td class="num">${formatYen(r.residentTax)}</td></tr>
            <tr><td>個人事業税</td><td class="num">${formatYen(r.businessTax)}</td></tr>
            <tr><td>国民健康保険</td><td class="num">${formatYen(r.nationalHealthIns.total)}</td></tr>
            <tr><td>　内訳：医療分</td><td class="num sub">${formatYen(r.nationalHealthIns.medical)}</td></tr>
            <tr><td>　内訳：支援金分</td><td class="num sub">${formatYen(r.nationalHealthIns.support)}</td></tr>
            <tr><td>　内訳：介護分</td><td class="num sub">${formatYen(r.nationalHealthIns.nursing)}</td></tr>
            <tr><td>国民年金</td><td class="num">${formatYen(r.nationalPension)}</td></tr>
            <tr class="total-row"><td><strong>合計負担</strong></td><td class="num"><strong>${formatYen(r.totalBurden)}</strong></td></tr>
            <tr class="net-row"><td><strong>手取り</strong></td><td class="num"><strong>${formatYen(r.netIncome)}</strong></td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
  document.getElementById("individualResult").innerHTML = html;
}

/**
 * 法人 vs 個人事業の比較を表示
 */
function displayComparison(results) {
  const opt = results.optimal;
  const ind = results.individualResult;
  const diff = ind.totalBurden - opt.totalBurden;

  const corpTaxTotal =
    opt.result.corpTaxes.total + opt.result.incomeTax + opt.result.residentTax;
  const indTaxTotal =
    ind.incomeTax + ind.residentTax + ind.businessTax;

  const corpInsTotal = opt.result.socialInsurance.grandTotal;
  const indInsTotal = ind.nationalHealthIns.total + ind.nationalPension;

  let html = `
    <div class="table-wrapper">
      <table class="result-table comparison-table">
        <thead>
          <tr>
            <th>項目</th>
            <th>法人<br>（報酬${formatYen(opt.compensation)}）</th>
            <th>個人事業</th>
            <th>差額</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>税金合計</td>
            <td class="num">${formatYen(corpTaxTotal)}</td>
            <td class="num">${formatYen(indTaxTotal)}</td>
            <td class="num ${corpTaxTotal < indTaxTotal ? "merit-text" : "demerit-text"}">${formatDiff(indTaxTotal - corpTaxTotal)}</td>
          </tr>
          <tr>
            <td>社会保険料合計</td>
            <td class="num">${formatYen(corpInsTotal)}</td>
            <td class="num">${formatYen(indInsTotal)}</td>
            <td class="num ${corpInsTotal < indInsTotal ? "merit-text" : "demerit-text"}">${formatDiff(indInsTotal - corpInsTotal)}</td>
          </tr>
          <tr class="total-row">
            <td><strong>合計負担</strong></td>
            <td class="num"><strong>${formatYen(opt.totalBurden)}</strong></td>
            <td class="num"><strong>${formatYen(ind.totalBurden)}</strong></td>
            <td class="num ${diff > 0 ? "merit-text" : "demerit-text"}"><strong>${formatDiff(diff)}</strong></td>
          </tr>
          <tr class="net-row">
            <td><strong>手取り合計</strong></td>
            <td class="num"><strong>${formatYen(opt.result.netIncome + opt.result.corpRetainedEarnings)}</strong></td>
            <td class="num"><strong>${formatYen(ind.netIncome)}</strong></td>
            <td class="num"></td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="comparison-note">
      ${diff > 0
        ? `<p class="merit-message">法人化により年間約<strong>${formatYen(diff)}</strong>の負担軽減が見込めます。</p>`
        : `<p class="demerit-message">現時点では個人事業の方が年間約<strong>${formatYen(Math.abs(diff))}</strong>負担が少ない試算です。</p>`
      }
    </div>
  `;
  document.getElementById("comparison").innerHTML = html;
}

/**
 * タブ切り替え
 */
function switchTab(tabId) {
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === tabId);
  });
  document.querySelectorAll(".tab-content").forEach((content) => {
    content.classList.toggle("active", content.id === tabId);
  });
}

/**
 * 金額フォーマット（円表示）
 */
function formatYen(amount) {
  if (amount === undefined || amount === null) return "-";
  return Math.floor(amount).toLocaleString() + "円";
}

/**
 * 差額フォーマット
 */
function formatDiff(amount) {
  if (amount > 0) return "+" + formatYen(amount);
  if (amount < 0) return "-" + formatYen(Math.abs(amount));
  return "0円";
}

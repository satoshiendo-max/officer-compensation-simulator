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

  // PDF復元用にグローバル保存
  window._lastSimulationResults = results;

  // 結果表示
  displayResults(results);

  // 結果エリアを表示
  document.getElementById("resultSection").style.display = "block";

  // 全タブを一巡してグラフを描画させる（PDF出力用）
  ensureAllChartsRendered(() => {
    // 一覧表タブに戻す
    switchTab("tabTable");
    // 結果エリアにスクロール
    document.getElementById("resultSection").scrollIntoView({ behavior: "smooth" });
  });
}

/**
 * 全タブを順番に表示してChart.jsを描画させる
 */
function ensureAllChartsRendered(callback) {
  const tabs = ["tabTable", "tabIndividual", "tabComparison", "tabChart"];
  let i = 0;

  function showNext() {
    if (i < tabs.length) {
      switchTab(tabs[i]);
      i++;
      setTimeout(showNext, 50);
    } else {
      if (callback) callback();
    }
  }
  showNext();
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
      <tr class="${isOptimal ? "optimal-row" : ""} clickable-row" data-comp="${r.compensation}" title="クリックで計算ロジックを表示">
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

  html += `</tbody></table></div>
    <p class="click-hint">※ 行をクリックすると計算ロジックの詳細を表示します</p>`;
  document.getElementById("corpTable").innerHTML = html;

  // 行クリックイベント
  document.querySelectorAll(".clickable-row").forEach((row) => {
    row.addEventListener("click", () => {
      const comp = parseInt(row.dataset.comp);
      const r = results.corpResults.find((r) => r.compensation === comp);
      if (r) {
        displayLogicDetail(r, results.params, results.individualResult);
        switchTab("tabLogic");
      }
    });
  });
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
 * 計算ロジック詳細を表示
 */
function displayLogicDetail(r, params, indResult) {
  const profit = params.profit;
  const monthlyComp = Math.floor(r.compensation / 12);
  const si = r.socialInsurance;

  let html = `
    <div class="logic-detail">
      <h3>計算ロジック詳細｜役員報酬 ${formatYen(r.compensation)} の場合</h3>

      <!-- ===== STEP 1: 社会保険料 ===== -->
      <div class="logic-section">
        <h4>STEP 1. 社会保険料の計算</h4>
        <table class="logic-table">
          <tr class="logic-formula"><td colspan="3">月額報酬 = ${formatYen(r.compensation)} / 12 = <strong>${formatYen(monthlyComp)}</strong></td></tr>
          <tr class="logic-formula"><td colspan="3">健保 標準報酬月額 = <strong>${formatYen(si.healthStandardMonthly)}</strong>（等級表より）</td></tr>
          <tr class="logic-formula"><td colspan="3">厚年 標準報酬月額 = <strong>${formatYen(si.pensionStandardMonthly)}</strong>（等級表より、上限65万円）</td></tr>
          <tr><td></td><td class="logic-head">個人負担（年額）</td><td class="logic-head">会社負担（年額）</td></tr>
          <tr>
            <td>健康保険料</td>
            <td class="num">${formatYen(si.healthStandardMonthly)} x ${HEALTH_INSURANCE.halfRate} x 12 = ${formatYen(si.healthEmployee)}</td>
            <td class="num">${formatYen(si.healthEmployer)}</td>
          </tr>
          ${si.nursingEmployee > 0 ? `
          <tr>
            <td>介護保険料</td>
            <td class="num">${formatYen(si.healthStandardMonthly)} x ${HEALTH_INSURANCE.nursingHalfRate} x 12 = ${formatYen(si.nursingEmployee)}</td>
            <td class="num">${formatYen(si.nursingEmployer)}</td>
          </tr>` : `
          <tr><td>介護保険料</td><td class="num">対象外（年齢区分）</td><td class="num">-</td></tr>`}
          <tr>
            <td>厚生年金保険料</td>
            <td class="num">${formatYen(si.pensionStandardMonthly)} x ${PENSION_INSURANCE.halfRate} x 12 = ${formatYen(si.pensionEmployee)}</td>
            <td class="num">${formatYen(si.pensionEmployer)}</td>
          </tr>
          <tr class="total-row">
            <td><strong>社保合計</strong></td>
            <td class="num"><strong>${formatYen(si.totalEmployee)}</strong></td>
            <td class="num"><strong>${formatYen(si.totalEmployer)}</strong></td>
          </tr>
        </table>
      </div>

      <!-- ===== STEP 2: 法人税等 ===== -->
      <div class="logic-section">
        <h4>STEP 2. 法人所得・法人税等の計算</h4>
        <table class="logic-table">
          <tr class="logic-formula"><td colspan="2">法人所得 = 想定利益 - 役員報酬 - 社保会社負担</td></tr>
          <tr class="logic-formula"><td colspan="2">= ${formatYen(profit)} - ${formatYen(r.compensation)} - ${formatYen(si.totalEmployer)} = <strong>${formatYen(r.corpIncome)}</strong></td></tr>
          <tr><td></td><td></td></tr>
          <tr>
            <td>法人税${r.corpIncome <= 8000000 ? "（800万以下: 15%）" : "（800万以下15% + 超過23.2%）"}</td>
            <td class="num">${formatYen(r.corpTaxes.corpTax)}</td>
          </tr>
          <tr>
            <td>地方法人税（法人税額 x 10.3%）</td>
            <td class="num">${formatYen(r.corpTaxes.corpTax)} x 10.3% = ${formatYen(r.corpTaxes.localCorpTax)}</td>
          </tr>
          <tr>
            <td>法人住民税 法人税割（法人税額 x 7%）</td>
            <td class="num">${formatYen(r.corpTaxes.corpTax)} x 7% = ${formatYen(r.corpTaxes.municipalIncomeTax)}</td>
          </tr>
          <tr>
            <td>法人住民税 均等割</td>
            <td class="num">${formatYen(r.corpTaxes.municipalPerCapita)}</td>
          </tr>
          <tr>
            <td>法人事業税${r.corpIncome <= 4000000 ? "（400万以下: 3.5%）" : r.corpIncome <= 8000000 ? "（400万以下3.5% + 超過5.3%）" : "（400万以下3.5% + 800万以下5.3% + 超過7.0%）"}</td>
            <td class="num">${formatYen(r.corpTaxes.businessTax)}</td>
          </tr>
          <tr>
            <td>特別法人事業税（事業税額 x 37%）</td>
            <td class="num">${formatYen(r.corpTaxes.businessTax)} x 37% = ${formatYen(r.corpTaxes.specialBusinessTax)}</td>
          </tr>
          <tr class="total-row">
            <td><strong>法人税等 合計</strong></td>
            <td class="num"><strong>${formatYen(r.corpTaxes.total)}</strong></td>
          </tr>
          <tr class="net-row">
            <td><strong>法人内部留保（税引後）</strong></td>
            <td class="num"><strong>${formatYen(r.corpIncome)} - ${formatYen(r.corpTaxes.total)} = ${formatYen(r.corpRetainedEarnings)}</strong></td>
          </tr>
        </table>
      </div>

      <!-- ===== STEP 3: 個人の所得税・住民税 ===== -->
      <div class="logic-section">
        <h4>STEP 3. 個人の所得税・住民税の計算</h4>
        <table class="logic-table">
          <tr class="logic-formula"><td colspan="2">給与所得控除 = <strong>${formatYen(r.salaryDeduction)}</strong>（給与所得控除表より）</td></tr>
          <tr class="logic-formula"><td colspan="2">給与所得 = ${formatYen(r.compensation)} - ${formatYen(r.salaryDeduction)} = <strong>${formatYen(r.salaryIncome)}</strong></td></tr>
          <tr><td></td><td></td></tr>
          <tr><td colspan="2"><strong>【所得控除の内訳】</strong></td></tr>
          <tr>
            <td>基礎控除</td>
            <td class="num">${formatYen(DEDUCTIONS.basic)}</td>
          </tr>
          ${params.hasSpouse ? `<tr><td>配偶者控除</td><td class="num">${formatYen(DEDUCTIONS.spouseRegular)}</td></tr>` : ""}
          ${params.dependentsGeneral > 0 ? `<tr><td>一般扶養控除（${params.dependentsGeneral}人）</td><td class="num">${formatYen(DEDUCTIONS.dependentGeneral)} x ${params.dependentsGeneral} = ${formatYen(DEDUCTIONS.dependentGeneral * params.dependentsGeneral)}</td></tr>` : ""}
          ${params.dependentsSpecific > 0 ? `<tr><td>特定扶養控除（${params.dependentsSpecific}人）</td><td class="num">${formatYen(DEDUCTIONS.dependentSpecific)} x ${params.dependentsSpecific} = ${formatYen(DEDUCTIONS.dependentSpecific * params.dependentsSpecific)}</td></tr>` : ""}
          ${params.dependentsElderly > 0 ? `<tr><td>老人扶養控除（${params.dependentsElderly}人）</td><td class="num">${formatYen(DEDUCTIONS.dependentElderly)} x ${params.dependentsElderly} = ${formatYen(DEDUCTIONS.dependentElderly * params.dependentsElderly)}</td></tr>` : ""}
          <tr>
            <td>社会保険料控除</td>
            <td class="num">${formatYen(si.totalEmployee)}</td>
          </tr>
          <tr class="total-row">
            <td><strong>所得控除 合計</strong></td>
            <td class="num"><strong>${formatYen(r.personalDeductions)}</strong></td>
          </tr>
          <tr><td></td><td></td></tr>
          <tr class="logic-formula"><td colspan="2">課税所得 = ${formatYen(r.salaryIncome)}${params.otherIncome > 0 ? " + " + formatYen(params.otherIncome) : ""} - ${formatYen(r.personalDeductions)} = <strong>${formatYen(r.taxableIncome)}</strong></td></tr>
          <tr><td></td><td></td></tr>
          <tr>
            <td>所得税（税率表より）x 1.021（復興税）</td>
            <td class="num"><strong>${formatYen(r.incomeTax)}</strong></td>
          </tr>
          <tr>
            <td>住民税（${formatYen(r.taxableIncome)} x 10% + 均等割5,000円）</td>
            <td class="num"><strong>${formatYen(r.residentTax)}</strong></td>
          </tr>
        </table>
      </div>

      <!-- ===== STEP 4: 合計 ===== -->
      <div class="logic-section">
        <h4>STEP 4. 合計負担額・手取り</h4>
        <table class="logic-table">
          <tr>
            <td>法人税等</td>
            <td class="num">${formatYen(r.corpTaxes.total)}</td>
          </tr>
          <tr>
            <td>所得税</td>
            <td class="num">${formatYen(r.incomeTax)}</td>
          </tr>
          <tr>
            <td>住民税</td>
            <td class="num">${formatYen(r.residentTax)}</td>
          </tr>
          <tr>
            <td>社保（会社負担 + 個人負担）</td>
            <td class="num">${formatYen(si.totalEmployer)} + ${formatYen(si.totalEmployee)} = ${formatYen(si.grandTotal)}</td>
          </tr>
          <tr class="total-row">
            <td><strong>合計負担額</strong></td>
            <td class="num"><strong>${formatYen(r.totalBurden)}</strong></td>
          </tr>
          <tr class="net-row">
            <td><strong>個人手取り</strong>（報酬 - 所得税 - 住民税 - 社保個人負担）</td>
            <td class="num"><strong>${formatYen(r.netIncome)}</strong></td>
          </tr>
        </table>
      </div>

      <div class="logic-back">
        <button class="btn btn-secondary" onclick="switchTab('tabTable')">一覧表に戻る</button>
      </div>
    </div>
  `;

  document.getElementById("logicDetail").innerHTML = html;
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

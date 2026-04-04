/**
 * グラフ描画（Chart.js）
 */

let burdenChart = null;
let breakdownChart = null;
let comparisonChart = null;
let bonusSavingChart = null;

/**
 * 数値をフォーマット（万円表示）
 */
function toMan(value) {
  return Math.round(value / 10000);
}

/**
 * 役員報酬額 vs 合計負担額の折れ線グラフ
 */
function renderBurdenChart(results) {
  const ctx = document.getElementById("burdenChart").getContext("2d");

  if (burdenChart) burdenChart.destroy();

  const labels = results.corpResults.map(
    (r) => toMan(r.compensation) + "万"
  );
  const totalBurdenData = results.corpResults.map((r) => toMan(r.totalBurden));
  const netIncomeData = results.corpResults.map((r) => toMan(r.netIncome));
  const corpRetainedData = results.corpResults.map(
    (r) => toMan(r.corpRetainedEarnings)
  );

  burdenChart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "合計負担額",
          data: totalBurdenData,
          borderColor: "#e74c3c",
          backgroundColor: "rgba(231, 76, 60, 0.1)",
          borderWidth: 2,
          tension: 0.3,
          fill: false,
        },
        {
          label: "個人手取り",
          data: netIncomeData,
          borderColor: "#2ecc71",
          backgroundColor: "rgba(46, 204, 113, 0.1)",
          borderWidth: 2,
          tension: 0.3,
          fill: false,
        },
        {
          label: "法人内部留保",
          data: corpRetainedData,
          borderColor: "#3498db",
          backgroundColor: "rgba(52, 152, 219, 0.1)",
          borderWidth: 2,
          tension: 0.3,
          fill: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: "役員報酬額による負担・手取りの変化",
          font: { size: 16, family: "'Noto Sans JP', sans-serif" },
        },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y}万円`,
          },
        },
      },
      scales: {
        x: {
          title: { display: true, text: "役員報酬額" },
        },
        y: {
          title: { display: true, text: "金額（万円）" },
          ticks: {
            callback: (v) => v + "万",
          },
        },
      },
    },
  });
}

/**
 * 負担内訳の積み上げ棒グラフ
 */
function renderBreakdownChart(results) {
  const ctx = document.getElementById("breakdownChart").getContext("2d");

  if (breakdownChart) breakdownChart.destroy();

  const labels = results.corpResults
    .filter((_, i) => i % 2 === 0 || i === results.corpResults.length - 1)
    .map((r) => toMan(r.compensation) + "万");

  const filtered = results.corpResults.filter(
    (_, i) => i % 2 === 0 || i === results.corpResults.length - 1
  );

  breakdownChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "法人税等",
          data: filtered.map((r) => toMan(r.corpTaxes.total)),
          backgroundColor: "#3498db",
        },
        {
          label: "所得税",
          data: filtered.map((r) => toMan(r.incomeTax)),
          backgroundColor: "#e74c3c",
        },
        {
          label: "住民税",
          data: filtered.map((r) => toMan(r.residentTax)),
          backgroundColor: "#f39c12",
        },
        {
          label: "社保（会社負担）",
          data: filtered.map((r) => toMan(r.socialInsurance.totalEmployer)),
          backgroundColor: "#9b59b6",
        },
        {
          label: "社保（個人負担）",
          data: filtered.map((r) => toMan(r.socialInsurance.totalEmployee)),
          backgroundColor: "#1abc9c",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: "負担内訳の構成",
          font: { size: 16, family: "'Noto Sans JP', sans-serif" },
        },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y}万円`,
          },
        },
      },
      scales: {
        x: { stacked: true, title: { display: true, text: "役員報酬額" } },
        y: {
          stacked: true,
          title: { display: true, text: "金額（万円）" },
          ticks: { callback: (v) => v + "万" },
        },
      },
    },
  });
}

/**
 * 法人 vs 個人事業の比較棒グラフ
 */
function renderComparisonChart(results) {
  const ctx = document.getElementById("comparisonChart").getContext("2d");

  if (comparisonChart) comparisonChart.destroy();

  const optResult = results.optimal.result;
  const indResult = results.individualResult;

  comparisonChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: [
        `法人（報酬${toMan(results.optimal.compensation)}万円）`,
        "個人事業",
      ],
      datasets: [
        {
          label: "税金",
          data: [
            toMan(
              optResult.corpTaxes.total +
                optResult.incomeTax +
                optResult.residentTax
            ),
            toMan(
              indResult.incomeTax +
                indResult.residentTax +
                indResult.businessTax
            ),
          ],
          backgroundColor: "#e74c3c",
        },
        {
          label: "社会保険料",
          data: [
            toMan(optResult.socialInsurance.grandTotal),
            toMan(indResult.nationalHealthIns.total + indResult.nationalPension),
          ],
          backgroundColor: "#3498db",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: "法人 vs 個人事業　負担比較",
          font: { size: 16, family: "'Noto Sans JP', sans-serif" },
        },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y}万円`,
          },
        },
      },
      scales: {
        x: { stacked: true },
        y: {
          stacked: true,
          ticks: { callback: (v) => v + "万" },
        },
      },
    },
  });
}

/**
 * 賞与活用による節約額グラフ
 */
function renderBonusSavingChart(results) {
  const ctx = document.getElementById("bonusSavingChart");
  if (!ctx) return;

  if (bonusSavingChart) {
    bonusSavingChart.destroy();
  }

  const bonusResults = window._lastBonusResults;
  if (!bonusResults || bonusResults.length === 0) return;

  const labels = bonusResults.map((r) => toMan(r.totalComp) + "万");
  const savingData = bonusResults.map((r) => toMan(r.saving));
  const monthlyOnlySI = bonusResults.map((r) => toMan(r.monthlyOnly.socialInsurance.grandTotal));
  const bonusSI = bonusResults.map((r) =>
    r.bestBonus ? toMan(r.bestBonus.socialInsurance.grandTotal) : toMan(r.monthlyOnly.socialInsurance.grandTotal)
  );

  bonusSavingChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "月額のみ 社保合計",
          data: monthlyOnlySI,
          backgroundColor: "rgba(220, 53, 69, 0.6)",
          borderColor: "rgba(220, 53, 69, 1)",
          borderWidth: 1,
          order: 2,
        },
        {
          label: "賞与活用 社保合計",
          data: bonusSI,
          backgroundColor: "rgba(40, 167, 69, 0.6)",
          borderColor: "rgba(40, 167, 69, 1)",
          borderWidth: 1,
          order: 2,
        },
        {
          label: "節約額",
          data: savingData,
          type: "line",
          borderColor: "#f59e0b",
          backgroundColor: "rgba(245, 158, 11, 0.1)",
          borderWidth: 3,
          pointRadius: 5,
          pointBackgroundColor: "#f59e0b",
          fill: true,
          yAxisID: "y1",
          order: 1,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: "賞与活用による社会保険料の比較（万円）",
          font: { size: 14 },
        },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y.toLocaleString()}万円`,
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: "社保合計（万円）" },
        },
        y1: {
          position: "right",
          beginAtZero: true,
          title: { display: true, text: "節約額（万円）" },
          grid: { drawOnChartArea: false },
        },
      },
    },
  });
}

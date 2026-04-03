/**
 * PDF出力
 * html2pdf.jsを使用して帳票エリアをPDF化
 */

/**
 * PDF出力実行
 */
function exportPDF() {
  const element = document.getElementById("report");
  if (!element) {
    alert("シミュレーション結果がありません。先にシミュレーションを実行してください。");
    return;
  }

  // 1. Chart.jsのcanvasを画像に変換してDOMから一時的に差し替え
  const chartContainers = element.querySelectorAll(".chart-container");
  const restoreData = [];

  chartContainers.forEach((container) => {
    const canvas = container.querySelector("canvas");
    if (canvas) {
      const chartInstance = Chart.getChart(canvas);
      if (chartInstance) {
        // canvasの内容を画像として取得
        const imgSrc = chartInstance.toBase64Image("image/png", 1.0);
        // 元のHTMLを保存
        const originalHTML = container.innerHTML;
        // canvasをimg要素に完全に置き換え
        container.innerHTML = `<img src="${imgSrc}" style="width:100%; max-height:380px; object-fit:contain;">`;
        restoreData.push({ container, originalHTML, chartInstance });
      }
    }
  });

  // 2. 全タブを表示状態にする
  element.classList.add("pdf-exporting");

  // 3. 少し待ってからPDF生成
  setTimeout(() => {
    const opt = {
      margin: [10, 10, 15, 10],
      filename: `役員報酬シミュレーション_${formatDate(new Date())}.pdf`,
      image: { type: "jpeg", quality: 0.95 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        letterRendering: true,
        logging: false,
      },
      jsPDF: {
        unit: "mm",
        format: "a4",
        orientation: "portrait",
      },
      pagebreak: { mode: ["avoid-all", "css", "legacy"] },
    };

    html2pdf()
      .set(opt)
      .from(element)
      .save()
      .then(() => {
        restoreChartsAfterPDF(restoreData);
        element.classList.remove("pdf-exporting");
      })
      .catch((err) => {
        restoreChartsAfterPDF(restoreData);
        element.classList.remove("pdf-exporting");
        console.error("PDF出力エラー:", err);
        alert("PDF出力中にエラーが発生しました。");
      });
  }, 500);
}

/**
 * PDF出力後にChart.jsのcanvasを復元・再描画
 */
function restoreChartsAfterPDF(restoreData) {
  restoreData.forEach(({ container, originalHTML }) => {
    container.innerHTML = originalHTML;
  });

  // Chart.jsを再描画（canvasが新しいDOM要素になったため）
  const lastResults = window._lastSimulationResults;
  if (lastResults) {
    renderBurdenChart(lastResults);
    renderBreakdownChart(lastResults);
    renderComparisonChart(lastResults);
  }
}

/**
 * 日付フォーマット（YYYYMMDD）
 */
function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

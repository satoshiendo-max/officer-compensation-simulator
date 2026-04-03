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

  // PDF出力中のスタイル調整
  element.classList.add("pdf-exporting");

  const opt = {
    margin: [10, 10, 15, 10],
    filename: `役員報酬シミュレーション_${formatDate(new Date())}.pdf`,
    image: { type: "jpeg", quality: 0.98 },
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
      element.classList.remove("pdf-exporting");
    })
    .catch((err) => {
      element.classList.remove("pdf-exporting");
      console.error("PDF出力エラー:", err);
      alert("PDF出力中にエラーが発生しました。");
    });
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

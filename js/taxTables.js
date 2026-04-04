/**
 * 税率テーブル・定数データ
 * 2026年度版（2025年度ベース）
 * ※年度更新時はこのファイルのみ修正
 */

// ===== 所得税率テーブル =====
const INCOME_TAX_BRACKETS = [
  { lower: 0, upper: 1950000, rate: 0.05, deduction: 0 },
  { lower: 1950000, upper: 3300000, rate: 0.10, deduction: 97500 },
  { lower: 3300000, upper: 6950000, rate: 0.20, deduction: 427500 },
  { lower: 6950000, upper: 9000000, rate: 0.23, deduction: 636000 },
  { lower: 9000000, upper: 18000000, rate: 0.33, deduction: 1536000 },
  { lower: 18000000, upper: 40000000, rate: 0.40, deduction: 2796000 },
  { lower: 40000000, upper: Infinity, rate: 0.45, deduction: 4796000 },
];

// 復興特別所得税率
const RECONSTRUCTION_TAX_RATE = 0.021;

// ===== 給与所得控除テーブル =====
const SALARY_DEDUCTION_BRACKETS = [
  { lower: 0, upper: 1625000, calc: (s) => 550000 },
  { lower: 1625001, upper: 1800000, calc: (s) => s * 0.40 - 100000 },
  { lower: 1800001, upper: 3600000, calc: (s) => s * 0.30 + 80000 },
  { lower: 3600001, upper: 6600000, calc: (s) => s * 0.20 + 440000 },
  { lower: 6600001, upper: 8500000, calc: (s) => s * 0.10 + 1100000 },
  { lower: 8500001, upper: Infinity, calc: (s) => 1950000 },
];

// ===== 法人税関連 =====
const CORP_TAX = {
  // 法人税率（中小法人）
  brackets: [
    { upper: 8000000, rate: 0.15 },
    { upper: Infinity, rate: 0.232 },
  ],
  // 地方法人税率
  localCorpTaxRate: 0.103,
  // 法人住民税均等割（東京都特別区・資本金1000万以下・従業員50人以下）
  municipalPerCapita: 70000,
  // 法人住民税法人税割（東京都特別区）
  municipalTaxRate: 0.07,
  // 法人事業税（所得割・外形標準非該当）
  businessTax: [
    { upper: 4000000, rate: 0.035 },
    { upper: 8000000, rate: 0.053 },
    { upper: Infinity, rate: 0.070 },
  ],
  // 特別法人事業税率
  specialBusinessTaxRate: 0.37,
};

// ===== 住民税 =====
const RESIDENT_TAX = {
  rate: 0.10, // 所得割
  perCapita: 5000, // 均等割
};

// ===== 協会けんぽ東京（2025年度ベース） =====
const HEALTH_INSURANCE = {
  rate: 0.09980, // 健康保険料率（全体）
  halfRate: 0.04990, // 折半
  nursingRate: 0.01600, // 介護保険料率（全体）
  nursingHalfRate: 0.00800, // 折半
};

const PENSION_INSURANCE = {
  rate: 0.18300, // 厚生年金保険料率（全体）
  halfRate: 0.09150, // 折半
};

// ===== 標準報酬月額テーブル（健康保険） =====
const HEALTH_STANDARD_MONTHLY = [
  { grade: 1, monthly: 58000, lower: 0, upper: 63000 },
  { grade: 2, monthly: 68000, lower: 63000, upper: 73000 },
  { grade: 3, monthly: 78000, lower: 73000, upper: 83000 },
  { grade: 4, monthly: 88000, lower: 83000, upper: 93000 },
  { grade: 5, monthly: 98000, lower: 93000, upper: 101000 },
  { grade: 6, monthly: 104000, lower: 101000, upper: 107000 },
  { grade: 7, monthly: 110000, lower: 107000, upper: 114000 },
  { grade: 8, monthly: 118000, lower: 114000, upper: 122000 },
  { grade: 9, monthly: 126000, lower: 122000, upper: 130000 },
  { grade: 10, monthly: 134000, lower: 130000, upper: 138000 },
  { grade: 11, monthly: 142000, lower: 138000, upper: 146000 },
  { grade: 12, monthly: 150000, lower: 146000, upper: 155000 },
  { grade: 13, monthly: 160000, lower: 155000, upper: 165000 },
  { grade: 14, monthly: 170000, lower: 165000, upper: 175000 },
  { grade: 15, monthly: 180000, lower: 175000, upper: 185000 },
  { grade: 16, monthly: 190000, lower: 185000, upper: 195000 },
  { grade: 17, monthly: 200000, lower: 195000, upper: 210000 },
  { grade: 18, monthly: 220000, lower: 210000, upper: 230000 },
  { grade: 19, monthly: 240000, lower: 230000, upper: 250000 },
  { grade: 20, monthly: 260000, lower: 250000, upper: 270000 },
  { grade: 21, monthly: 280000, lower: 270000, upper: 290000 },
  { grade: 22, monthly: 300000, lower: 290000, upper: 310000 },
  { grade: 23, monthly: 320000, lower: 310000, upper: 330000 },
  { grade: 24, monthly: 340000, lower: 330000, upper: 350000 },
  { grade: 25, monthly: 360000, lower: 350000, upper: 370000 },
  { grade: 26, monthly: 380000, lower: 370000, upper: 395000 },
  { grade: 27, monthly: 410000, lower: 395000, upper: 425000 },
  { grade: 28, monthly: 440000, lower: 425000, upper: 455000 },
  { grade: 29, monthly: 470000, lower: 455000, upper: 485000 },
  { grade: 30, monthly: 500000, lower: 485000, upper: 515000 },
  { grade: 31, monthly: 530000, lower: 515000, upper: 545000 },
  { grade: 32, monthly: 560000, lower: 545000, upper: 575000 },
  { grade: 33, monthly: 590000, lower: 575000, upper: 605000 },
  { grade: 34, monthly: 620000, lower: 605000, upper: 635000 },
  { grade: 35, monthly: 650000, lower: 635000, upper: 665000 },
  { grade: 36, monthly: 680000, lower: 665000, upper: 695000 },
  { grade: 37, monthly: 710000, lower: 695000, upper: 730000 },
  { grade: 38, monthly: 750000, lower: 730000, upper: 770000 },
  { grade: 39, monthly: 790000, lower: 770000, upper: 810000 },
  { grade: 40, monthly: 830000, lower: 810000, upper: 855000 },
  { grade: 41, monthly: 880000, lower: 855000, upper: 905000 },
  { grade: 42, monthly: 930000, lower: 905000, upper: 955000 },
  { grade: 43, monthly: 980000, lower: 955000, upper: 1005000 },
  { grade: 44, monthly: 1030000, lower: 1005000, upper: 1055000 },
  { grade: 45, monthly: 1090000, lower: 1055000, upper: 1115000 },
  { grade: 46, monthly: 1150000, lower: 1115000, upper: 1175000 },
  { grade: 47, monthly: 1210000, lower: 1175000, upper: 1235000 },
  { grade: 48, monthly: 1270000, lower: 1235000, upper: 1295000 },
  { grade: 49, monthly: 1330000, lower: 1295000, upper: 1355000 },
  { grade: 50, monthly: 1390000, lower: 1355000, upper: Infinity },
];

// ===== 標準報酬月額テーブル（厚生年金） =====
// 厚生年金は上限が65万円（32等級）
const PENSION_STANDARD_MONTHLY = [
  { grade: 1, monthly: 88000, lower: 0, upper: 93000 },
  { grade: 2, monthly: 98000, lower: 93000, upper: 101000 },
  { grade: 3, monthly: 104000, lower: 101000, upper: 107000 },
  { grade: 4, monthly: 110000, lower: 107000, upper: 114000 },
  { grade: 5, monthly: 118000, lower: 114000, upper: 122000 },
  { grade: 6, monthly: 126000, lower: 122000, upper: 130000 },
  { grade: 7, monthly: 134000, lower: 130000, upper: 138000 },
  { grade: 8, monthly: 142000, lower: 138000, upper: 146000 },
  { grade: 9, monthly: 150000, lower: 146000, upper: 155000 },
  { grade: 10, monthly: 160000, lower: 155000, upper: 165000 },
  { grade: 11, monthly: 170000, lower: 165000, upper: 175000 },
  { grade: 12, monthly: 180000, lower: 175000, upper: 185000 },
  { grade: 13, monthly: 190000, lower: 185000, upper: 195000 },
  { grade: 14, monthly: 200000, lower: 195000, upper: 210000 },
  { grade: 15, monthly: 220000, lower: 210000, upper: 230000 },
  { grade: 16, monthly: 240000, lower: 230000, upper: 250000 },
  { grade: 17, monthly: 260000, lower: 250000, upper: 270000 },
  { grade: 18, monthly: 280000, lower: 270000, upper: 290000 },
  { grade: 19, monthly: 300000, lower: 290000, upper: 310000 },
  { grade: 20, monthly: 320000, lower: 310000, upper: 330000 },
  { grade: 21, monthly: 340000, lower: 330000, upper: 350000 },
  { grade: 22, monthly: 360000, lower: 350000, upper: 370000 },
  { grade: 23, monthly: 380000, lower: 370000, upper: 395000 },
  { grade: 24, monthly: 410000, lower: 395000, upper: 425000 },
  { grade: 25, monthly: 440000, lower: 425000, upper: 455000 },
  { grade: 26, monthly: 470000, lower: 455000, upper: 485000 },
  { grade: 27, monthly: 500000, lower: 485000, upper: 515000 },
  { grade: 28, monthly: 530000, lower: 515000, upper: 545000 },
  { grade: 29, monthly: 560000, lower: 545000, upper: 575000 },
  { grade: 30, monthly: 590000, lower: 575000, upper: 605000 },
  { grade: 31, monthly: 620000, lower: 605000, upper: 635000 },
  { grade: 32, monthly: 650000, lower: 635000, upper: Infinity },
];

// ===== 個人事業関連 =====
const INDIVIDUAL_TAX = {
  blueReturnDeduction: 650000, // 青色申告特別控除
  businessTaxRate: 0.05, // 個人事業税率（第一種）
  businessTaxExemption: 2900000, // 事業主控除
  nationalPensionMonthly: 17510, // 国民年金月額（2026年度想定）
};

// ===== 国民健康保険（東京都特別区・2025年度ベース） =====
const NATIONAL_HEALTH_INSURANCE = {
  // 医療分
  medical: {
    incomeRate: 0.0764,
    perCapita: 49100,
    maxAmount: 650000,
  },
  // 後期高齢者支援金分
  support: {
    incomeRate: 0.0258,
    perCapita: 16500,
    maxAmount: 240000,
  },
  // 介護分（40歳以上65歳未満のみ）
  nursing: {
    incomeRate: 0.0170,
    perCapita: 17000,
    maxAmount: 170000,
  },
  // 基礎控除
  baseDeduction: 430000,
};

// ===== 人的控除 =====
const DEDUCTIONS = {
  basic: 480000, // 基礎控除
  spouseRegular: 380000, // 配偶者控除（一般）
  dependentGeneral: 380000, // 一般扶養控除
  dependentSpecific: 630000, // 特定扶養控除（19-22歳）
  dependentElderly: 480000, // 老人扶養控除（70歳以上）
};

// ===== 賞与の社会保険料上限 =====
const BONUS_INSURANCE = {
  healthAnnualCap: 5730000,   // 健康保険：年度累計上限（573万円）
  pensionPerBonusCap: 1500000, // 厚生年金：1回あたり上限（150万円）
};

// ===== 年齢区分 =====
const AGE_GROUP = {
  UNDER_40: "under40",
  AGE_40_64: "age40to64",
  AGE_65_OVER: "age65over",
};

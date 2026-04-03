/**
 * 社会保険料計算
 * 協会けんぽ（東京）・国民健康保険・国民年金
 */

/**
 * 健康保険の標準報酬月額を取得
 */
function getHealthStandardMonthly(monthlyComp) {
  if (monthlyComp <= 0) return HEALTH_STANDARD_MONTHLY[0];
  for (const row of HEALTH_STANDARD_MONTHLY) {
    if (monthlyComp >= row.lower && monthlyComp < row.upper) {
      return row;
    }
  }
  return HEALTH_STANDARD_MONTHLY[HEALTH_STANDARD_MONTHLY.length - 1];
}

/**
 * 厚生年金の標準報酬月額を取得
 */
function getPensionStandardMonthly(monthlyComp) {
  if (monthlyComp <= 0) return PENSION_STANDARD_MONTHLY[0];
  for (const row of PENSION_STANDARD_MONTHLY) {
    if (monthlyComp >= row.lower && monthlyComp < row.upper) {
      return row;
    }
  }
  return PENSION_STANDARD_MONTHLY[PENSION_STANDARD_MONTHLY.length - 1];
}

/**
 * 社会保険料を計算（法人役員・協会けんぽ東京）
 * @param {number} annualComp 年間報酬額
 * @param {string} ageGroup 年齢区分
 * @returns {Object} 社保料の内訳（年額）
 */
function calcSocialInsurance(annualComp, ageGroup) {
  const monthlyComp = Math.floor(annualComp / 12);

  // 標準報酬月額
  const healthStd = getHealthStandardMonthly(monthlyComp);
  const pensionStd = getPensionStandardMonthly(monthlyComp);

  // 健康保険料（月額）
  const healthEmployee = Math.floor(
    healthStd.monthly * HEALTH_INSURANCE.halfRate
  );
  const healthEmployer = Math.floor(
    healthStd.monthly * HEALTH_INSURANCE.halfRate
  );

  // 介護保険料（40歳以上65歳未満のみ）
  let nursingEmployee = 0;
  let nursingEmployer = 0;
  if (ageGroup === AGE_GROUP.AGE_40_64) {
    nursingEmployee = Math.floor(
      healthStd.monthly * HEALTH_INSURANCE.nursingHalfRate
    );
    nursingEmployer = Math.floor(
      healthStd.monthly * HEALTH_INSURANCE.nursingHalfRate
    );
  }

  // 厚生年金保険料（月額）
  let pensionEmployee = 0;
  let pensionEmployer = 0;
  if (ageGroup !== AGE_GROUP.AGE_65_OVER) {
    // 65歳以上は厚生年金の保険料なし（ただし70歳未満は本来かかる。簡略化のため65歳以上は除外）
    pensionEmployee = Math.floor(
      pensionStd.monthly * PENSION_INSURANCE.halfRate
    );
    pensionEmployer = Math.floor(
      pensionStd.monthly * PENSION_INSURANCE.halfRate
    );
  }

  // 年額に変換
  const result = {
    healthStandardMonthly: healthStd.monthly,
    pensionStandardMonthly: pensionStd.monthly,
    healthEmployee: healthEmployee * 12,
    healthEmployer: healthEmployer * 12,
    nursingEmployee: nursingEmployee * 12,
    nursingEmployer: nursingEmployer * 12,
    pensionEmployee: pensionEmployee * 12,
    pensionEmployer: pensionEmployer * 12,
  };

  result.totalEmployee =
    result.healthEmployee + result.nursingEmployee + result.pensionEmployee;
  result.totalEmployer =
    result.healthEmployer + result.nursingEmployer + result.pensionEmployer;
  result.grandTotal = result.totalEmployee + result.totalEmployer;

  return result;
}

/**
 * 国民健康保険料を計算（東京都特別区）
 * @param {number} totalIncome 総所得金額
 * @param {string} ageGroup 年齢区分
 * @returns {Object} 国保料の内訳（年額）
 */
function calcNationalHealthInsurance(totalIncome, ageGroup) {
  const baseIncome = Math.max(
    totalIncome - NATIONAL_HEALTH_INSURANCE.baseDeduction,
    0
  );

  // 医療分
  const medicalIncome = Math.floor(
    baseIncome * NATIONAL_HEALTH_INSURANCE.medical.incomeRate
  );
  const medical = Math.min(
    medicalIncome + NATIONAL_HEALTH_INSURANCE.medical.perCapita,
    NATIONAL_HEALTH_INSURANCE.medical.maxAmount
  );

  // 後期高齢者支援金分
  const supportIncome = Math.floor(
    baseIncome * NATIONAL_HEALTH_INSURANCE.support.incomeRate
  );
  const support = Math.min(
    supportIncome + NATIONAL_HEALTH_INSURANCE.support.perCapita,
    NATIONAL_HEALTH_INSURANCE.support.maxAmount
  );

  // 介護分（40歳以上65歳未満のみ）
  let nursing = 0;
  if (ageGroup === AGE_GROUP.AGE_40_64) {
    const nursingIncome = Math.floor(
      baseIncome * NATIONAL_HEALTH_INSURANCE.nursing.incomeRate
    );
    nursing = Math.min(
      nursingIncome + NATIONAL_HEALTH_INSURANCE.nursing.perCapita,
      NATIONAL_HEALTH_INSURANCE.nursing.maxAmount
    );
  }

  return {
    medical,
    support,
    nursing,
    total: medical + support + nursing,
  };
}

/**
 * 国民年金保険料を計算（年額）
 */
function calcNationalPension() {
  return INDIVIDUAL_TAX.nationalPensionMonthly * 12;
}

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
 * 賞与ありの社会保険料を計算（法人役員・協会けんぽ東京）
 * @param {number} monthlyComp 月額報酬（年額ではなく月額）
 * @param {number} bonusTotal 賞与年額合計
 * @param {number} bonusCount 賞与回数（1回 or 2回）
 * @param {string} ageGroup 年齢区分
 * @returns {Object} 社保料の内訳（年額）
 */
function calcSocialInsuranceWithBonus(monthlyComp, bonusTotal, bonusCount, ageGroup) {
  // --- 月額報酬部分 ---
  const healthStd = getHealthStandardMonthly(monthlyComp);
  const pensionStd = getPensionStandardMonthly(monthlyComp);

  // 健康保険料（月額部分・年額）
  const healthEmployeeMonthly = Math.floor(healthStd.monthly * HEALTH_INSURANCE.halfRate) * 12;
  const healthEmployerMonthly = Math.floor(healthStd.monthly * HEALTH_INSURANCE.halfRate) * 12;

  // 介護保険料（月額部分・年額）
  let nursingEmployeeMonthly = 0;
  let nursingEmployerMonthly = 0;
  if (ageGroup === AGE_GROUP.AGE_40_64) {
    nursingEmployeeMonthly = Math.floor(healthStd.monthly * HEALTH_INSURANCE.nursingHalfRate) * 12;
    nursingEmployerMonthly = Math.floor(healthStd.monthly * HEALTH_INSURANCE.nursingHalfRate) * 12;
  }

  // 厚生年金保険料（月額部分・年額）
  let pensionEmployeeMonthly = 0;
  let pensionEmployerMonthly = 0;
  if (ageGroup !== AGE_GROUP.AGE_65_OVER) {
    pensionEmployeeMonthly = Math.floor(pensionStd.monthly * PENSION_INSURANCE.halfRate) * 12;
    pensionEmployerMonthly = Math.floor(pensionStd.monthly * PENSION_INSURANCE.halfRate) * 12;
  }

  // --- 賞与部分 ---
  // 標準賞与額（1,000円未満切り捨て）
  const bonusPerTime = Math.floor(bonusTotal / bonusCount);
  const standardBonusPerTime = Math.floor(bonusPerTime / 1000) * 1000;

  // 健康保険の標準賞与額：年度累計573万円上限
  // 月額報酬の標準報酬月額は年度累計に含まれない
  const healthBonusBase = Math.min(standardBonusPerTime * bonusCount, BONUS_INSURANCE.healthAnnualCap);

  // 厚生年金の標準賞与額：1回150万円上限
  const pensionBonusPerTime = Math.min(standardBonusPerTime, BONUS_INSURANCE.pensionPerBonusCap);
  const pensionBonusBase = pensionBonusPerTime * bonusCount;

  // 健康保険料（賞与部分）
  const healthEmployeeBonus = Math.floor(healthBonusBase * HEALTH_INSURANCE.halfRate);
  const healthEmployerBonus = Math.floor(healthBonusBase * HEALTH_INSURANCE.halfRate);

  // 介護保険料（賞与部分）
  let nursingEmployeeBonus = 0;
  let nursingEmployerBonus = 0;
  if (ageGroup === AGE_GROUP.AGE_40_64) {
    nursingEmployeeBonus = Math.floor(healthBonusBase * HEALTH_INSURANCE.nursingHalfRate);
    nursingEmployerBonus = Math.floor(healthBonusBase * HEALTH_INSURANCE.nursingHalfRate);
  }

  // 厚生年金保険料（賞与部分）
  let pensionEmployeeBonus = 0;
  let pensionEmployerBonus = 0;
  if (ageGroup !== AGE_GROUP.AGE_65_OVER) {
    pensionEmployeeBonus = Math.floor(pensionBonusBase * PENSION_INSURANCE.halfRate);
    pensionEmployerBonus = Math.floor(pensionBonusBase * PENSION_INSURANCE.halfRate);
  }

  // --- 合計 ---
  const result = {
    // 月額報酬の標準報酬月額
    healthStandardMonthly: healthStd.monthly,
    pensionStandardMonthly: pensionStd.monthly,
    // 賞与の標準賞与額
    standardBonusPerTime,
    healthBonusBase,
    pensionBonusPerTime,
    pensionBonusBase,
    // 月額部分
    healthEmployeeMonthly,
    healthEmployerMonthly,
    nursingEmployeeMonthly,
    nursingEmployerMonthly,
    pensionEmployeeMonthly,
    pensionEmployerMonthly,
    // 賞与部分
    healthEmployeeBonus,
    healthEmployerBonus,
    nursingEmployeeBonus,
    nursingEmployerBonus,
    pensionEmployeeBonus,
    pensionEmployerBonus,
    // 各項目合計（月額+賞与）
    healthEmployee: healthEmployeeMonthly + healthEmployeeBonus,
    healthEmployer: healthEmployerMonthly + healthEmployerBonus,
    nursingEmployee: nursingEmployeeMonthly + nursingEmployeeBonus,
    nursingEmployer: nursingEmployerMonthly + nursingEmployerBonus,
    pensionEmployee: pensionEmployeeMonthly + pensionEmployeeBonus,
    pensionEmployer: pensionEmployerMonthly + pensionEmployerBonus,
  };

  result.totalEmployee = result.healthEmployee + result.nursingEmployee + result.pensionEmployee;
  result.totalEmployer = result.healthEmployer + result.nursingEmployer + result.pensionEmployer;
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

/**
 * シミュレーション実行エンジン
 * 法人パターン・個人事業パターンの計算と最適額探索
 */

/**
 * 法人パターンのシミュレーション（1つの報酬額に対して）
 */
function simulateCorp(params, compensation) {
  const { profit, ageGroup, hasSpouse, dependentsGeneral, dependentsSpecific, dependentsElderly, otherIncome } = params;

  // 1. 社会保険料
  const socialInsurance = calcSocialInsurance(compensation, ageGroup);

  // 2. 法人所得（利益 - 役員報酬 - 社保会社負担分）
  const corpIncome = Math.max(profit - compensation - socialInsurance.totalEmployer, 0);

  // 3. 法人税等
  const corpTaxes = calcCorpTax(corpIncome);

  // 4. 給与所得
  const salaryDeduction = calcSalaryDeduction(compensation);
  const salaryIncome = Math.max(compensation - salaryDeduction, 0);

  // 5. 所得控除
  const personalDeductions = calcPersonalDeductions({
    hasSpouse,
    dependentsGeneral: dependentsGeneral || 0,
    dependentsSpecific: dependentsSpecific || 0,
    dependentsElderly: dependentsElderly || 0,
    socialInsurance: socialInsurance.totalEmployee,
  });

  // 6. 課税所得
  const taxableIncome = Math.max(salaryIncome + (otherIncome || 0) - personalDeductions, 0);

  // 7. 所得税（復興特別所得税含む）
  const incomeTax = calcIncomeTax(taxableIncome);

  // 8. 住民税
  const residentTax = calcResidentTax(taxableIncome);

  // 9. 合計負担
  const totalBurden = corpTaxes.total + incomeTax + residentTax + socialInsurance.grandTotal;

  // 10. 手取り
  const netIncome = compensation - incomeTax - residentTax - socialInsurance.totalEmployee;

  return {
    compensation,
    corpIncome,
    corpTaxes,
    salaryDeduction,
    salaryIncome,
    personalDeductions,
    taxableIncome,
    incomeTax,
    residentTax,
    socialInsurance,
    totalBurden,
    netIncome,
    // 法人に残る利益（税引後）
    corpRetainedEarnings: corpIncome - corpTaxes.total,
  };
}

/**
 * 法人パターン（賞与あり）のシミュレーション
 * 年間総額を月額報酬＋賞与に分けて計算
 */
function simulateCorpWithBonus(params, totalAnnualComp, monthlyComp, bonusTotal, bonusCount) {
  const { profit, ageGroup, hasSpouse, dependentsGeneral, dependentsSpecific, dependentsElderly, otherIncome } = params;

  // 1. 社会保険料（賞与あり版）
  const socialInsurance = calcSocialInsuranceWithBonus(monthlyComp, bonusTotal, bonusCount, ageGroup);

  // 2. 法人所得（利益 - 総報酬額 - 社保会社負担分）
  const corpIncome = Math.max(profit - totalAnnualComp - socialInsurance.totalEmployer, 0);

  // 3. 法人税等
  const corpTaxes = calcCorpTax(corpIncome);

  // 4. 給与所得（月額報酬+賞与の合計に対して給与所得控除）
  const salaryDeduction = calcSalaryDeduction(totalAnnualComp);
  const salaryIncome = Math.max(totalAnnualComp - salaryDeduction, 0);

  // 5. 所得控除
  const personalDeductions = calcPersonalDeductions({
    hasSpouse,
    dependentsGeneral: dependentsGeneral || 0,
    dependentsSpecific: dependentsSpecific || 0,
    dependentsElderly: dependentsElderly || 0,
    socialInsurance: socialInsurance.totalEmployee,
  });

  // 6. 課税所得
  const taxableIncome = Math.max(salaryIncome + (otherIncome || 0) - personalDeductions, 0);

  // 7. 所得税（復興特別所得税含む）
  const incomeTax = calcIncomeTax(taxableIncome);

  // 8. 住民税
  const residentTax = calcResidentTax(taxableIncome);

  // 9. 合計負担
  const totalBurden = corpTaxes.total + incomeTax + residentTax + socialInsurance.grandTotal;

  // 10. 手取り
  const netIncome = totalAnnualComp - incomeTax - residentTax - socialInsurance.totalEmployee;

  return {
    compensation: totalAnnualComp,
    monthlyComp,
    bonusTotal,
    bonusCount,
    corpIncome,
    corpTaxes,
    salaryDeduction,
    salaryIncome,
    personalDeductions,
    taxableIncome,
    incomeTax,
    residentTax,
    socialInsurance,
    totalBurden,
    netIncome,
    corpRetainedEarnings: corpIncome - corpTaxes.total,
  };
}

/**
 * 賞与活用シミュレーション
 * 同じ年間総額で「月額のみ」vs「月額+賞与」を比較
 */
function runBonusSimulation(params) {
  const { profit } = params;
  const results = [];

  // 年間総額を500万〜利益まで、100万円刻みで
  const step = 1000000;
  const minComp = 5000000;

  for (let totalComp = minComp; totalComp <= profit; totalComp += step) {
    // パターン1: 月額のみ（ベースライン）
    const monthlyOnly = simulateCorp(params, totalComp);

    // パターン2〜: 月額を下げて賞与に回す
    // 月額報酬の候補（低い順）
    const monthlyOptions = [];
    for (let m = 100000; m <= Math.floor(totalComp / 12); m += 50000) {
      const bonus = totalComp - m * 12;
      if (bonus > 0) {
        monthlyOptions.push({ monthly: m, bonus });
      }
    }

    // 最も社保が安くなるパターンを探索
    let bestBonus = null;
    let bestSaving = 0;

    for (const opt of monthlyOptions) {
      const bonusResult = simulateCorpWithBonus(
        params, totalComp, opt.monthly, opt.bonus, 1
      );
      const saving = monthlyOnly.totalBurden - bonusResult.totalBurden;
      if (saving > bestSaving) {
        bestSaving = saving;
        bestBonus = bonusResult;
      }
    }

    results.push({
      totalComp,
      monthlyOnly,
      bestBonus,
      saving: bestSaving,
    });
  }

  return results;
}

/**
 * 個人事業パターンのシミュレーション
 */
function simulateIndividual(params) {
  const { profit, ageGroup, hasSpouse, dependentsGeneral, dependentsSpecific, dependentsElderly, otherIncome } = params;

  // 1. 事業所得（青色申告特別控除後）
  const businessIncome = Math.max(profit - INDIVIDUAL_TAX.blueReturnDeduction, 0);

  // 2. 国民健康保険
  const nationalHealthIns = calcNationalHealthInsurance(businessIncome, ageGroup);

  // 3. 国民年金
  const nationalPension = calcNationalPension();

  // 4. 所得控除
  const totalSocialInsurance = nationalHealthIns.total + nationalPension;
  const personalDeductions = calcPersonalDeductions({
    hasSpouse,
    dependentsGeneral: dependentsGeneral || 0,
    dependentsSpecific: dependentsSpecific || 0,
    dependentsElderly: dependentsElderly || 0,
    socialInsurance: totalSocialInsurance,
  });

  // 5. 課税所得
  const taxableIncome = Math.max(businessIncome + (otherIncome || 0) - personalDeductions, 0);

  // 6. 所得税
  const incomeTax = calcIncomeTax(taxableIncome);

  // 7. 住民税
  const residentTax = calcResidentTax(taxableIncome);

  // 8. 個人事業税
  const businessTax = calcPersonalBusinessTax(businessIncome);

  // 9. 合計負担
  const totalBurden = incomeTax + residentTax + businessTax + nationalHealthIns.total + nationalPension;

  // 10. 手取り
  const netIncome = profit - totalBurden;

  return {
    profit,
    businessIncome,
    nationalHealthIns,
    nationalPension,
    totalSocialInsurance,
    personalDeductions,
    taxableIncome,
    incomeTax,
    residentTax,
    businessTax,
    totalBurden,
    netIncome,
  };
}

/**
 * シミュレーション一括実行
 * @param {Object} params 入力パラメータ
 * @returns {Object} 全結果
 */
function runSimulation(params) {
  const { profit } = params;
  const step = 500000; // 50万円刻み
  const corpResults = [];

  // 報酬0円〜利益100%まで50万円刻み
  for (let comp = 0; comp <= profit; comp += step) {
    corpResults.push(simulateCorp(params, comp));
  }
  // 利益ちょうどがstepの倍数でない場合、最後に追加
  if (profit % step !== 0) {
    corpResults.push(simulateCorp(params, profit));
  }

  // 個人事業パターン
  const individualResult = simulateIndividual(params);

  // 最適額探索（1万円刻み）
  const optimal = findOptimalCompensation(params);

  return {
    corpResults,
    individualResult,
    optimal,
    params,
  };
}

/**
 * 合計負担が最小となる最適報酬額を探索
 */
function findOptimalCompensation(params) {
  const { profit } = params;
  let minBurden = Infinity;
  let optimalComp = 0;
  let optimalResult = null;

  // 1万円刻みで探索
  for (let comp = 0; comp <= profit; comp += 10000) {
    const result = simulateCorp(params, comp);
    if (result.totalBurden < minBurden) {
      minBurden = result.totalBurden;
      optimalComp = comp;
      optimalResult = result;
    }
  }

  return {
    compensation: optimalComp,
    totalBurden: minBurden,
    result: optimalResult,
  };
}

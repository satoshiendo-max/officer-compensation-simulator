/**
 * 税額計算エンジン
 * 所得税・住民税・法人税等の計算関数
 */

/**
 * 給与所得控除額を計算
 */
function calcSalaryDeduction(salary) {
  if (salary <= 0) return 0;
  for (const bracket of SALARY_DEDUCTION_BRACKETS) {
    if (salary >= bracket.lower && salary <= bracket.upper) {
      return Math.max(bracket.calc(salary), 550000);
    }
  }
  return 1950000;
}

/**
 * 所得税を計算（復興特別所得税含む）
 */
function calcIncomeTax(taxableIncome) {
  if (taxableIncome <= 0) return 0;
  let tax = 0;
  for (const bracket of INCOME_TAX_BRACKETS) {
    if (taxableIncome > bracket.lower) {
      tax = taxableIncome * bracket.rate - bracket.deduction;
    }
  }
  // 復興特別所得税
  tax = Math.floor(tax * (1 + RECONSTRUCTION_TAX_RATE));
  return Math.max(tax, 0);
}

/**
 * 所得税を計算（復興特別所得税なし・住民税計算用）
 */
function calcIncomeTaxBase(taxableIncome) {
  if (taxableIncome <= 0) return 0;
  let tax = 0;
  for (const bracket of INCOME_TAX_BRACKETS) {
    if (taxableIncome > bracket.lower) {
      tax = taxableIncome * bracket.rate - bracket.deduction;
    }
  }
  return Math.max(Math.floor(tax), 0);
}

/**
 * 住民税を計算（所得割 + 均等割）
 */
function calcResidentTax(taxableIncome) {
  if (taxableIncome <= 0) return RESIDENT_TAX.perCapita;
  const incomePortion = Math.floor(taxableIncome * RESIDENT_TAX.rate);
  return incomePortion + RESIDENT_TAX.perCapita;
}

/**
 * 法人税等を計算
 * @returns {Object} 各税目の内訳と合計
 */
function calcCorpTax(corpIncome) {
  // 法人税
  let corpTax = 0;
  if (corpIncome > 0) {
    let remaining = corpIncome;
    let prev = 0;
    for (const bracket of CORP_TAX.brackets) {
      const taxable = Math.min(remaining, bracket.upper - prev);
      corpTax += taxable * bracket.rate;
      remaining -= taxable;
      prev = bracket.upper;
      if (remaining <= 0) break;
    }
  }
  corpTax = Math.floor(corpTax);

  // 地方法人税
  const localCorpTax = Math.floor(corpTax * CORP_TAX.localCorpTaxRate);

  // 法人住民税（法人税割 + 均等割）
  const municipalIncomeTax = Math.floor(corpTax * CORP_TAX.municipalTaxRate);
  const municipalTax = municipalIncomeTax + CORP_TAX.municipalPerCapita;

  // 法人事業税
  let businessTax = 0;
  if (corpIncome > 0) {
    let remaining = corpIncome;
    let prev = 0;
    for (const bracket of CORP_TAX.businessTax) {
      const taxable = Math.min(remaining, bracket.upper - prev);
      businessTax += taxable * bracket.rate;
      remaining -= taxable;
      prev = bracket.upper;
      if (remaining <= 0) break;
    }
  }
  businessTax = Math.floor(businessTax);

  // 特別法人事業税
  const specialBusinessTax = Math.floor(
    businessTax * CORP_TAX.specialBusinessTaxRate
  );

  const total =
    corpTax + localCorpTax + municipalTax + businessTax + specialBusinessTax;

  return {
    corpTax,
    localCorpTax,
    municipalTax,
    municipalIncomeTax,
    municipalPerCapita: CORP_TAX.municipalPerCapita,
    businessTax,
    specialBusinessTax,
    total,
  };
}

/**
 * 人的控除の合計を計算
 */
function calcPersonalDeductions(config) {
  let total = DEDUCTIONS.basic; // 基礎控除

  // 配偶者控除
  if (config.hasSpouse) {
    total += DEDUCTIONS.spouseRegular;
  }

  // 扶養控除（一般）
  if (config.dependentsGeneral > 0) {
    total += DEDUCTIONS.dependentGeneral * config.dependentsGeneral;
  }

  // 特定扶養控除
  if (config.dependentsSpecific > 0) {
    total += DEDUCTIONS.dependentSpecific * config.dependentsSpecific;
  }

  // 老人扶養控除
  if (config.dependentsElderly > 0) {
    total += DEDUCTIONS.dependentElderly * config.dependentsElderly;
  }

  // 社会保険料控除
  if (config.socialInsurance > 0) {
    total += config.socialInsurance;
  }

  return total;
}

/**
 * 個人事業税を計算
 */
function calcPersonalBusinessTax(businessIncome) {
  const taxable = businessIncome - INDIVIDUAL_TAX.businessTaxExemption;
  if (taxable <= 0) return 0;
  return Math.floor(taxable * INDIVIDUAL_TAX.businessTaxRate);
}

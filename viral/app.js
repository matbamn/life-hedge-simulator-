// Life-Hedge Simulator - Main Application Logic (v2)
// 피드백 반영: 누적 개념 제거, 특정 나이 질병 발생 시 비용, 보험 vs 투자 비교

document.addEventListener('DOMContentLoaded', () => {
    // Initialize range slider display
    const returnSlider = document.getElementById('expectedReturn');
    const returnValue = document.getElementById('returnValue');
    returnSlider.addEventListener('input', () => {
        returnValue.textContent = `${returnSlider.value}%`;
    });

    // Simulate button click
    document.getElementById('simulateBtn').addEventListener('click', runSimulation);

    // Early onset simulation button
    document.getElementById('simulateEarlyBtn').addEventListener('click', runEarlyOnsetSimulation);

    // Run initial simulations
    runSimulation();
    runEarlyOnsetSimulation();
});

// Configuration
const CONFIG = {
    inflationRate: 0.05,          // 의료비 상승률 5%
    costMultiplier: 2.0,          // 비급여 포함 2배 보정
    familyHistoryMultiplier: 1.5, // 가족력 시 위험도 1.5배
    annualSalary: 50000000,       // 연간 소득 상실분 (5천만원 가정)
    dangerThreshold: 2.0          // 위험 구간 임계값 (발병률 2% 이상)
};

// Get user inputs
function getUserInputs() {
    const gender = document.querySelector('input[name="gender"]:checked').value;
    const currentAge = parseInt(document.getElementById('currentAge').value);
    const retireAge = parseInt(document.getElementById('retireAge').value);
    const insuranceExpire = parseInt(document.getElementById('insuranceExpire').value);

    // Family history
    const familyHistory = Array.from(
        document.querySelectorAll('input[name="familyHistory"]:checked')
    ).map(cb => cb.value);

    // Insurance (만원 → 원)
    const insurance = {
        cancer: parseInt(document.getElementById('insuranceCancer').value) * 10000,
        brain: parseInt(document.getElementById('insuranceBrain').value) * 10000,
        heart: parseInt(document.getElementById('insuranceHeart').value) * 10000,
        expireAge: insuranceExpire
    };

    // Investment (만원 → 원)
    const investment = {
        currentAsset: parseInt(document.getElementById('currentAsset').value) * 10000,
        monthlyInvest: parseInt(document.getElementById('monthlyInvest').value) * 10000,
        expectedReturn: parseFloat(document.getElementById('expectedReturn').value) / 100
    };

    return { gender, currentAge, retireAge, familyHistory, insurance, investment };
}

// Calculate risk score for each age - 질병별 발병 확률
function calculateRiskByAge(gender, currentAge, familyHistory) {
    const ages = [];
    const riskData = {};
    const diseaseNames = Object.keys(DISEASES);

    for (let age = currentAge; age <= 85; age += 1) {
        const ageGroup = ageToGroup(age);
        ages.push(age);

        diseaseNames.forEach(disease => {
            if (!riskData[disease]) riskData[disease] = [];
            let risk = getRiskProbability(disease, gender, ageGroup);
            if (familyHistory.includes(disease)) {
                risk *= CONFIG.familyHistoryMultiplier;
            }
            riskData[disease].push(risk * 100);
        });
    }
    return { ages, riskData };
}

// 특정 나이에 질병 발생 시 예상 비용 계산 (1회성 비용)
function calculateDiseaseCostAtAge(disease, age, currentAge) {
    const avgCost = getAverageCost(disease) * CONFIG.costMultiplier;
    const livingCost = CONFIG.annualSalary; // 1년 소득 상실
    const yearsFromNow = age - currentAge;
    const futureCost = (avgCost + livingCost) * Math.pow(1 + CONFIG.inflationRate, yearsFromNow);
    return futureCost;
}

// 보험 vs 투자 비교 계산
function calculateInsuranceVsInvestment(currentAge, targetAge, monthlyPremium, investmentReturn, insuranceAmount) {
    const years = targetAge - currentAge;
    const months = years * 12;
    const monthlyRate = investmentReturn / 12;

    // 같은 보험료로 투자했을 경우
    let investmentValue = 0;
    for (let m = 0; m < months; m++) {
        investmentValue = investmentValue * (1 + monthlyRate) + monthlyPremium;
    }

    return {
        insuranceValue: insuranceAmount,
        investmentValue: investmentValue,
        totalPremiumPaid: monthlyPremium * months
    };
}

// Main simulation function
function runSimulation() {
    const inputs = getUserInputs();

    // Calculate risk by age
    const riskResult = calculateRiskByAge(inputs.gender, inputs.currentAge, inputs.familyHistory);

    // Render charts
    renderRiskChart(riskResult, inputs);
    renderCostComparisonChart(inputs);

    // Generate alerts
    generateAlerts(inputs, riskResult);

    // Update summary
    updateSummary(inputs, riskResult);
}

// Risk Chart with danger zones
let riskChart = null;
function renderRiskChart(riskResult, inputs) {
    const ctx = document.getElementById('heatmapChart').getContext('2d');
    if (riskChart) riskChart.destroy();

    const topDiseases = ['위암', '대장암', '폐암', '뇌혈관질환', '허혈성심질환', '치매'];

    // 위험 구간 식별 (발병률 2% 이상인 구간)
    const dangerZones = [];
    let inDanger = false;
    let dangerStart = null;

    // 종합 위험도 계산 (주요 질병의 평균)
    const combinedRisk = riskResult.ages.map((age, i) => {
        const risks = topDiseases.map(d => riskResult.riskData[d][i]);
        return Math.max(...risks); // 가장 높은 위험도
    });

    combinedRisk.forEach((risk, i) => {
        if (risk >= CONFIG.dangerThreshold && !inDanger) {
            inDanger = true;
            dangerStart = i;
        } else if (risk < CONFIG.dangerThreshold && inDanger) {
            inDanger = false;
            dangerZones.push({ start: dangerStart, end: i - 1 });
        }
    });
    if (inDanger) dangerZones.push({ start: dangerStart, end: combinedRisk.length - 1 });

    // 위험 구간 배경 데이터
    const dangerBackground = combinedRisk.map((risk, i) => risk >= CONFIG.dangerThreshold ? 20 : null);

    const datasets = [
        // 위험 구간 배경 (붉은색 영역)
        {
            label: '⚠️ 위험 구간',
            data: dangerBackground,
            backgroundColor: 'rgba(255, 107, 107, 0.25)',
            borderColor: 'transparent',
            fill: true,
            pointRadius: 0,
            order: 10
        },
        ...topDiseases.map(disease => ({
            label: disease,
            data: riskResult.riskData[disease],
            borderColor: DISEASES[disease].color,
            backgroundColor: 'transparent',
            fill: false,
            tension: 0.4,
            pointRadius: 2,
            borderWidth: 2,
            order: 1
        }))
    ];

    riskChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: riskResult.ages,
            datasets: datasets
        },
        options: {
            responsive: true,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: { position: 'top', labels: { color: '#a0a0c0' } },
                tooltip: {
                    callbacks: {
                        label: (ctx) => {
                            if (ctx.dataset.label === '⚠️ 위험 구간') return null;
                            return `${ctx.dataset.label}: ${ctx.raw?.toFixed(2) || 0}%`;
                        }
                    }
                },
                annotation: {
                    annotations: dangerZones.map((zone, idx) => ({
                        type: 'box',
                        xMin: riskResult.ages[zone.start],
                        xMax: riskResult.ages[zone.end],
                        backgroundColor: 'rgba(255, 107, 107, 0.15)',
                        borderColor: 'rgba(255, 107, 107, 0.5)',
                        borderWidth: 1
                    }))
                }
            },
            scales: {
                x: {
                    title: { display: true, text: '나이', color: '#a0a0c0' },
                    ticks: { color: '#a0a0c0' },
                    grid: { color: 'rgba(255,255,255,0.05)' }
                },
                y: {
                    title: { display: true, text: '발병 확률 (%)', color: '#a0a0c0' },
                    ticks: { color: '#a0a0c0' },
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    min: 0,
                    max: 20
                }
            }
        }
    });
}

// 비용 비교 차트: 특정 질병 발생 시 비용 vs 보험/투자
let costChart = null;
function renderCostComparisonChart(inputs) {
    const ctx = document.getElementById('battleChart').getContext('2d');
    if (costChart) costChart.destroy();

    const ages = [];
    const cancerCost = [];
    const brainCost = [];
    const heartCost = [];
    const insuranceValue = [];
    const investmentValue = [];

    // 가정: 월 보험료 20만원을 보험 vs 투자했을 때 비교
    const monthlyPremium = 200000; // 월 20만원

    for (let age = inputs.currentAge; age <= 85; age += 5) {
        ages.push(age + '세');

        // 해당 나이에 질병 발생 시 예상 비용 (만원)
        cancerCost.push(Math.round(calculateDiseaseCostAtAge('위암', age, inputs.currentAge) / 10000));
        brainCost.push(Math.round(calculateDiseaseCostAtAge('뇌혈관질환', age, inputs.currentAge) / 10000));
        heartCost.push(Math.round(calculateDiseaseCostAtAge('허혈성심질환', age, inputs.currentAge) / 10000));

        // 보험 진단금 (만기 전까지만)
        if (age <= inputs.insurance.expireAge) {
            insuranceValue.push(Math.round(inputs.insurance.cancer / 10000));
        } else {
            insuranceValue.push(0);
        }

        // 같은 돈(월 20만원)을 투자했을 경우
        const comparison = calculateInsuranceVsInvestment(
            inputs.currentAge, age, monthlyPremium, inputs.investment.expectedReturn, inputs.insurance.cancer
        );
        investmentValue.push(Math.round(comparison.investmentValue / 10000));
    }

    costChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ages,
            datasets: [
                {
                    label: '위암 발병 시 비용',
                    data: cancerCost,
                    backgroundColor: 'rgba(255, 107, 107, 0.8)',
                    borderColor: '#ff6b6b',
                    borderWidth: 1
                },
                {
                    label: '뇌혈관질환 발병 시 비용',
                    data: brainCost,
                    backgroundColor: 'rgba(155, 89, 182, 0.8)',
                    borderColor: '#9B59B6',
                    borderWidth: 1
                },
                {
                    label: '심장질환 발병 시 비용',
                    data: heartCost,
                    backgroundColor: 'rgba(231, 76, 60, 0.8)',
                    borderColor: '#E74C3C',
                    borderWidth: 1
                },
                {
                    label: '보험 진단금',
                    data: insuranceValue,
                    type: 'line',
                    borderColor: '#45b7d1',
                    backgroundColor: 'transparent',
                    borderWidth: 3,
                    borderDash: [5, 5],
                    pointRadius: 4,
                    pointBackgroundColor: '#45b7d1'
                },
                {
                    label: '월 20만원 투자 시',
                    data: investmentValue,
                    type: 'line',
                    borderColor: '#6bcb77',
                    backgroundColor: 'transparent',
                    borderWidth: 3,
                    pointRadius: 4,
                    pointBackgroundColor: '#6bcb77'
                }
            ]
        },
        options: {
            responsive: true,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: { position: 'top', labels: { color: '#a0a0c0' } },
                tooltip: {
                    callbacks: {
                        label: (ctx) => `${ctx.dataset.label}: ${ctx.raw.toLocaleString()}만원`
                    }
                }
            },
            scales: {
                x: {
                    title: { display: true, text: '발병 시점', color: '#a0a0c0' },
                    ticks: { color: '#a0a0c0' },
                    grid: { color: 'rgba(255,255,255,0.05)' }
                },
                y: {
                    title: { display: true, text: '금액 (만원)', color: '#a0a0c0' },
                    ticks: {
                        color: '#a0a0c0',
                        callback: (v) => v.toLocaleString()
                    },
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    min: 0
                }
            }
        }
    });
}

// Generate alert messages
function generateAlerts(inputs, riskResult) {
    const alertBox = document.getElementById('alertBox');
    alertBox.innerHTML = '';
    const alerts = [];

    // 위험 구간 감지
    const topDiseases = ['위암', '대장암', '폐암', '뇌혈관질환', '허혈성심질환', '치매'];
    let dangerAges = [];

    riskResult.ages.forEach((age, i) => {
        const maxRisk = Math.max(...topDiseases.map(d => riskResult.riskData[d][i]));
        if (maxRisk >= CONFIG.dangerThreshold) {
            dangerAges.push(age);
        }
    });

    if (dangerAges.length > 0) {
        const startAge = dangerAges[0];
        const endAge = dangerAges[dangerAges.length - 1];
        alerts.push({
            type: 'danger',
            title: '🔴 위험 구간: ' + startAge + '세 ~ ' + endAge + '세',
            message: `이 기간 동안 주요 질병 발병 확률이 ${CONFIG.dangerThreshold}%를 초과합니다. 보험 커버리지와 건강검진을 집중적으로 관리하세요.`
        });
    }

    // 보험 만기 경고
    if (inputs.insurance.expireAge < 85 && dangerAges.some(a => a > inputs.insurance.expireAge)) {
        alerts.push({
            type: 'warning',
            title: '⚠️ 보험 만기 후 위험 구간 존재',
            message: `${inputs.insurance.expireAge}세에 보험이 만기되지만, 이후에도 높은 위험 구간이 있습니다. 투자 자산으로 대비하거나 만기를 연장하세요.`
        });
    }

    // 가족력 경고
    inputs.familyHistory.forEach(disease => {
        const risks = riskResult.riskData[disease];
        const maxRisk = Math.max(...risks);
        const peakAge = riskResult.ages[risks.indexOf(maxRisk)];

        alerts.push({
            type: 'warning',
            title: `🧬 ${disease} 가족력`,
            message: `${peakAge}세에 ${maxRisk.toFixed(1)}% 피크. 해당 나이 전에 정밀 검진을 권장합니다.`
        });
    });

    // 성공 알림
    if (alerts.filter(a => a.type === 'danger').length === 0) {
        alerts.push({
            type: 'success',
            title: '✅ 현재 위험도 낮음',
            message: '현재 설정 기준으로 급격한 위험 구간이 없습니다.'
        });
    }

    // Render
    alerts.slice(0, 4).forEach(alert => {
        alertBox.innerHTML += `
      <div class="alert alert-${alert.type} fade-in">
        <div class="alert-title">${alert.title}</div>
        <div class="alert-message">${alert.message}</div>
      </div>
    `;
    });
}

// Update summary stats
function updateSummary(inputs, riskResult) {
    const summaryGrid = document.getElementById('summaryGrid');

    // 최고 위험 질병 및 피크 나이
    let maxRisk = 0;
    let maxRiskDisease = '';
    let peakAge = 0;

    Object.keys(riskResult.riskData).forEach(disease => {
        const peak = Math.max(...riskResult.riskData[disease]);
        if (peak > maxRisk) {
            maxRisk = peak;
            maxRiskDisease = disease;
            peakAge = riskResult.ages[riskResult.riskData[disease].indexOf(peak)];
        }
    });

    // 피크 나이에 해당 질병 발생 시 예상 비용
    const peakCost = calculateDiseaseCostAtAge(maxRiskDisease, peakAge, inputs.currentAge);

    // 해당 시점 보험 커버리지
    const insuranceCover = peakAge <= inputs.insurance.expireAge ?
        (DISEASE_CATEGORIES.cancer.includes(maxRiskDisease) ? inputs.insurance.cancer :
            DISEASE_CATEGORIES.brain.includes(maxRiskDisease) ? inputs.insurance.brain :
                DISEASE_CATEGORIES.heart.includes(maxRiskDisease) ? inputs.insurance.heart : 0) : 0;

    const gap = peakCost - insuranceCover;

    summaryGrid.innerHTML = `
    <div class="stat-card fade-in">
      <div class="stat-value">${maxRiskDisease}</div>
      <div class="stat-label">최고 위험 질병</div>
    </div>
    <div class="stat-card fade-in">
      <div class="stat-value">${peakAge}세</div>
      <div class="stat-label">피크 시점 (${maxRisk.toFixed(1)}%)</div>
    </div>
    <div class="stat-card fade-in">
      <div class="stat-value">${Math.round(peakCost / 10000).toLocaleString()}</div>
      <div class="stat-label">${peakAge}세 발병 시 비용 (만원)</div>
    </div>
    <div class="stat-card fade-in">
      <div class="stat-value ${gap > 0 ? 'danger' : ''}">${gap > 0 ? '+' : ''}${Math.round(gap / 10000).toLocaleString()}</div>
      <div class="stat-label">보험 대비 부족액 (만원)</div>
    </div>
  `;
}

// ====== 조기 발병 시뮬레이션 ======
function runEarlyOnsetSimulation() {
    const inputs = getUserInputs();
    const targetAge = parseInt(document.getElementById('earlyOnsetAge').value);
    const disease = document.getElementById('earlyOnsetDisease').value;

    const resultBox = document.getElementById('earlyOnsetResult');

    // 1. 해당 나이에 질병 발생 시 예상 비용
    const diseaseCost = calculateDiseaseCostAtAge(disease, targetAge, inputs.currentAge);

    // 2. 보험 진단금 (해당 시점에 유효한 경우)
    let insuranceAmount = 0;
    if (targetAge <= inputs.insurance.expireAge) {
        if (DISEASE_CATEGORIES.cancer.includes(disease)) {
            insuranceAmount = inputs.insurance.cancer;
        } else if (DISEASE_CATEGORIES.brain.includes(disease)) {
            insuranceAmount = inputs.insurance.brain;
        } else if (DISEASE_CATEGORIES.heart.includes(disease)) {
            insuranceAmount = inputs.insurance.heart;
        }
    }

    // 3. 같은 기간 동안 월 보험료를 투자했을 경우
    // 가정: 월 보험료 약 20만원 (암+뇌+심장 진단금 7천만원 기준 일반적인 수준)
    const monthlyPremium = 200000;
    const comparison = calculateInsuranceVsInvestment(
        inputs.currentAge,
        targetAge,
        monthlyPremium,
        inputs.investment.expectedReturn,
        insuranceAmount
    );

    // 4. 비관적 투자 시나리오 (2% 수익률)
    const pessimisticComparison = calculateInsuranceVsInvestment(
        inputs.currentAge,
        targetAge,
        monthlyPremium,
        0.02, // 비관적: 2%
        insuranceAmount
    );

    // 5. 판정
    let verdict = '';
    let verdictClass = '';

    const insuranceCoverage = insuranceAmount / diseaseCost * 100;
    const investmentCoverage = comparison.investmentValue / diseaseCost * 100;
    const pessimisticCoverage = pessimisticComparison.investmentValue / diseaseCost * 100;

    if (targetAge <= inputs.currentAge + 10) {
        // 조기 발병 (10년 이내): 보험 유리
        verdict = `🛡️ 조기 발병 시나리오: 보험이 더 유리합니다! 투자 누적 기간이 짧아 ${Math.round(investmentCoverage)}%만 커버됩니다.`;
        verdictClass = 'insurance-wins';
    } else if (insuranceAmount === 0) {
        // 보험 만기 이후
        verdict = `⚠️ 보험 만기(${inputs.insurance.expireAge}세) 이후입니다. 투자 자산으로만 대비해야 합니다.`;
        verdictClass = 'tie';
    } else if (comparison.investmentValue > insuranceAmount * 1.2) {
        // 투자가 20% 이상 우위
        verdict = `📈 투자 우위: 장기 투자로 ${Math.round((comparison.investmentValue / insuranceAmount - 1) * 100)}% 더 많은 자금을 마련할 수 있습니다. 단, 시장 리스크가 있습니다.`;
        verdictClass = 'investment-wins';
    } else if (insuranceAmount > comparison.investmentValue * 1.2) {
        // 보험이 20% 이상 우위
        verdict = `🛡️ 보험 우위: 확정 보장으로 안정적입니다. 특히 비관적 시나리오(2% 수익률)에서는 투자가 ${Math.round(pessimisticCoverage)}%만 커버합니다.`;
        verdictClass = 'insurance-wins';
    } else {
        verdict = `⚖️ 균형: 보험과 투자 모두 비슷한 수준입니다. 개인 성향에 따라 선택하세요.`;
        verdictClass = 'tie';
    }

    resultBox.innerHTML = `
    <div class="onset-comparison fade-in">
      <div class="comparison-card cost">
        <div class="card-label">${disease} 발병 시 예상 비용</div>
        <div class="card-value">${Math.round(diseaseCost / 10000).toLocaleString()}만원</div>
        <div class="card-note">${targetAge}세 발병 기준</div>
      </div>
      <div class="comparison-card insurance">
        <div class="card-label">보험 진단금</div>
        <div class="card-value">${insuranceAmount > 0 ? Math.round(insuranceAmount / 10000).toLocaleString() + '만원' : '만기됨'}</div>
        <div class="card-note">비용의 ${Math.round(insuranceCoverage)}% 커버</div>
      </div>
      <div class="comparison-card investment">
        <div class="card-label">월 20만원 투자 시</div>
        <div class="card-value">${Math.round(comparison.investmentValue / 10000).toLocaleString()}만원</div>
        <div class="card-note">비용의 ${Math.round(investmentCoverage)}% 커버 (비관: ${Math.round(pessimisticCoverage)}%)</div>
      </div>
    </div>
    <div class="onset-verdict ${verdictClass} fade-in">
      ${verdict}
    </div>
  `;
}


// Viral MVP - Health Defense Type Quiz Logic (16 Types Version)

// User answers
const answers = {
    gender: null,
    age: 40,
    familyHistory: [],
    monthlyBudget: 0,
    timeOrientation: null,  // 'short' (T-) or 'long' (T+)
    financePref: null       // 'stable' (F+) or 'aggressive' (F-)
};

// Disease risk data with realistic cost breakdown
// 직접비용: 치료비+간병비 (산정특례 적용)
// 치료기간: 통계 기준 평균 (개월)
const DISEASE_DATA = {
    '위암': { peakAge: 65, riskPercent: 8, directCost: 2000, treatmentMonths: 12 },
    '대장암': { peakAge: 68, riskPercent: 10, directCost: 1800, treatmentMonths: 10 },
    '폐암': { peakAge: 70, riskPercent: 7, directCost: 2500, treatmentMonths: 12 },
    '뇌혈관질환': { peakAge: 58, riskPercent: 12, directCost: 1500, treatmentMonths: 18 },
    '허혈성심질환': { peakAge: 55, riskPercent: 9, directCost: 1200, treatmentMonths: 6 },
    '치매': { peakAge: 80, riskPercent: 15, directCost: 1000, treatmentMonths: 60 } // 5년
};

// 나이대별 월 중위소득 (통계청 가계금융복지조사 2024, 개인 근로소득 기준, 만원)
const MEDIAN_INCOME = {
    20: 220,  // 20대
    30: 320,  // 30대
    40: 350,  // 40대
    50: 330,  // 50대
    60: 250,  // 60대
    70: 120   // 70대+
};

// 16 Type definitions (R/D/T/F)
const TYPES_16 = {
    'R+D+T+F+': { emoji: '🧤', name: '철벽 골키퍼', code: 'R+D+T+F+', tip: '완벽한 수비! 건강 유지만 잘 하세요 👍', color: '#6bcb77' },
    'R+D+T+F-': { emoji: '⚔️', name: '공격형 수비수', code: 'R+D+T+F-', tip: '장기적인 재정 계획을 세워보세요!', color: '#4ecdc4' },
    'R+D+T-F+': { emoji: '🎯', name: '선제 방어러', code: 'R+D+T-F+', tip: '조기 대비 완료! 잘하고 있어요', color: '#45b7d1' },
    'R+D+T-F-': { emoji: '💹', name: '젊은 준비생', code: 'R+D+T-F-', tip: '시간이 편이에요, 꾸준히 준비해요!', color: '#96ceb4' },
    'R+D-T+F+': { emoji: '📝', name: '계획만 세움', code: 'R+D-T+F+', tip: '알고 계시니 이제 행동만!', color: '#ffeaa7' },
    'R+D-T+F-': { emoji: '💭', name: '몽상가', code: 'R+D-T+F-', tip: '건강 목표, 작은 것부터 시작해요!', color: '#dfe6e9' },
    'R+D-T-F+': { emoji: '😰', name: '걱정만 함', code: 'R+D-T-F+', tip: '소액이라도 건강 대비 시작!', color: '#fab1a0' },
    'R+D-T-F-': { emoji: '🌈', name: '낙천 미루미', code: 'R+D-T-F-', tip: '괜찮겠지~ 하지만 작은 준비는?', color: '#fd79a8' },
    'R-D+T+F+': { emoji: '🍀', name: '우연한 수비수', code: 'R-D+T+F+', tip: '잘 준비되어 있어요! 점검만', color: '#00b894' },
    'R-D+T+F-': { emoji: '🎰', name: '행운의 준비생', code: 'R-D+T+F-', tip: '재정 현황 한번 점검해보세요!', color: '#0984e3' },
    'R-D+T-F+': { emoji: '🔮', name: '무의식 가입자', code: 'R-D+T-F+', tip: '건강 대비 현황 점검해볼까요?', color: '#6c5ce7' },
    'R-D+T-F-': { emoji: '🕵️', name: '숨은 준비생', code: 'R-D+T-F-', tip: '재정 현황 체크해보세요', color: '#a29bfe' },
    'R-D-T+F+': { emoji: '⏰', name: '노후 무방비', code: 'R-D-T+F+', tip: '노후 대비, 지금 시작이 좋아요', color: '#e17055' },
    'R-D-T+F-': { emoji: '🚀', name: 'YOLO족', code: 'R-D-T+F-', tip: '즐기는 것도 좋지만, 건강도 챙겨요!', color: '#fdcb6e' },
    'R-D-T-F+': { emoji: '🐣', name: '순수 무방비', code: 'R-D-T-F+', tip: '걱정 마세요, 지금 시작하면 OK', color: '#f8a5c2' },
    'R-D-T-F-': { emoji: '🎲', name: '진정한 YOLO', code: 'R-D-T-F-', tip: '리스크? 그게 뭐죠? (근데 한번 생각해봐요)', color: '#ff6b6b' }
};

// Screen navigation
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

function startQuiz() {
    showScreen('q1');
}

// Question 1: Gender & Age
function selectGender(btn) {
    document.querySelectorAll('.gender-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    answers.gender = btn.dataset.value;
    updateNextButton(1);
}

// Age validation (0-99)
function validateAge(input) {
    let value = parseInt(input.value);
    if (isNaN(value) || value < 0) {
        input.value = 0;
    } else if (value > 99) {
        input.value = 99;
    }
}

function updateNextButton(questionNum) {
    const btn = document.querySelector(`#q${questionNum} .btn-next`);
    if (!btn) return;

    if (questionNum === 1) {
        btn.disabled = !answers.gender;
    } else if (questionNum === 3) {
        btn.disabled = answers.monthlyBudget === null;
    } else if (questionNum === 4) {
        btn.disabled = answers.timeOrientation === null;
    } else if (questionNum === 5) {
        btn.disabled = answers.financePref === null;
    }
}

function nextQuestion(currentQ) {
    if (currentQ === 1) {
        answers.age = parseInt(document.getElementById('ageInput').value) || 40;
        showScreen('q2');
    } else if (currentQ === 2) {
        showScreen('q3');
    } else if (currentQ === 3) {
        showScreen('q4');
    } else if (currentQ === 4) {
        showScreen('q5');
    }
}

// Question 2: Family History
function toggleDisease(btn) {
    btn.classList.toggle('selected');
    const disease = btn.dataset.value;
    const idx = answers.familyHistory.indexOf(disease);
    if (idx > -1) {
        answers.familyHistory.splice(idx, 1);
    } else {
        answers.familyHistory.push(disease);
    }
}

// Question 3: Budget
function selectBudget(btn) {
    document.querySelectorAll('.budget-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    answers.monthlyBudget = parseInt(btn.dataset.value);
    document.querySelector('#q3 .btn-next').disabled = false;
}

// Question 4: Time Orientation (NEW)
function selectTime(btn) {
    document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    answers.timeOrientation = btn.dataset.value;
    document.querySelector('#q4 .btn-next').disabled = false;
}

// Question 5: Finance Preference (NEW)
function selectFinance(btn) {
    document.querySelectorAll('.finance-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    answers.financePref = btn.dataset.value;
    document.querySelector('#q5 .btn-next').disabled = false;
}

// Calculate 16-type result
function calculateResult() {
    // Calculate 4 axes for 16 types

    // R (Risk Awareness): + if family history exists or health interest
    const R = answers.familyHistory.length > 0 ? '+' : '-';

    // D (Defense Action): + if monthly budget >= 20
    const D = answers.monthlyBudget >= 20 ? '+' : '-';

    // T (Time Orientation): + if long-term focused
    const T = answers.timeOrientation === 'long' ? '+' : '-';

    // F (Financial Preference): + if stable preference
    const F = answers.financePref === 'stable' ? '+' : '-';

    // Build type code
    const typeCode = `R${R}D${D}T${T}F${F}`;

    // Find main disease to prepare for
    let mainDisease = '뇌혈관질환';
    let maxRisk = 0;

    if (answers.familyHistory.length > 0) {
        mainDisease = answers.familyHistory[0];
    } else {
        for (const [disease, data] of Object.entries(DISEASE_DATA)) {
            const ageDiff = Math.abs(answers.age - data.peakAge);
            const adjustedRisk = data.riskPercent * (1 - ageDiff / 100);
            if (adjustedRisk > maxRisk) {
                maxRisk = adjustedRisk;
                mainDisease = disease;
            }
        }
    }

    const diseaseData = DISEASE_DATA[mainDisease];

    // Calculate peak age
    let peakAge = diseaseData.peakAge;
    if (answers.familyHistory.includes(mainDisease)) {
        peakAge -= 5;
    }

    // Calculate risk percent
    let riskPercent = diseaseData.riskPercent;
    if (answers.familyHistory.includes(mainDisease)) {
        riskPercent = Math.min(riskPercent * 1.5, 25);
    }

    // 피크 시기 + 치료 중간 시점 기준 연령대 계산 (발병 확률 높은 시점 기준)
    const treatmentMidpointAge = peakAge + Math.floor(diseaseData.treatmentMonths / 2 / 12);
    const incomeAgeGroup = Math.floor(treatmentMidpointAge / 10) * 10;
    const medianIncome = MEDIAN_INCOME[incomeAgeGroup] || MEDIAN_INCOME[50];

    // 직접 비용: 치료비 + 간병비 (인플레이션 반영)
    const yearsToRisk = Math.max(peakAge - answers.age, 0);
    const inflationRate = 1.03; // 의료비 인플레이션 3%
    const directCost = Math.round(diseaseData.directCost * Math.pow(inflationRate, yearsToRisk));

    // 간접 비용: 수입 중단 = 중위소득 × 치료기간
    const indirectCost = medianIncome * diseaseData.treatmentMonths;

    // 총 비용
    const totalCost = directCost + indirectCost;

    // Calculate defense percentage
    const defensePercent = Math.min(Math.round(answers.monthlyBudget * 2.5), 100);

    return {
        typeCode,
        mainDisease,
        peakAge,
        riskPercent: Math.round(riskPercent),
        directCost,
        indirectCost,
        totalCost,
        treatmentMonths: diseaseData.treatmentMonths,
        medianIncome,
        incomeAgeGroup,
        defensePercent
    };
}

// Show result
function showResult() {
    showScreen('loading');

    setTimeout(() => {
        const result = calculateResult();
        const typeData = TYPES_16[result.typeCode];

        // Update UI
        document.getElementById('typeEmoji').textContent = typeData.emoji;
        document.getElementById('typeName').textContent = typeData.name;
        document.getElementById('mainDisease').textContent = result.mainDisease;
        document.getElementById('peakAge').textContent = `${result.peakAge}세 (${result.riskPercent}%)`;

        // 비용 표시 (직접/간접/총)
        document.getElementById('directCost').textContent = `${result.directCost.toLocaleString()}만원`;
        document.getElementById('indirectCost').textContent = `${result.indirectCost.toLocaleString()}만원`;
        document.getElementById('totalCost').textContent = `${result.totalCost.toLocaleString()}만원`;
        document.getElementById('treatmentInfo').textContent =
            `${result.treatmentMonths}개월 기준, ${result.incomeAgeGroup}대 중위소득`;

        document.getElementById('defensePercent').textContent = `${result.defensePercent}%`;
        document.getElementById('defenseFill').style.width = `${result.defensePercent}%`;
        document.getElementById('resultTip').textContent = `💡 "${typeData.tip}"`;

        // Update colors based on type
        document.getElementById('resultCard').style.borderTop = `4px solid ${typeData.color}`;

        // Update Instagram card
        updateInstaCard({
            emoji: typeData.emoji,
            typeName: typeData.name,
            typeCode: result.typeCode,
            disease: result.mainDisease,
            totalCost: result.totalCost,
            defensePercent: result.defensePercent
        });

        showScreen('result');
    }, 1500);
}

// Share functions (Instagram/X focus)
async function saveImage() {
    const card = document.getElementById('resultCard');

    try {
        const canvas = await html2canvas(card, {
            scale: 2,
            backgroundColor: '#ffffff',
            borderRadius: 24
        });

        const link = document.createElement('a');
        link.download = '내_건강방어유형.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    } catch (e) {
        alert('이미지 저장에 실패했습니다. 스크린샷으로 저장해주세요!');
    }
}

function goToDetail() {
    window.location.href = '../index.html';
}

function retry() {
    // Reset answers
    answers.gender = null;
    answers.age = 40;
    answers.familyHistory = [];
    answers.monthlyBudget = 0;
    answers.timeOrientation = null;
    answers.financePref = null;

    // Reset UI
    document.querySelectorAll('.gender-btn, .disease-btn, .budget-btn, .time-btn, .finance-btn')
        .forEach(b => b.classList.remove('selected'));
    document.getElementById('ageInput').value = 40;
    document.querySelectorAll('.btn-next').forEach(b => b.disabled = true);

    showScreen('intro');
}

// 링크 복사
function copyLink() {
    const url = 'https://matbamn.github.io/life-hedge-simulator-/viral/';
    navigator.clipboard.writeText(url).then(() => {
        // 버튼 텍스트 변경으로 피드백
        const btn = document.querySelector('.btn-share');
        const original = btn.textContent;
        btn.textContent = '✅ 복사 완료!';
        setTimeout(() => {
            btn.textContent = original;
        }, 2000);
    }).catch(err => {
        // 폴백: 프롬프트로 보여주기
        prompt('링크를 복사하세요:', url);
    });
}
// Instagram Story 저장
function saveInstaStory() {
    const instaCard = document.getElementById('instaCard');

    // 캡처 전 화면에 잠시 표시 (html2canvas 필요)
    instaCard.style.left = '0';
    instaCard.style.position = 'fixed';
    instaCard.style.zIndex = '9999';

    html2canvas(instaCard, {
        width: 360,
        height: 640,
        scale: 3, // 1080x1920 고해상도
        useCORS: true,
        backgroundColor: null
    }).then(canvas => {
        // 다시 숨기기
        instaCard.style.left = '-9999px';

        // 다운로드
        const link = document.createElement('a');
        link.download = '건강방어유형_인스타스토리.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    });
}

// 인스타 카드 데이터 업데이트
function updateInstaCard(result) {
    document.getElementById('instaEmoji').textContent = result.emoji;
    document.getElementById('instaTypeName').textContent = result.typeName;
    document.getElementById('instaDisease').textContent = result.disease;
    document.getElementById('instaCost').textContent = result.totalCost.toLocaleString() + '만원';
    document.getElementById('instaDefensePercent').textContent = result.defensePercent + '%';
    document.getElementById('instaDefenseFill').style.width = result.defensePercent + '%';
}

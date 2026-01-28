// Viral MVP - Health Defense Type Quiz Logic

// User answers
const answers = {
    gender: null,
    age: 40,
    familyHistory: [],
    monthlyBudget: 0
};

// Disease risk data (simplified from HIRA data)
const DISEASE_DATA = {
    '위암': { peakAge: 65, riskPercent: 8, avgCost: 6500 },
    '대장암': { peakAge: 68, riskPercent: 10, avgCost: 7200 },
    '폐암': { peakAge: 70, riskPercent: 7, avgCost: 9500 },
    '뇌혈관질환': { peakAge: 58, riskPercent: 12, avgCost: 8500 },
    '허혈성심질환': { peakAge: 55, riskPercent: 9, avgCost: 7800 },
    '치매': { peakAge: 80, riskPercent: 15, avgCost: 12000 }
};

// Type definitions
const TYPES = {
    SAFE: { emoji: '🛡️', name: 'SAFE형', desc: '철벽 방어러', tip: '완벽한 준비! 유지만 잘 하면 돼요 👍' },
    PREP: { emoji: '⚖️', name: 'PREP형', desc: '준비된 현실주의자', tip: '피크 시기 전에 방어력 한번 점검해봐!' },
    HOPE: { emoji: '🌈', name: 'HOPE형', desc: '긍정 에너지', tip: '괜찮겠지~ 하지만 작은 준비는 어때요?' },
    YOLO: { emoji: '🎲', name: 'YOLO형', desc: '오늘을 사는 자', tip: '멋있긴 한데, 작은 방어막 하나 정도는?' }
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

function updateNextButton(questionNum) {
    const btn = document.querySelector(`#q${questionNum} .btn-next`);
    if (questionNum === 1) {
        btn.disabled = !answers.gender;
    } else if (questionNum === 3) {
        btn.disabled = answers.monthlyBudget === null;
    }
}

function nextQuestion(currentQ) {
    if (currentQ === 1) {
        answers.age = parseInt(document.getElementById('ageInput').value) || 40;
        showScreen('q2');
    } else if (currentQ === 2) {
        showScreen('q3');
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

// Calculate result
function calculateResult() {
    // Find main disease to prepare for
    let mainDisease = '뇌혈관질환'; // default
    let maxRisk = 0;

    // If family history exists, prioritize those
    if (answers.familyHistory.length > 0) {
        mainDisease = answers.familyHistory[0];
    } else {
        // Find highest risk based on age and gender
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

    // Calculate peak age (adjusted for family history)
    let peakAge = diseaseData.peakAge;
    if (answers.familyHistory.includes(mainDisease)) {
        peakAge -= 5; // Earlier risk with family history
    }

    // Calculate risk percent
    let riskPercent = diseaseData.riskPercent;
    if (answers.familyHistory.includes(mainDisease)) {
        riskPercent = Math.min(riskPercent * 1.5, 25);
    }

    // Calculate expected cost with inflation
    const yearsToRisk = Math.max(peakAge - answers.age, 0);
    const inflationRate = 1.05;
    const expectedCost = Math.round(diseaseData.avgCost * Math.pow(inflationRate, yearsToRisk));

    // Calculate defense percentage
    // Assumptions: 20만원/월 = 약 50% 방어력
    const defensePercent = Math.min(Math.round(answers.monthlyBudget * 2.5), 100);

    // Determine type
    let type;
    if (defensePercent >= 80) {
        type = 'SAFE';
    } else if (defensePercent >= 40) {
        type = 'PREP';
    } else if (defensePercent >= 15) {
        type = 'HOPE';
    } else {
        type = 'YOLO';
    }

    return {
        mainDisease,
        peakAge,
        riskPercent: Math.round(riskPercent),
        expectedCost,
        defensePercent,
        type
    };
}

// Show result
function showResult() {
    showScreen('loading');

    setTimeout(() => {
        const result = calculateResult();
        const typeData = TYPES[result.type];

        // Update UI
        document.getElementById('typeEmoji').textContent = typeData.emoji;
        document.getElementById('typeName').textContent = typeData.name;
        document.getElementById('typeDesc').textContent = typeData.desc;
        document.getElementById('mainDisease').textContent = result.mainDisease;
        document.getElementById('peakAge').textContent = `${result.peakAge}세 (${result.riskPercent}%)`;
        document.getElementById('expectedCost').textContent = `${result.expectedCost.toLocaleString()}만원`;
        document.getElementById('defensePercent').textContent = `${result.defensePercent}%`;
        document.getElementById('defenseFill').style.width = `${result.defensePercent}%`;
        document.getElementById('resultTip').textContent = `💡 "${typeData.tip}"`;

        showScreen('result');
    }, 1500);
}

// Share functions
function shareKakao() {
    // Kakao SDK would be integrated here
    // For MVP, just show alert
    alert('카카오톡 공유 기능은 실제 배포 시 활성화됩니다!\n\n지금은 이미지 저장으로 공유해주세요 📱');
}

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
    // Redirect to full simulator
    window.location.href = '../index.html';
}

function retry() {
    // Reset answers
    answers.gender = null;
    answers.age = 40;
    answers.familyHistory = [];
    answers.monthlyBudget = 0;

    // Reset UI
    document.querySelectorAll('.gender-btn, .disease-btn, .budget-btn').forEach(b => b.classList.remove('selected'));
    document.getElementById('ageInput').value = 40;
    document.querySelectorAll('.btn-next').forEach(b => b.disabled = true);

    showScreen('intro');
}

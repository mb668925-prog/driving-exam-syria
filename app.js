let currentQuestions = [];
let currentQuestionIndex = 0;
let userAnswers = {};
let isExamMode = false;
let timerInterval = null;
let timeLeft = 15 * 60; // 15 دقيقة

const optionLetters = ['أ', 'ب', 'ج', 'د'];

// خلط المصفوفة عشوائياً
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// التنقل بين الشاشات
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

function goHome() {
    clearInterval(timerInterval);
    showScreen('home-screen');
}

// 1. بدء وضع التدريب
function startTraining(categoryName) {
    isExamMode = false;
    currentQuestionIndex = 0;
    userAnswers = {};
    clearInterval(timerInterval);

    currentQuestions = questions.filter(q => q.category === categoryName);

    if (currentQuestions.length === 0) {
        alert("لا توجد أسئلة في هذا القسم حالياً.");
        return;
    }

    document.getElementById('timer').classList.add('hidden');
    showScreen('quiz-screen');
    renderQuestion();
}

// 2. بدء الاختبار التجريبي (30 سؤال: 10 من كل قسم + 15 دقيقة)
function startOfficialExam() {
    isExamMode = true;
    currentQuestionIndex = 0;
    userAnswers = {};

    const rulesQ = shuffleArray(questions.filter(q => q.category === "قواعد السير")).slice(0, 10);
    const signsQ = shuffleArray(questions.filter(q => q.category === "الإشارات")).slice(0, 10);
    const mechQ  = shuffleArray(questions.filter(q => q.category === "الميكانيك")).slice(0, 10);

    currentQuestions = shuffleArray([...rulesQ, ...signsQ, ...mechQ]);

    timeLeft = 15 * 60; // 15 دقيقة
    const timerEl = document.getElementById('timer');
    timerEl.classList.remove('hidden');

    showScreen('quiz-screen');
    startTimer();
    renderQuestion();
}

// 3. عرض السؤال الحالي
function renderQuestion() {
    const q = currentQuestions[currentQuestionIndex];
    const total = currentQuestions.length;

    // العداد وشريط التقدم
    document.getElementById('question-counter').textContent = `السؤال ${currentQuestionIndex + 1} من ${total}`;
    document.getElementById('progress-fill').style.width = `${((currentQuestionIndex + 1) / total) * 100}%`;
    document.getElementById('category-badge').textContent = q.category;
    document.getElementById('question-text').textContent = q.question;

    // الصورة
    const imgBox = document.getElementById('image-box');
    const imgEl = document.getElementById('question-image');
    if (q.image && q.image.trim() !== "") {
        imgEl.src = q.image;
        imgBox.classList.remove('hidden');
    } else {
        imgEl.src = "";
        imgBox.classList.add('hidden');
    }

    // الخيارات
    const optionsList = document.getElementById('options-list');
    optionsList.innerHTML = '';

    const feedbackBox = document.getElementById('feedback-box');
    feedbackBox.className = 'feedback-box hidden';

    const userSelected = userAnswers[currentQuestionIndex];
    const isAnswered = userSelected !== undefined;

    q.options.forEach((optText, idx) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerHTML = `<span class="option-letter">${optionLetters[idx]}</span><span>${optText}</span>`;

        if (isAnswered) {
            if (!isExamMode) {
                // وضع التدريب
                if (idx === q.correctIndex) {
                    btn.classList.add('correct-ans');
                } else if (idx === userSelected) {
                    btn.classList.add('wrong-ans');
                }
                btn.disabled = true;
            } else {
                // وضع الامتحان
                if (idx === userSelected) {
                    btn.classList.add('selected');
                }
            }
        }

        btn.onclick = () => selectOption(idx);
        optionsList.appendChild(btn);
    });

    // رسالة التصحيح الفوري في وضع التدريب
    if (!isExamMode && isAnswered) {
        feedbackBox.classList.remove('hidden');
        if (userSelected === q.correctIndex) {
            feedbackBox.classList.add('correct-fb');
            feedbackBox.textContent = "✅ إجابة صحيحة!";
        } else {
            feedbackBox.classList.add('wrong-fb');
            feedbackBox.textContent = `❌ إجابة خاطئة. الجواب الصحيح: ${q.options[q.correctIndex]}`;
        }
    }

    // أزرار التنقل
    document.getElementById('prev-btn').disabled = currentQuestionIndex === 0;
    const nextBtn = document.getElementById('next-btn');
    if (currentQuestionIndex === total - 1) {
        nextBtn.textContent = "إنهاء 🏁";
        nextBtn.className = "btn success-btn";
        nextBtn.onclick = finishQuiz;
    } else {
        nextBtn.textContent = "التالي ←";
        nextBtn.className = "btn primary-btn";
        nextBtn.onclick = nextQuestion;
    }
}

function selectOption(idx) {
    if (!isExamMode && userAnswers[currentQuestionIndex] !== undefined) return;
    userAnswers[currentQuestionIndex] = idx;
    renderQuestion();
}

function nextQuestion() {
    if (currentQuestionIndex < currentQuestions.length - 1) {
        currentQuestionIndex++;
        renderQuestion();
    }
}

function prevQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        renderQuestion();
    }
}

// 4. المؤقت
function startTimer() {
    clearInterval(timerInterval);
    updateTimerUI();
    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerUI();
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            alert("انتهى الوقت المحدد للاختبار (15 دقيقة)!");
            finishQuiz();
        }
    }, 1000);
}

function updateTimerUI() {
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    document.getElementById('timer').textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// 5. إنهاء وعرض النتيجة
function finishQuiz() {
    clearInterval(timerInterval);

    let correct = 0;
    let wrong = 0;
    let unanswered = 0;

    currentQuestions.forEach((q, idx) => {
        const ans = userAnswers[idx];
        if (ans === undefined) unanswered++;
        else if (ans === q.correctIndex) correct++;
        else wrong++;
    });

    const total = currentQuestions.length;
    const passed = correct >= Math.ceil(total * 0.8); // 24 من 30 للنجاح

    const badge = document.getElementById('result-badge');
    if (isExamMode) {
        badge.textContent = passed ? "🎉 ناجح في الاختبار!" : "❌ راسب (النجاح من 24/30)";
        badge.className = `result-badge ${passed ? 'pass' : 'fail'}`;
    } else {
        badge.textContent = "✅ اكتمل التدريب";
        badge.className = "result-badge pass";
    }

    document.getElementById('score-text').textContent = `النتيجة: ${correct} من ${total}`;
    document.getElementById('score-details').textContent = `صحيحة: ${correct} | خاطئة: ${wrong} | بدون إجابة: ${unanswered}`;

    // مراجعة الأخطاء
    const reviewList = document.getElementById('review-list');
    reviewList.innerHTML = '';

    currentQuestions.forEach((q, idx) => {
        const ans = userAnswers[idx];
        if (ans !== q.correctIndex) {
            const item = document.createElement('div');
            item.className = 'review-item wrong';
            const userText = ans !== undefined ? q.options[ans] : 'لم تتم الإجابة';
            item.innerHTML = `
                <strong>س${idx + 1} (${q.category}): ${q.question}</strong><br>
                <span style="color:#dc2626;">إجابتك: ${userText}</span><br>
                <span style="color:#16a34a;">الصحيح: ${q.options[q.correctIndex]}</span>
            `;
            reviewList.appendChild(item);
        }
    });

    if (reviewList.innerHTML === '') {
        reviewList.innerHTML = '<div class="review-item correct">ممتاز! جميع إجاباتك صحيحة 100%.</div>';
    }

    showScreen('result-screen');
}

// تسجيل الـ Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch(err => console.log(err));
    });
}
const API_BASE = 'https://resumeiq-backend-xjzs.onrender.com/api';

const token = localStorage.getItem('token');
const userName = localStorage.getItem('userName');
const resumeId = localStorage.getItem('currentResumeId');
const resumeFileName = localStorage.getItem('currentResumeFileName');

if (!token) {
  window.location.href = 'login.html';
}

document.getElementById('userNameLabel').textContent = userName || 'User';

document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.clear();
  window.location.href = 'login.html';
});

const resumeContext = document.getElementById('resumeContext');
if (resumeId && resumeFileName) {
  resumeContext.textContent = `Comparing: ${resumeFileName}`;
} else {
  resumeContext.textContent = 'No resume found — go back and upload one first.';
}

function handleAuthFailure() {
  localStorage.clear();
  window.location.href = 'login.html';
}

function safeParse(value, fallback) {
  try {
    return JSON.parse(value);
  } catch (e) {
    return fallback;
  }
}

const jdForm = document.getElementById('jdForm');
const compareStatus = document.getElementById('compareStatus');
const compareSubmitBtn = document.getElementById('compareSubmitBtn');
const factsTicker = document.getElementById('factsTicker');
const resultsEmpty = document.getElementById('resultsEmpty');
const resultsContent = document.getElementById('resultsContent');

let factsIntervalId = null;

function showLoadingState() {
  resultsEmpty.style.display = 'none';
  resultsContent.style.display = 'none';
  factsTicker.style.display = 'block';
  factsTicker.classList.add('active');
  factsIntervalId = startFactsRotator('factsTicker');
}

function hideLoadingState() {
  stopFactsRotator(factsIntervalId);
  factsTicker.classList.remove('active');
  factsTicker.style.display = 'none';
}

function showEmptyState() {
  resultsContent.style.display = 'none';
  resultsEmpty.style.display = 'block';
}

jdForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  if (!resumeId) {
    compareStatus.textContent = 'No resume found. Go back to the dashboard and upload one first.';
    compareStatus.className = 'status-line err';
    return;
  }

  const title = document.getElementById('jobTitle').value;
  const companyName = document.getElementById('companyName').value;
  const rawText = document.getElementById('jdText').value;

  compareSubmitBtn.disabled = true;
  compareSubmitBtn.textContent = 'Comparing...';
  compareStatus.textContent = 'Submitting job description';
  compareStatus.className = 'status-line pending';
  showLoadingState();

  try {
    // Step 1: create the job description
    const jdResponse = await fetch(`${API_BASE}/jobdescriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        resumeId: Number(resumeId),
        title,
        companyName,
        rawText
      })
    });

    if (jdResponse.status === 401 || jdResponse.status === 403) {
      handleAuthFailure();
      return;
    }

    const jdRawText = await jdResponse.text();

    if (!jdResponse.ok) {
      let message = jdRawText;
      try {
        const errorData = JSON.parse(jdRawText);
        message = errorData.message || jdRawText;
      } catch (e) { /* plain text */ }
      throw new Error(message);
    }

    const jdData = JSON.parse(jdRawText);
    const jobDescriptionId = jdData.id;

    // Step 2: run analysis with the jobDescriptionId
    compareStatus.textContent = 'Running comparison analysis';

    const analyzeResponse = await fetch(
      `${API_BASE}/analysis/analyze/${resumeId}?jobDescriptionId=${jobDescriptionId}`,
      {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );

    if (analyzeResponse.status === 401 || analyzeResponse.status === 403) {
      handleAuthFailure();
      return;
    }

    const analyzeRawText = await analyzeResponse.text();

    if (!analyzeResponse.ok) {
      let message = analyzeRawText;
      try {
        const errorData = JSON.parse(analyzeRawText);
        message = errorData.message || analyzeRawText;
      } catch (e) { /* plain text */ }
      throw new Error(message);
    }

    const result = JSON.parse(analyzeRawText);
    hideLoadingState();
    renderResults(result);

    compareStatus.textContent = 'Comparison complete';
    compareStatus.className = 'status-line ok';

  } catch (error) {
    hideLoadingState();
    showEmptyState();
    compareStatus.textContent = error.message || 'Comparison failed';
    compareStatus.className = 'status-line err';
  } finally {
    compareSubmitBtn.disabled = false;
    compareSubmitBtn.textContent = 'Compare resume against this JD';
  }
});

function renderResults(result) {
  resultsEmpty.style.display = 'none';
  resultsContent.style.display = 'block';

  const score = result.atsScore ?? 0;
  document.getElementById('scoreNumber').textContent = score;
  document.getElementById('overallSummary').textContent = result.overallSummary || 'No summary available.';

  const scoreTag = document.getElementById('scoreTag');
  if (score >= 75) {
    scoreTag.textContent = 'Strong match';
    scoreTag.className = 'score-tag strong';
  } else if (score >= 50) {
    scoreTag.textContent = 'Partial match';
    scoreTag.className = 'score-tag mid';
  } else {
    scoreTag.textContent = 'Weak match';
    scoreTag.className = 'score-tag weak';
  }

  const strengths = safeParse(result.strengths, []);
  const strengthsList = document.getElementById('strengthsList');
  strengthsList.innerHTML = '';
  (Array.isArray(strengths) ? strengths : [String(strengths)]).forEach(item => {
    const li = document.createElement('li');
    li.textContent = item;
    strengthsList.appendChild(li);
  });

  const weaknesses = safeParse(result.weaknesses, []);
  const weaknessesList = document.getElementById('weaknessesList');
  weaknessesList.innerHTML = '';
  (Array.isArray(weaknesses) ? weaknesses : [String(weaknesses)]).forEach(item => {
    const li = document.createElement('li');
    li.textContent = item;
    weaknessesList.appendChild(li);
  });

  const keywords = safeParse(result.missingKeywords, []);
  const chipsContainer = document.getElementById('keywordChips');
  chipsContainer.innerHTML = '';
  (Array.isArray(keywords) ? keywords : [String(keywords)]).forEach(kw => {
    const chip = document.createElement('span');
    chip.className = 'keyword-chip';
    chip.textContent = kw;
    chipsContainer.appendChild(chip);
  });
}
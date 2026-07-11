const API_BASE = 'http://localhost:8080/api';

const token = localStorage.getItem('token');
const userName = localStorage.getItem('userName');

// Guard: must be logged in
if (!token) {
  window.location.href = 'login.html';
}

document.getElementById('userNameLabel').textContent = userName || 'User';

// Logout
document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.clear();
  window.location.href = 'login.html';
});

// Elements
const fileInput = document.getElementById('resumeFile');
const uploadZoneText = document.getElementById('uploadZoneText');
const fileNameDisplay = document.getElementById('fileNameDisplay');
const uploadStatus = document.getElementById('uploadStatus');
const analyzeBtn = document.getElementById('analyzeBtn');
const compareBtn = document.getElementById('compareBtn');
const factsTicker = document.getElementById('factsTicker');
const resultsEmpty = document.getElementById('resultsEmpty');
const resultsContent = document.getElementById('resultsContent');

let currentResumeId = null;
let currentResumeFileName = null;

// Helper: handle 401/403 globally
function handleAuthFailure() {
  localStorage.clear();
  window.location.href = 'login.html';
}

// Helper: safe JSON field parse
function safeParse(value, fallback) {
  try {
    return JSON.parse(value);
  } catch (e) {
    return fallback;
  }
}

// Upload flow
fileInput.addEventListener('change', async () => {
  const file = fileInput.files[0];
  if (!file) return;

  fileNameDisplay.textContent = file.name;
  uploadStatus.textContent = 'Uploading...';
  uploadStatus.className = 'status-line pending';
  analyzeBtn.disabled = true;
  compareBtn.classList.remove('visible');
  currentResumeId = null;
  currentResumeFileName = null;

  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch(`${API_BASE}/resumes/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (response.status === 401 || response.status === 403) {
      handleAuthFailure();
      return;
    }

    const rawText = await response.text();

    if (!response.ok) {
      let message = rawText;
      try {
        const errorData = JSON.parse(rawText);
        message = errorData.message || rawText;
      } catch (e) { /* plain text */ }
      throw new Error(message);
    }

    const data = JSON.parse(rawText);
    currentResumeId = data.id;
    currentResumeFileName = file.name;

    uploadStatus.textContent = 'Uploaded successfully';
    uploadStatus.className = 'status-line ok';
    analyzeBtn.disabled = false;
    compareBtn.classList.add('visible');

  } catch (error) {
    uploadStatus.textContent = error.message || 'Upload failed';
    uploadStatus.className = 'status-line err';
    analyzeBtn.disabled = true;
    compareBtn.classList.remove('visible');
  }
});

// Analyze flow
analyzeBtn.addEventListener('click', async () => {
  if (!currentResumeId) return;

  analyzeBtn.disabled = true;
  analyzeBtn.textContent = 'Analyzing...';
  uploadStatus.textContent = 'Running analysis — this can take a few seconds';
  uploadStatus.className = 'status-line pending';

  factsTicker.classList.add('active');
  const factsIntervalId = startFactsRotator('factsTicker');

  try {
    const response = await fetch(`${API_BASE}/analysis/analyze/${currentResumeId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.status === 401 || response.status === 403) {
      handleAuthFailure();
      return;
    }

    const rawText = await response.text();

    if (!response.ok) {
      let message = rawText;
      try {
        const errorData = JSON.parse(rawText);
        message = errorData.message || rawText;
      } catch (e) { /* plain text */ }
      throw new Error(message);
    }

    const result = JSON.parse(rawText);
    renderResults(result);

    uploadStatus.textContent = 'Analysis complete';
    uploadStatus.className = 'status-line ok';

  } catch (error) {
    uploadStatus.textContent = error.message || 'Analysis failed';
    uploadStatus.className = 'status-line err';
  } finally {
    analyzeBtn.disabled = false;
    analyzeBtn.textContent = 'Analyze resume';
    stopFactsRotator(factsIntervalId);
    factsTicker.classList.remove('active');
  }
});

// Compare button flow — hands off to compare.html
compareBtn.addEventListener('click', () => {
  if (!currentResumeId) return;
  localStorage.setItem('currentResumeId', currentResumeId);
  localStorage.setItem('currentResumeFileName', currentResumeFileName || 'your resume');
  window.location.href = 'compare.html';
});

function renderResults(result) {
  resultsEmpty.style.display = 'none';
  resultsContent.style.display = 'block';

  const score = result.atsScore ?? 0;
  document.getElementById('scoreNumber').textContent = score;
  document.getElementById('overallSummary').textContent = result.overallSummary || 'No summary available.';

  const scoreTag = document.getElementById('scoreTag');
  if (score >= 75) {
    scoreTag.textContent = 'Strong';
    scoreTag.className = 'score-tag strong';
  } else if (score >= 50) {
    scoreTag.textContent = 'Needs work';
    scoreTag.className = 'score-tag mid';
  } else {
    scoreTag.textContent = 'Weak';
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
const IT_FACTS = [
  "Most ATS systems parse resumes as plain text — fancy tables and columns can scramble your content.",
  "A resume can be parsed in milliseconds but a great story still takes years to build.",
  "Recruiters spend an average of 6-7 seconds on an initial resume scan.",
  "The best resume is often the one optimized for both algorithms and humans.",
  "ATS systems are getting better at understanding context and nuance.",
  "Keyword matching is still the #1 filter most ATS platforms use before a human ever sees your resume.",
  "Listing 'proficient in Java' means less to an ATS than showing a project built with it.",
  "PDF is generally safer than DOCX for ATS parsing, as long as it's not a scanned image.",
  "Quantified bullet points ('reduced load time by 40%') score higher than duty-based ones.",
  "Most job descriptions list more 'nice to have' skills than are actually required — focus on the top 3-4.",
  "Generic objective statements are increasingly ignored by both ATS and recruiters.",
  "A resume tailored per job description consistently outperforms a one-size-fits-all version.",
  "Section headers like 'Skills' and 'Experience' should stay standard — creative renames can confuse parsers.",
  "More than 70% of developers say they learned programming partly through building games.",
  "Python is named after Monty Python, not the snake.",
  "The first computer virus was created in 1986 and was called Brain.",
];

function startFactsRotator(elementId, intervalMs = 2600) {
  const el = document.getElementById(elementId);
  if (!el) return null;

  let index = Math.floor(Math.random() * IT_FACTS.length);
  el.textContent = IT_FACTS[index];

  const intervalId = setInterval(() => {
    index = (index + 1) % IT_FACTS.length;
    el.textContent = IT_FACTS[index];
  }, intervalMs);

  return intervalId;
}

function stopFactsRotator(intervalId) {
  if (intervalId) clearInterval(intervalId);
}
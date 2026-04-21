import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const examDir = resolve(__dirname, '../../practice-exam');
const outDir = resolve(__dirname, '../src/data');

function parseAnswerString(raw) {
  const str = raw.trim();
  if (str.includes(',')) {
    return str.split(',').map((a) => a.trim().toUpperCase());
  }
  if (str.length > 1 && /^[A-E]+$/.test(str)) {
    return str.split('').map((a) => a.toUpperCase());
  }
  return [str.toUpperCase()];
}

function parseExamFile(filename, examNumber) {
  const content = readFileSync(resolve(examDir, filename), 'utf-8');
  const questions = [];

  // Split on <details ...> blocks — each question ends with one
  // We'll walk line-by-line to track state
  const lines = content.split('\n');

  let currentQuestion = null;
  let inDetails = false;
  let detailsLines = [];

  for (const line of lines) {
    // Start of a question — numbered line that isn't inside a details block
    if (!inDetails) {
      const qMatch = line.match(/^\d+\.\s+([\s\S]+)/);
      if (qMatch) {
        if (currentQuestion) questions.push(currentQuestion);
        const questionText = qMatch[1]
          .replace(/<br\s*\/?>/gi, ' ')
          .replace(/&amp;/g, '&')
          .trim();
        const multiSelect =
          /choose two|select two|choose 2|select 2/i.test(questionText);
        currentQuestion = {
          id: `exam${examNumber}-q${questions.length + 1}`,
          examNumber,
          question: questionText,
          options: [],
          answers: [],
          explanation: null,
          multiSelect,
        };
        continue;
      }

      // Option line
      const optMatch = line.match(/^\s+-\s+([A-E])\.\s+(.+)/);
      if (optMatch && currentQuestion) {
        currentQuestion.options.push({
          key: optMatch[1].toUpperCase(),
          text: optMatch[2].trim(),
        });
        continue;
      }
    }

    // Details block open
    if (line.includes('<details')) {
      inDetails = true;
      detailsLines = [];
      continue;
    }

    if (inDetails) {
      if (line.includes('</details>')) {
        inDetails = false;
        const detailsText = detailsLines.join('\n');

        // Correct answer — handle both capitalisations
        const answerMatch = detailsText.match(
          /Correct [Aa]nswer:\s*([A-E][A-E,\s]*)/
        );
        if (answerMatch && currentQuestion) {
          const parsed = parseAnswerString(answerMatch[1]);
          currentQuestion.answers = parsed;
          if (parsed.length > 1) currentQuestion.multiSelect = true;
        }

        // Explanation URL or text
        const explMatch = detailsText.match(/Explanation:\s*<?(https?:\/\/[^\s>]+)>?/);
        if (explMatch && currentQuestion) {
          currentQuestion.explanation = explMatch[1].trim();
        }

        detailsLines = [];
      } else {
        detailsLines.push(line);
      }
    }
  }

  if (currentQuestion) questions.push(currentQuestion);
  return questions;
}

// Parse all 23 exam files
const allQuestions = [];
const examSummary = [];

for (let i = 1; i <= 23; i++) {
  const filename = `practice-exam-${i}.md`;
  const questions = parseExamFile(filename, i);
  allQuestions.push(...questions);
  examSummary.push({ examNumber: i, count: questions.length });
  console.log(`Exam ${i}: ${questions.length} questions`);
}

console.log(`\nTotal questions: ${allQuestions.length}`);

// Write to src/data/
mkdirSync(outDir, { recursive: true });

const output = `// Auto-generated — do not edit manually
// Run: node scripts/parse-exams.mjs

export const questions = ${JSON.stringify(allQuestions, null, 2)};

export const examSummary = ${JSON.stringify(examSummary, null, 2)};
`;

writeFileSync(resolve(outDir, 'questions.js'), output);
console.log(`\nWritten to src/data/questions.js`);

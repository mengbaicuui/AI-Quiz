import { NextRequest, NextResponse } from 'next/server';
import { quizData, totalPoints, questionGroups } from '../../../lib/questions';

interface SubmitRequest {
  userName: string;
  answers: {
    questionIndex: number;
    answer: string | string[];
  }[];
}

interface WrongAnswer {
  questionNumber: number;
  question: string;
  correctAnswer: string;
  userAnswer: string;
  options?: string[];
  questionType: string;
  explanation?: string;
}

interface ShortAnswerItem {
  questionNumber: number;
  question: string;
  userAnswer: string;
  referenceAnswer: string;
}

interface SubmitResponse {
  score: number;
  totalPoints: number;
  resultText: string;
  wrongAnswers: WrongAnswer[];
  shortAnswerFeedback: string;
  shortAnswerDetails: ShortAnswerItem[];
  groupScores?: {
    groupId: string;
    title: string;
    score: number;
    totalPoints: number;
    resultText: string;
  }[];
}

function calculateObjectiveScore(answers: SubmitRequest['answers']): {
  score: number;
  wrongAnswers: WrongAnswer[];
} {
  let score = 0;
  const wrongAnswers: WrongAnswer[] = [];

  answers.forEach(({ questionIndex, answer }) => {
    const question = quizData[questionIndex];
    if (!question || question.type === 'textarea') return;

    const correctAnswer = question.answer;
    let isCorrect = false;

    if (question.type === 'radio') {
      isCorrect = answer === correctAnswer;
    } else if (question.type === 'checkbox') {
      const userAnswers = Array.isArray(answer) ? answer.sort() : [answer].sort();
      const correctAnswers = Array.isArray(correctAnswer) ? correctAnswer.sort() : [correctAnswer].sort();
      isCorrect = JSON.stringify(userAnswers) === JSON.stringify(correctAnswers);
    }

    if (isCorrect) {
      score += question.points;
    } else {
      wrongAnswers.push({
        questionNumber: questionIndex + 1,
        question: question.question,
        correctAnswer: Array.isArray(correctAnswer) ? correctAnswer.join(', ') : correctAnswer || '',
        userAnswer: Array.isArray(answer) ? answer.join(', ') : answer || '未作答',
        options: question.options,
        questionType: question.type,
        explanation: question.explanation,
      });
    }
  });

  return { score, wrongAnswers };
}

function getResultText(totalScore: number, maxPoints: number): string {
  const percentage = (totalScore / maxPoints) * 100;
  if (percentage >= 80) return '优秀 ✨';
  if (percentage >= 60) return '通过 👍';
  return '不通过 🔴';
}

function calculateGroupScores(answers: SubmitRequest['answers']): {
  groupId: string;
  title: string;
  score: number;
  totalPoints: number;
  resultText: string;
}[] {
  const groupScores = [];
  let currentIndex = 0;

  for (const group of questionGroups) {
    let groupScore = 0;
    const groupTotalPoints = group.questions.reduce((sum, q) => sum + q.points, 0);

    for (let i = 0; i < group.questions.length; i++) {
      const questionIndex = currentIndex + i;
      const question = group.questions[i];
      const answerData = answers.find(a => a.questionIndex === questionIndex);

      if (!answerData || question.type === 'textarea') continue;

      const correctAnswer = question.answer;
      let isCorrect = false;

      if (question.type === 'radio') {
        isCorrect = answerData.answer === correctAnswer;
      } else if (question.type === 'checkbox') {
        const userAnswers = Array.isArray(answerData.answer) ? answerData.answer.sort() : [answerData.answer].sort();
        const correctAnswers = Array.isArray(correctAnswer) ? correctAnswer.sort() : [correctAnswer].sort();
        isCorrect = JSON.stringify(userAnswers) === JSON.stringify(correctAnswers);
      }

      if (isCorrect) {
        groupScore += question.points;
      }
    }

    groupScores.push({
      groupId: group.id,
      title: group.title,
      score: groupScore,
      totalPoints: groupTotalPoints,
      resultText: getResultText(groupScore, groupTotalPoints),
    });

    currentIndex += group.questions.length;
  }

  return groupScores;
}

function getFinalResultText(groupScores: { resultText: string }[]): string {
  const allExcellent = groupScores.every(g => g.resultText === '优秀 ✨');
  const allPassed = groupScores.every(g => g.resultText === '优秀 ✨' || g.resultText === '通过 👍');
  if (allExcellent) return '优秀 ✨';
  if (allPassed) return '通过 👍';
  return '不通过 🔴';
}

async function saveToGoogleSheets(data: {
  userName: string;
  score: number;
  totalPoints: number;
  resultText: string;
  objectiveScore: number;
  shortAnswerScore: number;
  shortAnswerFeedback: string;
  wrongAnswers: { questionNumber: number; question: string; correctAnswer: string; }[];
  rawAnswers: SubmitRequest['answers'];
}): Promise<void> {
  try {
    const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
    const adminToken = process.env.ADMIN_TOKEN;
    if (!webhookUrl || !adminToken) return;

    const response = await fetch(`${webhookUrl}?token=${adminToken}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      console.error('Google Sheets API error:', response.status);
    }
  } catch (error) {
    console.error('Failed to save to Google Sheets:', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: SubmitRequest = await request.json();
    const { userName, answers } = body;

    if (!userName || !answers || !Array.isArray(answers)) {
      return NextResponse.json({ error: '请求数据格式错误' }, { status: 400 });
    }

    const { score: objectiveScore, wrongAnswers } = calculateObjectiveScore(answers);
    let groupScores = calculateGroupScores(answers);

    // 简答题：展示参考答案，提交即给满分
    let totalShortAnswerScore = 0;
    const allShortAnswerFeedback: string[] = [];
    const shortAnswerDetails: ShortAnswerItem[] = [];

    for (let groupIndex = 0; groupIndex < questionGroups.length; groupIndex++) {
      const group = questionGroups[groupIndex];
      let groupStartIndex = 0;
      for (let i = 0; i < groupIndex; i++) {
        groupStartIndex += questionGroups[i].questions.length;
      }
      for (let i = 0; i < group.questions.length; i++) {
        const question = group.questions[i];
        if (question.type === 'textarea') {
          const globalIndex = groupStartIndex + i;
          const questionNum = globalIndex + 1;
          const answerData = answers.find(a => a.questionIndex === globalIndex);
          if (answerData && typeof answerData.answer === 'string') {
            totalShortAnswerScore += question.points;
            groupScores[groupIndex].score += question.points;
            groupScores[groupIndex].resultText = getResultText(
              groupScores[groupIndex].score,
              groupScores[groupIndex].totalPoints
            );
          }
          const ref = question.referenceAnswer?.trim() || '';
          if (ref) {
            allShortAnswerFeedback.push(`【${group.title}】第${questionNum}题 参考答案：\n${ref}`);
          }
          shortAnswerDetails.push({
            questionNumber: questionNum,
            question: question.question,
            userAnswer: (answerData && typeof answerData.answer === 'string') ? answerData.answer : '未作答',
            referenceAnswer: ref,
          });
        }
      }
    }

    const totalScore = objectiveScore + totalShortAnswerScore;
    const finalResultText = getFinalResultText(groupScores);

    const response: SubmitResponse = {
      score: totalScore,
      totalPoints,
      resultText: finalResultText,
      wrongAnswers,
      shortAnswerFeedback: allShortAnswerFeedback.join('\n\n'),
      shortAnswerDetails,
      groupScores,
    };

    saveToGoogleSheets({
      userName,
      score: totalScore,
      totalPoints,
      resultText: finalResultText,
      objectiveScore,
      shortAnswerScore: totalShortAnswerScore,
      shortAnswerFeedback: allShortAnswerFeedback.join('\n\n'),
      wrongAnswers,
      rawAnswers: answers,
      groupScores,
    } as any).catch(err => console.error('Background save failed:', err));

    return NextResponse.json(response);
  } catch (error) {
    console.error('Submit API error:', error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}

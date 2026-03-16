'use client';

import { useState } from 'react';
import { questionGroups, quizData } from '../lib/questions';
import type { Question } from '../lib/questions';

// 定义API返回的结果类型
interface ResultData {
  score: number;
  totalPoints: number;
  resultText: string;
  wrongAnswers: {
    questionNumber: number;
    question: string;
    correctAnswer: string;
    explanation?: string;
  }[];
  shortAnswerFeedback: string;
  groupScores?: {
    groupId: string;
    title: string;
    score: number;
    totalPoints: number;
    resultText: string;
  }[];
}

// 结果展示组件
function ResultCard({ resultData, userName }: { resultData: ResultData; userName: string }) {
    let resultClass = '';
    let resultIcon = '';
    let resultGradient = '';
    let scorePercentage = (resultData.score / resultData.totalPoints) * 100;

    switch(resultData.resultText) {
        case '不通过 🔴':
            resultClass = 'bg-gradient-to-br from-red-50 to-red-100 border-red-300';
            resultIcon = '😔';
            resultGradient = 'from-red-500 to-red-600';
            break;
        case '通过 👍':
            resultClass = 'bg-gradient-to-br from-green-50 to-green-100 border-green-300';
            resultIcon = '👍';
            resultGradient = 'from-green-500 to-green-600';
            break;
        case '优秀 ✨':
            resultClass = 'bg-gradient-to-br from-blue-50 to-purple-100 border-blue-300';
            resultIcon = '🎉';
            resultGradient = 'from-blue-500 to-purple-600';
            break;
    }

  return (
    <div className="animate-fade-in-up">
      {/* 主结果卡片 */}
      <div className={`p-8 rounded-2xl border-2 shadow-xl ${resultClass}`}>
        {/* 结果标题 */}
        <div className="text-center mb-6">
          <div className="text-6xl mb-4 animate-bounce-in">{resultIcon}</div>
          <h2 className="text-3xl font-bold mb-2">
            <span className="text-gray-700">{userName}</span>
            <span className="text-gray-500 text-xl ml-2">的测验结果</span>
          </h2>
          <div className={`inline-block px-6 py-2 rounded-full bg-gradient-to-r ${resultGradient} text-white font-bold text-xl shadow-lg`}>
            {resultData.resultText}
          </div>
        </div>

        {/* 分数展示 */}
        <div className="bg-white/70 backdrop-blur rounded-xl p-6 mb-6 shadow-inner">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="text-center">
              <div className="text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                {resultData.score}
              </div>
              <div className="text-sm text-gray-500 mt-1">获得分数</div>
            </div>
            <div className="text-3xl text-gray-400">/</div>
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-600">
                {resultData.totalPoints}
              </div>
              <div className="text-sm text-gray-500 mt-1">总分</div>
            </div>
          </div>

          {/* 进度条 */}
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${resultGradient} rounded-full transition-all duration-1000 ease-out`}
              style={{ width: `${scorePercentage}%` }}
            ></div>
          </div>
          <div className="text-center mt-2 text-sm text-gray-600">
            正确率: {scorePercentage.toFixed(1)}%
          </div>
        </div>

        {/* 分组得分展示 */}
        {resultData.groupScores && resultData.groupScores.length > 0 && (
          <div className="bg-white/70 backdrop-blur rounded-xl p-6 mb-6 shadow-inner">
            <h3 className="font-bold text-lg mb-4 flex items-center text-indigo-600">
              <span className="text-2xl mr-2">📊</span>
              各组得分详情
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {resultData.groupScores.map((group, idx) => {
                const groupPercentage = (group.score / group.totalPoints) * 100;
                let groupGradient = '';
                let groupBg = '';

                if (group.resultText === '优秀 ✨') {
                  groupGradient = 'from-blue-500 to-purple-600';
                  groupBg = 'from-blue-50 to-purple-50';
                } else if (group.resultText === '通过 👍') {
                  groupGradient = 'from-green-500 to-green-600';
                  groupBg = 'from-green-50 to-green-50';
                } else {
                  groupGradient = 'from-red-500 to-red-600';
                  groupBg = 'from-red-50 to-red-50';
                }

                return (
                  <div key={idx} className={`bg-gradient-to-br ${groupBg} border-2 border-gray-200 rounded-lg p-4`}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-800">{group.title}</h4>
                      <span className={`text-xs px-2 py-1 rounded-full bg-gradient-to-r ${groupGradient} text-white font-medium`}>
                        {group.resultText}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-2xl font-bold text-gray-800">{group.score}</span>
                      <span className="text-gray-500">/ {group.totalPoints} 分</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${groupGradient} rounded-full transition-all duration-1000`}
                        style={{ width: `${groupPercentage}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {groupPercentage.toFixed(1)}%
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 错题解析 */}
        {resultData.wrongAnswers.length > 0 && (
          <div className="bg-white/70 backdrop-blur rounded-xl p-6 mb-6 shadow-inner">
            <h3 className="font-bold text-lg mb-4 flex items-center text-red-600">
              <span className="text-2xl mr-2">📝</span>
              错题解析
            </h3>
            <div className="space-y-3">
              {resultData.wrongAnswers.map((item, index) => (
                <div key={index} className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
                  <div className="font-semibold text-gray-800 mb-2">
                    <span className="inline-block w-6 h-6 bg-red-500 text-white rounded-full text-center text-sm leading-6 mr-2">
                      {item.questionNumber}
                    </span>
                    {item.question}
                  </div>
                  <div className="text-sm text-gray-700 ml-8 space-y-1">
                    <div>
                      <span className="font-semibold text-green-600">✓ 正确答案：</span>
                      <span className="ml-2">{item.correctAnswer}</span>
                    </div>
                    {item.explanation && (
                      <div className="mt-2 text-gray-600 border-t border-red-100 pt-2">
                        <span className="font-semibold text-gray-700">解析：</span>
                        {item.explanation}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 参考答案 */}
        {resultData.shortAnswerFeedback && (
          <div className="bg-white/70 backdrop-blur rounded-xl p-4 shadow-inner">
            <h3 className="font-bold text-sm mb-2 text-gray-700">参考答案</h3>
            <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
              {resultData.shortAnswerFeedback}
            </p>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes bounce-in {
          0% {
            transform: scale(0);
          }
          50% {
            transform: scale(1.2);
          }
          100% {
            transform: scale(1);
          }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out;
        }
        .animate-bounce-in {
          animation: bounce-in 0.6s ease-out;
        }
      `}</style>
    </div>
  );
}


export default function QuizClient() {
  const [answers, setAnswers] = useState<Record<number, string | string[]>>({});
  const [userName, setUserName] = useState('');
  const [quizState, setQuizState] = useState<'not_started' | 'in_progress' | 'submitting' | 'completed'>('not_started');
  const [result, setResult] = useState<ResultData | null>(null);
  const [currentPage, setCurrentPage] = useState(0); // 当前页码（从0开始）

  const handleInputChange = (questionIndex: number, answer: string, isCheckbox: boolean) => {
    setAnswers(prev => {
      if (isCheckbox) {
        const existing = (prev[questionIndex] as string[] || []);
        if (existing.includes(answer)) {
          return { ...prev, [questionIndex]: existing.filter(a => a !== answer) };
        } else {
          return { ...prev, [questionIndex]: [...existing, answer] };
        }
      }
      return { ...prev, [questionIndex]: answer };
    });
  };

  const startQuiz = () => {
    if (userName.trim() === '') {
      alert('请输入你的名字开始测验。');
      return;
    }
    setQuizState('in_progress');
    setCurrentPage(0);
  };

  // 获取当前组的题目及其全局索引
  const getCurrentGroupQuestions = () => {
    const currentGroup = questionGroups[currentPage];
    let startIndex = 0;

    // 计算当前组题目的起始索引
    for (let i = 0; i < currentPage; i++) {
      startIndex += questionGroups[i].questions.length;
    }

    return {
      group: currentGroup,
      questions: currentGroup.questions,
      startIndex: startIndex,
    };
  };

  // 检查当前页是否所有必填题都已回答
  const isCurrentPageComplete = () => {
    const { questions, startIndex } = getCurrentGroupQuestions();

    for (let i = 0; i < questions.length; i++) {
      const globalIndex = startIndex + i;
      const question = questions[i];

      // 检查必填题（所有题目都是必填的）
      if (!answers[globalIndex]) {
        return false;
      }

      // 对于多选题，检查是否至少选了一个
      if (question.type === 'checkbox') {
        const answer = answers[globalIndex];
        if (!Array.isArray(answer) || answer.length === 0) {
          return false;
        }
      }
    }

    return true;
  };

  // 下一页
  const goToNextPage = () => {
    if (currentPage < questionGroups.length - 1) {
      setCurrentPage(currentPage + 1);
      // 滚动到顶部
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // 上一页
  const goToPreviousPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
      // 滚动到顶部
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // 是否是最后一页
  const isLastPage = () => {
    return currentPage === questionGroups.length - 1;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setQuizState('submitting');
    
    // 格式化答案以发送到后端
    const formattedAnswers = Object.entries(answers).map(([key, value]) => ({
      questionIndex: parseInt(key),
      answer: value,
    }));

    try {
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userName, answers: formattedAnswers }),
      });
      
      if (!response.ok) {
        throw new Error('评估请求失败');
      }

      const data: ResultData = await response.json();
      setResult(data);
      setQuizState('completed');

    } catch (error) {
      console.error(error);
      alert('提交失败，请检查网络并重试。');
      setQuizState('in_progress');
    }
  };

  if (quizState === 'not_started') {
    return (
      <div className="text-center py-8 animate-fade-in">
        {/* 欢迎信息 */}
        <div className="mb-8">
          <div className="text-6xl mb-4">🎯</div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">欢迎参加测验</h3>
          <p className="text-gray-600">请输入你的姓名开始答题</p>
        </div>

        {/* 输入框 */}
        <div className="max-w-md mx-auto space-y-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <span className="text-gray-400 text-xl">👤</span>
            </div>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="请输入你的名字"
              className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none text-lg"
              onKeyDown={(e) => e.key === 'Enter' && startQuiz()}
            />
          </div>

          <button
            onClick={startQuiz}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-4 px-6 rounded-xl hover:from-blue-700 hover:to-indigo-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
          >
            <span className="text-xl">🚀</span>
            <span>开始测验</span>
          </button>
        </div>

        {/* 提示信息 */}
        <div className="mt-8 text-sm text-gray-500 space-y-2">
          <p>💡 共 20 道题目，包含单选、多选和简答题</p>
          <p>⏱️ 预计用时 10-15 分钟</p>
          <p>✍️ 提交后可查看参考答案</p>
        </div>
      </div>
    );
  }

  if (quizState === 'completed' && result) {
    return <ResultCard resultData={result} userName={userName} />;
  }

  // 获取当前组信息
  const { group, questions, startIndex } = getCurrentGroupQuestions();
  const totalAnswered = Object.keys(answers).length;
  const totalQuestions = quizData.length;

  return (
    <form onSubmit={handleSubmit} className="animate-fade-in">
      {/* 页面标题和进度 */}
      <div className="mb-8">
        {/* 分页指示器 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-500">
              第 {currentPage + 1} 页 / 共 {questionGroups.length} 页
            </span>
          </div>
          <div className="flex gap-1">
            {questionGroups.map((_, idx) => (
              <div
                key={idx}
                className={`w-8 h-1 rounded-full transition-all ${
                  idx === currentPage
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-500'
                    : idx < currentPage
                    ? 'bg-green-400'
                    : 'bg-gray-200'
                }`}
              ></div>
            ))}
          </div>
        </div>

        {/* 组标题 */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">{group.icon}</span>
            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
              {group.title}
            </h2>
          </div>
          <p className="text-gray-600 ml-14">{group.description}</p>
        </div>

        {/* 整体进度 */}
        <div className="mt-4 bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">总体进度</span>
            <span className="text-sm text-gray-600">
              {totalAnswered} / {totalQuestions} 题
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-300"
              style={{ width: `${(totalAnswered / totalQuestions) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* 当前组的题目列表 */}
      <div className="space-y-6">
        {questions.map((q: Question, localIndex: number) => {
          const globalIndex = startIndex + localIndex;
          return (
          <div
            key={globalIndex}
            className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-6 border-2 border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all duration-200"
          >
            {/* 题目标题 */}
            <div className="flex items-start gap-3 mb-4">
              <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-lg flex items-center justify-center font-bold shadow-md">
                {localIndex + 1}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-800 text-lg leading-relaxed whitespace-pre-line">
                  {q.question}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    q.type === 'radio' ? 'bg-blue-100 text-blue-700' :
                    q.type === 'checkbox' ? 'bg-purple-100 text-purple-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {q.type === 'radio' ? '📻 单选题' : q.type === 'checkbox' ? '☑️ 多选题' : '✍️ 简答题'}
                  </span>
                  <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700 font-medium">
                    {q.points} 分
                  </span>
                </div>
              </div>
            </div>

            {/* 选项 */}
            {q.type === 'radio' && (
              <div className="space-y-2 ml-11">
                {q.options?.map((opt: string) => (
                  <label
                    key={opt}
                    className="flex items-center p-3 rounded-lg border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 cursor-pointer transition-all group"
                  >
                    <input
                      type="radio"
                      name={`q${globalIndex}`}
                      value={opt.split('.')[0]}
                      onChange={(e) => handleInputChange(globalIndex, e.target.value, false)}
                      className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="ml-3 text-gray-700 group-hover:text-gray-900 font-medium">{opt}</span>
                  </label>
                ))}
              </div>
            )}

            {q.type === 'checkbox' && (
              <div className="space-y-2 ml-11">
                {q.options?.map((opt: string) => (
                  <label
                    key={opt}
                    className="flex items-center p-3 rounded-lg border-2 border-gray-200 hover:border-purple-400 hover:bg-purple-50 cursor-pointer transition-all group"
                  >
                    <input
                      type="checkbox"
                      name={`q${globalIndex}`}
                      value={opt.split('.')[0]}
                      onChange={(e) => handleInputChange(globalIndex, e.target.value, true)}
                      className="w-4 h-4 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                    />
                    <span className="ml-3 text-gray-700 group-hover:text-gray-900 font-medium">{opt}</span>
                  </label>
                ))}
              </div>
            )}

            {q.type === 'textarea' && (
              <div className="ml-11">
                <textarea
                  id={q.id}
                  placeholder="请填写你的答案..."
                  className="w-full p-4 border-2 border-gray-200 rounded-lg min-h-[150px] focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all outline-none resize-none"
                  onChange={(e) => handleInputChange(globalIndex, e.target.value, false)}
                ></textarea>
                <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                  <span>💡</span>
                  <span>建议字数：100-300字</span>
                </div>
              </div>
            )}
          </div>
          );
        })}
      </div>

      {/* 页面导航按钮 */}
      <div className="mt-8 flex gap-4">
        {/* 上一页按钮 */}
        {currentPage > 0 && (
          <button
            type="button"
            onClick={goToPreviousPage}
            className="flex-1 bg-white border-2 border-gray-300 text-gray-700 font-semibold py-4 px-6 rounded-xl hover:border-gray-400 hover:bg-gray-50 transform hover:scale-[1.02] transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
          >
            <span>←</span>
            <span>上一页</span>
          </button>
        )}

        {/* 下一页或提交按钮 */}
        {isLastPage() ? (
          <button
            type="submit"
            disabled={quizState === 'submitting'}
            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-4 px-6 rounded-xl hover:from-blue-700 hover:to-indigo-700 transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3"
          >
            {quizState === 'submitting' ? (
              <>
                <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>正在提交结果...</span>
              </>
            ) : (
              <>
                <span className="text-xl">🎯</span>
                <span>提交评估</span>
              </>
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={goToNextPage}
            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-4 px-6 rounded-xl hover:from-blue-700 hover:to-indigo-700 transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
          >
            <span>下一页</span>
            <span>→</span>
          </button>
        )}
      </div>
    </form>
  );
}

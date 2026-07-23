import React, { useState, useEffect } from 'react';
import { AppStorageState, Question, QuizConfig, QuizResult, UserAnswerRecord } from '../types';
import { calculateAndUpdateStreak, saveAppState, resolveImagePath } from '../utils/storage';
import { getTranslation } from '../utils/i18n';
import { CheckCircle2, XCircle, ArrowRight, ArrowLeft, Clock, Award, RotateCcw, FileText, Check, AlertCircle, Image as ImageIcon, Grid, HelpCircle } from 'lucide-react';
import { quizSounds } from '../utils/sound';

interface QuizViewProps {
  appState: AppStorageState;
  config: QuizConfig;
  onFinishQuiz: (result: QuizResult) => void;
  onExitQuiz: () => void;
}

export const QuizView: React.FC<QuizViewProps> = ({
  appState,
  config,
  onFinishQuiz,
  onExitQuiz,
}) => {
  const { collections, quizResults, settings } = appState;
  const lang = settings.language;

  // 1. Gather Questions based on Quiz Mode
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // User responses
  const [userAnswers, setUserAnswers] = useState<Map<number, number>>(new Map()); // questionIndex -> selectedOptionIndex (0-3)
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set());
  const [timeSpentSeconds, setTimeSpentSeconds] = useState(0);

  // Practice Mode state
  const [showExplanation, setShowExplanation] = useState<Map<number, boolean>>(new Map());

  // Exam Mode state
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState<number | null>(null);
  const [showGridModal, setShowGridModal] = useState(false);
  const [isExamCompleted, setIsExamCompleted] = useState(false);
  const [finalResult, setFinalResult] = useState<QuizResult | null>(null);

  // Shuffled options per question to prevent positional bias
  const [shuffledQuestionsMap, setShuffledQuestionsMap] = useState<
    Map<number, { options: [string, string, string, string]; correctIndex: number }>
  >(new Map());

  const [retryCount, setRetryCount] = useState(0);

  // Initialize questions on mount or retry
  useEffect(() => {
    let selectedQuestions: Question[] = [];

    if (config.mode === 'PRACTICE' || config.mode === 'EXAM') {
      const col = collections.find((c) => c.id === config.collectionId) || collections[0];
      if (col && col.questions.length > 0) {
        // Randomize questions without replacement
        selectedQuestions = [...col.questions].sort(() => Math.random() - 0.5);
        if (config.questionCount) {
          selectedQuestions = selectedQuestions.slice(0, config.questionCount);
        }
      }
    } else if (config.mode === 'MISTAKE_REVIEW') {
      // Gather incorrect questions from historical records
      const incorrectIds = new Set<string>();
      quizResults.forEach((res) => {
        res.answerRecords.forEach((ans) => {
          if (!ans.isCorrect) incorrectIds.add(ans.questionId);
        });
      });

      const allQs = collections.flatMap((c) => c.questions);
      selectedQuestions = allQs.filter((q) => incorrectIds.has(q.id));
      if (selectedQuestions.length === 0) {
        selectedQuestions = allQs.slice(0, 10); // fallback
      }
    } else if (config.mode === 'WEAK_TOPICS') {
      const allQs = collections.flatMap((c) => c.questions);
      // Randomize weak topic questions
      selectedQuestions = [...allQs].sort(() => Math.random() - 0.5).slice(0, config.questionCount || 10);
    }

    setQuestions(selectedQuestions);

    // Prepare option shuffling (BR-8)
    const shuffledMap = new Map();
    selectedQuestions.forEach((q, idx) => {
      // Option index map: [0, 1, 2, 3] shuffled
      const indices = [0, 1, 2, 3].sort(() => Math.random() - 0.5);
      const shuffledOpts: [string, string, string, string] = [
        q.options[indices[0]],
        q.options[indices[1]],
        q.options[indices[2]],
        q.options[indices[3]],
      ];
      const newCorrectIdx = indices.indexOf(q.correctIndex);
      shuffledMap.set(idx, { options: shuffledOpts, correctIndex: newCorrectIdx });
    });
    setShuffledQuestionsMap(shuffledMap);

    // Initialize timer if Exam Mode
    if (config.mode === 'EXAM' && config.timeLimitMinutes) {
      setTimeRemainingSeconds(config.timeLimitMinutes * 60);
    }
  }, [retryCount]);

  // Auto-scroll to top on question change or exam completion (Item 2)
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentIndex, isExamCompleted]);

  // Timer Tick
  useEffect(() => {
    if (isExamCompleted) return;

    const timer = setInterval(() => {
      setTimeSpentSeconds((prev) => prev + 1);

      if (timeRemainingSeconds !== null) {
        setTimeRemainingSeconds((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(timer);
            handleFinalSubmit(); // Auto-submit when timer expires
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemainingSeconds, isExamCompleted]);

  const currentQ = questions[currentIndex];
  const shuffledData = shuffledQuestionsMap.get(currentIndex);

  const handleSelectOption = (optionIndex: number) => {
    if (isExamCompleted) return;

    const alreadyAnswered = userAnswers.has(currentIndex);

    setUserAnswers((prev) => {
      const next = new Map(prev);
      next.set(currentIndex, optionIndex);
      return next;
    });

    if (config.mode === 'PRACTICE' || config.mode === 'MISTAKE_REVIEW') {
      setShowExplanation((prev) => {
        const next = new Map(prev);
        next.set(currentIndex, true);
        return next;
      });

      // Play sound on first option selection
      if (!alreadyAnswered) {
        const shuff = shuffledQuestionsMap.get(currentIndex);
        if (shuff) {
          const isCorrect = optionIndex === shuff.correctIndex;
          if (isCorrect) {
            quizSounds.playRightAnswer();
          } else {
            quizSounds.playWrongAnswer();
          }
        }
      }
    }
  };

  const toggleFlag = (idx: number) => {
    setFlaggedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const handleFinalSubmit = () => {
    if (isExamCompleted) return;

    // Build answer records
    const records: UserAnswerRecord[] = questions.map((q, idx) => {
      const shuff = shuffledQuestionsMap.get(idx);
      const selected = userAnswers.get(idx) ?? -1;
      const isCorrect = shuff ? selected === shuff.correctIndex : false;

      return {
        questionId: q.id,
        questionText: q.questionText,
        category: q.category || 'General',
        selectedOptionIndex: selected,
        correctOptionIndex: shuff ? shuff.correctIndex : q.correctIndex,
        isCorrect,
        timeSpentSeconds: Math.round(timeSpentSeconds / Math.max(1, questions.length)),
        shuffledOptions: shuff?.options ? [...shuff.options] : [...q.options],
        originalCorrectText: q.options[q.correctIndex],
      };
    });

    const correctCount = records.filter((r) => r.isCorrect).length;
    const totalQuestions = questions.length;
    const scorePercentage = Math.round((correctCount / Math.max(1, totalQuestions)) * 100);
    const passMark = config.passMarkPercentage || appState.settings.defaultPassMark || 70;
    const passed = scorePercentage >= passMark;

    const result: QuizResult = {
      id: `res_${Date.now()}`,
      collectionId: config.collectionId,
      collectionName: config.collectionName || `${config.mode} Session`,
      mode: config.mode,
      date: new Date().toISOString(),
      totalQuestions,
      correctCount,
      scorePercentage,
      passed,
      timeSpentSeconds,
      answerRecords: records,
    };

    setFinalResult(result);
    setIsExamCompleted(true);
    onFinishQuiz(result);

    // Play exam pass/fail sound effects
    if (config.mode === 'EXAM') {
      if (passed) {
        quizSounds.playPassExam();
      } else {
        quizSounds.playFailedExam();
      }
    }
  };

  if (questions.length === 0) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
        <p className="text-xs text-slate-500 mb-4">
          {lang === 'zh'
            ? '此会话没有可用题目。请导入或选择包含题目的知识库。'
            : lang === 'ms'
            ? 'Tiada soalan tersedia untuk sesi ini. Sila import atau pilih koleksi pengetahuan dengan soalan.'
            : 'No questions available for this session. Please import or select a knowledge collection with questions.'}
        </p>
        <button
          onClick={onExitQuiz}
          className="px-4 py-2 bg-indigo-600 text-white font-semibold text-xs rounded-xl"
        >
          {lang === 'zh' ? '返回仪表板' : lang === 'ms' ? 'Kembali ke Papan Pemuka' : 'Return to Dashboard'}
        </button>
      </div>
    );
  }

  // Render Final Exam Results Summary View
  if (isExamCompleted && finalResult) {
    return (
      <div className="space-y-6 pb-12 max-w-3xl mx-auto">
        <div className="p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl text-center">
          <div
            className={`w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center ${
              finalResult.passed
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
            }`}
          >
            <Award className="w-8 h-8" />
          </div>

          <span
            className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 ${
              finalResult.passed
                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'
            }`}
          >
            {finalResult.passed ? getTranslation(lang, 'passed') : getTranslation(lang, 'failed')}
          </span>

          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 mb-1">
            {finalResult.scorePercentage}%
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
            {lang === 'zh'
              ? `及格分数要求: ${config.passMarkPercentage || 70}%`
              : lang === 'ms'
              ? `Keperluan markah lulus: ${config.passMarkPercentage || 70}%`
              : `Pass mark requirement: ${config.passMarkPercentage || 70}%`}
          </p>

          <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl mb-6 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px]">
                {lang === 'zh' ? '题目总数' : lang === 'ms' ? 'Jumlah Soalan' : 'Total Questions'}
              </span>
              <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                {finalResult.totalQuestions}
              </span>
            </div>
            <div>
              <span className="text-emerald-600 dark:text-emerald-400 block text-[10px]">
                {lang === 'zh' ? '正确题数' : lang === 'ms' ? 'Jawapan Betul' : 'Correct Answers'}
              </span>
              <span className="font-bold text-emerald-700 dark:text-emerald-300 text-sm">
                {finalResult.correctCount}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">
                {lang === 'zh' ? '所用时间' : lang === 'ms' ? 'Masa Diambil' : 'Time Spent'}
              </span>
              <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                {Math.floor(finalResult.timeSpentSeconds / 60)}{lang === 'zh' ? '分' : 'm'} {finalResult.timeSpentSeconds % 60}{lang === 'zh' ? '秒' : 's'}
              </span>
            </div>
          </div>

          <div className="flex justify-center gap-3">
            <button
              onClick={onExitQuiz}
              className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs"
            >
              {lang === 'zh' ? '返回仪表板' : lang === 'ms' ? 'Kembali ke Papan Pemuka' : 'Back to Dashboard'}
            </button>
            <button
              onClick={() => {
                setIsExamCompleted(false);
                setFinalResult(null);
                setCurrentIndex(0);
                setUserAnswers(new Map());
                setShowExplanation(new Map());
                setFlaggedQuestions(new Set());
                setTimeSpentSeconds(0);
                setShowGridModal(false);
                setRetryCount((prev) => prev + 1);
              }}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-xs shadow-md shadow-indigo-500/20"
            >
              {getTranslation(lang, 'retryQuiz')}
            </button>
          </div>
        </div>

        {/* Detailed Answer Breakdown */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-3">
            {lang === 'zh'
              ? (config.mode === 'EXAM' ? '试卷答案回顾' : '练习答案回顾与解析')
              : lang === 'ms'
              ? (config.mode === 'EXAM' ? 'Semakan Jawapan Peperiksaan' : 'Semakan Jawapan & Penerangan')
              : (config.mode === 'EXAM' ? 'Answer Review' : 'Answer Review & Explanations')}
          </h3>

          {finalResult.answerRecords.map((ans, idx) => {
            const matchedQ = questions.find((q) => q.id === ans.questionId);
            return (
              <div
                key={idx}
                className={`p-4 rounded-xl border text-xs space-y-2 ${
                  ans.isCorrect
                    ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
                    : 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    Q{idx + 1}. {ans.questionText}
                  </span>
                  {ans.isCorrect ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                </div>

                {matchedQ?.image && (
                  <div className="my-2 max-h-48 rounded-xl overflow-hidden border border-[#E8E2D2] dark:border-[#353B35] bg-[#F5F2EA] dark:bg-[#2D322D] flex items-center justify-center p-1.5 w-fit max-w-full">
                    <img
                      src={resolveImagePath(matchedQ.image)}
                      alt="Question diagram"
                      className="max-h-44 object-contain rounded-lg"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                {ans.shuffledOptions?.map((opt, oIdx) => {
                  const isSelected = ans.selectedOptionIndex === oIdx;
                  const isCorrectOpt = ans.correctOptionIndex === oIdx;

                  return (
                    <div
                      key={oIdx}
                      className={`p-2 rounded-lg border text-[11px] ${
                        isCorrectOpt
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border-emerald-300 font-bold'
                          : isSelected
                          ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-200 border-rose-300 font-bold'
                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <span>{String.fromCharCode(65 + oIdx)}. {opt}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )})}
        </div>
      </div>
    );
  }

  // Active Quiz View
  return (
    <div className="space-y-6 pb-12 max-w-3xl mx-auto">
      {/* Top Session Progress Bar & Controls */}
      <div className="p-4 bg-white dark:bg-[#242824] rounded-2xl border border-[#E8E2D2] dark:border-[#353B35] shadow-sm flex items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#5A6D5B] dark:text-[#A3B5A4] block font-serif">
            {lang === 'zh'
              ? (config.mode === 'PRACTICE'
                  ? '练习模式'
                  : config.mode === 'EXAM'
                  ? '模拟考试模式'
                  : config.mode === 'MISTAKE_REVIEW'
                  ? '错题复习模式'
                  : '薄弱专项训练')
              : lang === 'ms'
              ? (config.mode === 'PRACTICE'
                  ? 'MOD LATIHAN'
                  : config.mode === 'EXAM'
                  ? 'MOD PEPERIKSAAN'
                  : config.mode === 'MISTAKE_REVIEW'
                  ? 'MOD SEMAKAN KESILAPAN'
                  : 'LATIHAN TOPIK LEMAH')
              : `${config.mode} MODE`}
          </span>
          <div className="text-xs font-extrabold text-[#2D2A26] dark:text-[#EAE7DF]">
            {lang === 'zh'
              ? `第 ${currentIndex + 1} 题，共 ${questions.length} 题`
              : lang === 'ms'
              ? `Soalan ${currentIndex + 1} daripada ${questions.length}`
              : `Question ${currentIndex + 1} of ${questions.length}`}
          </div>
        </div>

        {/* Timer if Exam */}
        {timeRemainingSeconds !== null && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F5F2EA] dark:bg-[#2D322D] text-[#3E4A3E] dark:text-[#F5F2EA] font-mono text-xs font-bold border border-[#E8E2D2] dark:border-[#353B35]">
            <Clock className="w-4 h-4 text-[#5A6D5B]" />
            <span>
              {Math.floor(timeRemainingSeconds / 60)
                .toString()
                .padStart(2, '0')}
              :{(timeRemainingSeconds % 60).toString().padStart(2, '0')}
            </span>
          </div>
        )}

        <div className="flex items-center gap-2">
          {config.mode === 'EXAM' && (
            <button
              onClick={() => setShowGridModal(true)}
              className="p-2 rounded-xl bg-[#F5F2EA] dark:bg-[#2D322D] text-[#2D2A26] dark:text-[#EAE7DF] text-xs font-semibold hover:bg-[#EAE5D8] transition-colors border border-[#E8E2D2] dark:border-[#353B35]"
              title={lang === 'zh' ? '题目导航网格' : lang === 'ms' ? 'Grid Penunjuk Soalan' : 'Question Navigator Grid'}
            >
              <Grid className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={onExitQuiz}
            className="text-xs font-semibold px-3 py-1.5 bg-[#F5F2EA] dark:bg-[#2D322D] text-[#2D2A26] dark:text-[#EAE7DF] rounded-xl hover:bg-[#EAE5D8] transition-colors border border-[#E8E2D2] dark:border-[#353B35]"
          >
            {lang === 'zh' ? '退出' : lang === 'ms' ? 'Keluar' : 'Exit'}
          </button>
        </div>
      </div>

      {/* Progress Line */}
      <div className="w-full bg-[#EAE5D8] dark:bg-[#383E38] h-1.5 rounded-full overflow-hidden">
        <div
          className="bg-[#5A6D5B] h-full transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* Main Question Display Card */}
      <div className="p-6 bg-white dark:bg-[#242824] rounded-3xl border border-[#E8E2D2] dark:border-[#353B35] shadow-sm space-y-6">
        <div className="flex items-center justify-between text-xs text-[#7C776B] dark:text-[#A09886]">
          <span className="font-semibold text-[#6B6559] dark:text-[#A09886]">
            {lang === 'zh' ? '知识点: ' : lang === 'ms' ? 'Topik: ' : 'Topic: '}{currentQ.category || (lang === 'zh' ? '常规' : 'General')}
          </span>
          {config.mode === 'EXAM' && (
            <button
              onClick={() => toggleFlag(currentIndex)}
              className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition-colors ${
                flaggedQuestions.has(currentIndex)
                  ? 'bg-[#D9C5B2] text-[#2D2A26] border-[#B8C0B0]'
                  : 'bg-[#F5F2EA] text-[#6B6559] border-[#E8E2D2] dark:bg-[#2D322D] dark:text-[#A09886] dark:border-[#353B35]'
              }`}
            >
              {lang === 'zh'
                ? (flaggedQuestions.has(currentIndex) ? '★ 已标记' : '☆ 标记待复查')
                : lang === 'ms'
                ? (flaggedQuestions.has(currentIndex) ? '★ Ditandakan' : '☆ Tanda untuk Semakan')
                : (flaggedQuestions.has(currentIndex) ? '★ Flagged' : '☆ Flag for Review')}
            </button>
          )}
        </div>

        {/* Question Text */}
        <h3 className="text-base font-bold text-[#3E4A3E] dark:text-[#F5F2EA] leading-relaxed font-serif">
          {currentQ.questionText}
        </h3>

        {/* Supporting Image Attachment if any */}
        {currentQ.image && (
          <div className="my-3 max-h-64 rounded-2xl overflow-hidden border border-[#E8E2D2] dark:border-[#353B35] bg-[#F5F2EA] dark:bg-[#2D322D] flex items-center justify-center p-2">
            <img
              src={resolveImagePath(currentQ.image)}
              alt="Question supporting diagram"
              className="max-h-60 object-contain rounded-xl"
            />
          </div>
        )}

        {/* 4 Selectable Answer Options A-D */}
        <div className="space-y-2.5 pt-2">
          {shuffledData?.options.map((optText, oIdx) => {
            const isSelected = userAnswers.get(currentIndex) === oIdx;
            const isCorrectOption = oIdx === shuffledData.correctIndex;
            const isRevealed =
              (config.mode === 'PRACTICE' || config.mode === 'MISTAKE_REVIEW') &&
              showExplanation.get(currentIndex);

            let optionStyle =
              'bg-[#F5F2EA] dark:bg-[#2D322D] border-[#E8E2D2] dark:border-[#353B35] text-[#2D2A26] dark:text-[#EAE7DF] hover:bg-[#EAE5D8]';

            if (isSelected) {
              optionStyle =
                'bg-[#EAE5D8] dark:bg-[#383E38] border-[#5A6D5B] text-[#3E4A3E] dark:text-[#F5F2EA] font-bold shadow-sm';
            }

            if (isRevealed) {
              if (isCorrectOption) {
                optionStyle =
                  'bg-[#5A6D5B]/20 border-[#5A6D5B] text-[#3E4A3E] dark:text-[#F5F2EA] font-bold';
              } else if (isSelected && !isCorrectOption) {
                optionStyle =
                  'bg-rose-100/80 dark:bg-rose-950/60 border-rose-400 text-rose-900 dark:text-rose-200 font-bold';
              }
            }

            return (
              <button
                key={oIdx}
                onClick={() => handleSelectOption(oIdx)}
                className={`w-full p-3.5 rounded-2xl border text-left text-xs transition-all flex items-start gap-3 ${optionStyle}`}
              >
                <span className="w-6 h-6 rounded-lg bg-white/80 dark:bg-[#1C1E1C]/80 font-bold flex items-center justify-center text-xs shrink-0 border border-current opacity-80">
                  {String.fromCharCode(65 + oIdx)}
                </span>
                <span className="mt-0.5 font-medium leading-normal">{optText}</span>
              </button>
            );
          })}
        </div>

        {/* Explanation Reveal in Practice Mode */}
        {(config.mode === 'PRACTICE' || config.mode === 'MISTAKE_REVIEW') &&
          showExplanation.get(currentIndex) && (
            <div className="p-4 rounded-2xl bg-[#F5F2EA] dark:bg-[#2D322D] border border-[#E8E2D2] dark:border-[#353B35] text-xs space-y-1">
              <span className="font-bold text-[#3E4A3E] dark:text-[#F5F2EA] block flex items-center gap-1.5 font-serif">
                <HelpCircle className="w-4 h-4 text-[#5A6D5B]" />
                {lang === 'zh' ? '解析:' : lang === 'ms' ? 'Penerangan:' : 'Explanation:'}
              </span>
              <p className="text-[#2D2A26] dark:text-[#EAE7DF] leading-relaxed">
                {currentQ.explanation || (lang === 'zh' ? '该题未提供具体解析。' : lang === 'ms' ? 'Tiada penerangan diberikan untuk soalan ini.' : 'No explicit explanation provided for this question.')}
              </p>
              {currentQ.sourceReference && (
                <div className="mt-2 pt-2 border-t border-[#EAE5D8] dark:border-[#353B35] text-[11px] text-[#5A6D5B] dark:text-[#A3B5A4] flex items-center gap-1">
                  <span className="font-bold">
                    {lang === 'zh' ? '参考来源: ' : lang === 'ms' ? 'Rujukan Sumber: ' : 'Source Reference: '}
                  </span>
                  <span>{currentQ.sourceReference}</span>
                </div>
              )}
            </div>
          )}

        {/* Navigation Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-[#E8E2D2] dark:border-[#353B35]">
          <button
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex((prev) => prev - 1)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#F5F2EA] dark:bg-[#2D322D] text-[#2D2A26] dark:text-[#EAE7DF] font-semibold text-xs disabled:opacity-40 border border-[#E8E2D2] dark:border-[#353B35]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{lang === 'zh' ? '上一题' : lang === 'ms' ? 'Sebelumnya' : 'Previous'}</span>
          </button>

          {currentIndex < questions.length - 1 ? (
            <button
              onClick={() => setCurrentIndex((prev) => prev + 1)}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#5A6D5B] hover:bg-[#485749] text-white font-semibold text-xs transition-all shadow-sm"
            >
              <span>{lang === 'zh' ? '下一题' : lang === 'ms' ? 'Seterusnya' : 'Next Question'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleFinalSubmit}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-[#3E4A3E] hover:bg-[#2E372E] text-white font-bold text-xs transition-all shadow-sm"
            >
              <span>{lang === 'zh' ? (config.mode === 'EXAM' ? '提交试卷' : '结束测试') : lang === 'ms' ? (config.mode === 'EXAM' ? 'Hantar Peperiksaan' : 'Tamat Sesi') : (config.mode === 'EXAM' ? 'Submit Exam' : 'Submit Session')}</span>
              <Check className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Grid Navigator Modal for Exam Mode */}
      {showGridModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full">
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 mb-4">
              {lang === 'zh' ? '题目导航网格' : lang === 'ms' ? 'Grid Penunjuk Soalan' : 'Question Navigator Grid'}
            </h3>

            <div className="grid grid-cols-5 gap-2 max-h-60 overflow-y-auto mb-6">
              {questions.map((_, idx) => {
                const isAnswered = userAnswers.has(idx);
                const isCurrent = idx === currentIndex;
                const isFlagged = flaggedQuestions.has(idx);

                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setCurrentIndex(idx);
                      setShowGridModal(false);
                    }}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                      isCurrent
                        ? 'ring-2 ring-indigo-500 border-indigo-500'
                        : ''
                    } ${
                      isAnswered
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {idx + 1} {isFlagged ? '★' : ''}
                  </button>
                );
              })}
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowGridModal(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl"
              >
                {lang === 'zh' ? '关闭' : lang === 'ms' ? 'Tutup' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

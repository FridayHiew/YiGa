import React, { useMemo } from 'react';
import { AppStorageState, QuizConfig } from '../types';
import { calculateCategoryMetrics, calculateOverallStats } from '../utils/analytics';
import { getTranslation } from '../utils/i18n';
import { BarChart3, Target, Award, Clock, RotateCcw, AlertTriangle, CheckCircle2, XCircle, Folder, Layers, Shield, Sparkles } from 'lucide-react';

interface AnalyticsViewProps {
  appState: AppStorageState;
  onStartQuiz: (config: QuizConfig) => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  appState,
  onStartQuiz,
}) => {
  const { collections, quizResults, settings } = appState;
  const lang = settings.language;

  const stats = calculateOverallStats(quizResults);
  const allQuestions = collections.flatMap((c) => c.questions);
  const categoryMetrics = calculateCategoryMetrics(quizResults, allQuestions);

  // Calculate Group Performance
  const groupStats = useMemo(() => {
    const map: Record<string, { groupName: string; totalCols: number; totalQuestions: number; attempts: number; correct: number }> = {};
    collections.forEach((col) => {
      const gName = col.group?.trim() || 'General';
      if (!map[gName]) {
        map[gName] = { groupName: gName, totalCols: 0, totalQuestions: 0, attempts: 0, correct: 0 };
      }
      map[gName].totalCols += 1;
      map[gName].totalQuestions += col.questions.length;
    });

    // Match quiz results to groups
    quizResults.forEach((res) => {
      const col = collections.find((c) => c.id === res.collectionId);
      const gName = col?.group?.trim() || 'General';
      if (map[gName]) {
        map[gName].attempts += res.totalQuestions;
        map[gName].correct += res.correctCount;
      }
    });

    return Object.values(map);
  }, [collections, quizResults]);

  // Calculate Difficulty Level Breakdown
  const difficultyStats = useMemo(() => {
    const diffMap: Record<string, { totalQuestions: number; count: number }> = {
      Beginner: { totalQuestions: 0, count: 0 },
      Intermediate: { totalQuestions: 0, count: 0 },
      Master: { totalQuestions: 0, count: 0 },
    };

    collections.forEach((col) => {
      const diff = col.difficulty || 'Master';
      if (diffMap[diff]) {
        diffMap[diff].totalQuestions += col.questions.length;
        diffMap[diff].count += 1;
      } else {
        diffMap['Master'].totalQuestions += col.questions.length;
        diffMap['Master'].count += 1;
      }
    });

    return diffMap;
  }, [collections]);

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h2 className="text-xl font-bold text-[#3E4A3E] dark:text-[#F5F2EA] font-serif">
          {getTranslation(lang, 'analytics')}
        </h2>
        <p className="text-xs text-[#7C776B] dark:text-[#A09886]">
          {lang === 'zh' ? '全面查看学习表现、学科分组进度和难度评估指标' : 'Comprehensive learning performance, subject group progress, and difficulty metrics'}
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-[#242824] rounded-2xl border border-[#E8E2D2] dark:border-[#353B35] shadow-sm">
          <span className="text-[10px] font-bold text-[#7C776B] uppercase tracking-wider block mb-1">
            {lang === 'zh' ? '总测试次数' : 'Total Sessions'}
          </span>
          <span className="text-2xl font-extrabold text-[#2D2A26] dark:text-[#EAE7DF] font-serif">
            {stats.totalSessions}
          </span>
        </div>

        <div className="p-4 bg-white dark:bg-[#242824] rounded-2xl border border-[#E8E2D2] dark:border-[#353B35] shadow-sm">
          <span className="text-[10px] font-bold text-[#7C776B] uppercase tracking-wider block mb-1">
            {getTranslation(lang, 'questionsAnswered')}
          </span>
          <span className="text-2xl font-extrabold text-[#2D2A26] dark:text-[#EAE7DF] font-serif">
            {stats.totalQuestionsAnswered}
          </span>
        </div>

        <div className="p-4 bg-white dark:bg-[#242824] rounded-2xl border border-[#E8E2D2] dark:border-[#353B35] shadow-sm">
          <span className="text-[10px] font-bold text-[#7C776B] uppercase tracking-wider block mb-1">
            {getTranslation(lang, 'overallAccuracy')}
          </span>
          <span className="text-2xl font-extrabold text-[#5A6D5B] dark:text-[#A3B5A4] font-serif">
            {stats.overallAccuracy}%
          </span>
        </div>

        <div className="p-4 bg-white dark:bg-[#242824] rounded-2xl border border-[#E8E2D2] dark:border-[#353B35] shadow-sm">
          <span className="text-[10px] font-bold text-[#7C776B] uppercase tracking-wider block mb-1">
            {getTranslation(lang, 'timeSpent')}
          </span>
          <span className="text-2xl font-extrabold text-[#2D2A26] dark:text-[#EAE7DF] font-serif">
            {Math.floor(stats.totalTimeSpentSeconds / 60)}{lang === 'zh' ? '分钟' : 'm'}
          </span>
        </div>
      </div>

      {/* Subject Folders / Group Performance */}
      <div className="p-5 bg-white dark:bg-[#242824] rounded-2xl border border-[#E8E2D2] dark:border-[#353B35] shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-[#E8E2D2] dark:border-[#353B35] pb-3">
          <Folder className="w-5 h-5 text-[#5A6D5B]" />
          <h3 className="font-bold text-sm text-[#3E4A3E] dark:text-[#F5F2EA] font-serif">
            {lang === 'zh' ? '学科分类与分组表现' : 'Subject Folders & Groups Breakdown'}
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {groupStats.map((g) => {
            const acc = g.attempts > 0 ? Math.round((g.correct / g.attempts) * 100) : 0;
            return (
              <div
                key={g.groupName}
                className="p-3.5 bg-[#F5F2EA]/60 dark:bg-[#2D322D]/60 rounded-xl border border-[#E8E2D2] dark:border-[#353B35] text-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-[#2D2A26] dark:text-[#EAE7DF] flex items-center gap-1.5 font-serif">
                      <Folder className="w-3.5 h-3.5 text-[#5A6D5B]" />
                      {g.groupName}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#5A6D5B]/10 text-[#5A6D5B] dark:text-[#A3B5A4] border border-[#5A6D5B]/20">
                      {g.totalCols} {lang === 'zh' ? '个集合' : g.totalCols === 1 ? 'Col' : 'Cols'}
                    </span>
                  </div>

                  <p className="text-[11px] text-[#7C776B] dark:text-[#A09886]">
                    {g.totalQuestions} {lang === 'zh' ? '道题目可供练习' : 'Questions Available'}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-[#E8E2D2]/60 dark:border-[#353B35]">
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-[#7C776B] dark:text-[#A09886]">{lang === 'zh' ? '正确率:' : 'Accuracy:'}</span>
                    <span className="font-bold text-[#5A6D5B] dark:text-[#A3B5A4]">
                      {g.attempts > 0 ? `${acc}%` : (lang === 'zh' ? '暂未测试' : 'Not Attempted')}
                    </span>
                  </div>
                  <div className="w-full bg-[#EAE5D8] dark:bg-[#383E38] h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-[#5A6D5B] h-full rounded-full transition-all"
                      style={{ width: `${acc}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Difficulty Level Distribution */}
      <div className="p-5 bg-white dark:bg-[#242824] rounded-2xl border border-[#E8E2D2] dark:border-[#353B35] shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-[#E8E2D2] dark:border-[#353B35] pb-3">
          <Layers className="w-5 h-5 text-[#5A6D5B]" />
          <h3 className="font-bold text-sm text-[#3E4A3E] dark:text-[#F5F2EA] font-serif">
            {lang === 'zh' ? '难度评估分布矩阵' : 'Difficulty Level Matrix'}
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {(['Beginner', 'Intermediate', 'Master'] as const).map((lvl) => {
            const data = difficultyStats[lvl];
            const badges = {
              Beginner: {
                color: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300',
                icon: '🟢',
                name: lang === 'zh' ? '初级 (Beginner)' : 'Beginner',
                desc: lang === 'zh' ? '基础概念与核心术语定义' : 'Foundational terminology & core definitions',
              },
              Intermediate: {
                color: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300',
                icon: '🟡',
                name: lang === 'zh' ? '中级 (Intermediate)' : 'Intermediate',
                desc: lang === 'zh' ? '实战场景应用与流程操作' : 'Practical scenario application & workflows',
              },
              Master: {
                color: 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300',
                icon: '🔴',
                name: lang === 'zh' ? '高级 (Master)' : 'Master',
                desc: lang === 'zh' ? '专家级疑难排查与综合案例分析' : 'Expert troubleshooting & complex case studies',
              },
            };
            const badge = badges[lvl];

            return (
              <div
                key={lvl}
                className={`p-4 rounded-xl border ${badge.color} text-xs flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-center justify-between font-bold mb-1">
                    <span className="text-sm font-serif">{badge.icon} {badge.name}</span>
                    <span className="text-xs">{data.count} {lang === 'zh' ? '个集合' : 'Collections'}</span>
                  </div>
                  <p className="text-[11px] opacity-80 mb-2">{badge.desc}</p>
                </div>
                <div className="pt-2 border-t border-current/20 font-semibold text-[11px]">
                  {lang === 'zh' ? `共 ${data.totalQuestions} 道题目` : `${data.totalQuestions} Questions Total`}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mistake Review Shortcut Banner */}
      {stats.totalWrong > 0 && (
        <div className="p-5 bg-[#F5F2EA] dark:bg-[#2D322D] border border-[#E8E2D2] dark:border-[#353B35] rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#5A6D5B] text-white font-bold flex items-center justify-center shrink-0">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#3E4A3E] dark:text-[#F5F2EA] font-serif">
                {lang === 'zh'
                  ? `复习历史错题（累计 ${stats.totalWrong} 道错题）`
                  : `Review Past Mistakes (${stats.totalWrong} Incorrect Questions)`}
              </h3>
              <p className="text-xs text-[#7C776B] dark:text-[#A09886]">
                {lang === 'zh' ? '针对性练习答错题目，直至完全掌握知识点。' : 'Practice incorrect questions until you reach 100% mastery.'}
              </p>
            </div>
          </div>
          <button
            onClick={() =>
              onStartQuiz({
                mode: 'MISTAKE_REVIEW',
                questionCount: 15,
              })
            }
            className="px-4 py-2 bg-[#5A6D5B] hover:bg-[#485749] text-white font-bold text-xs rounded-xl shadow-sm shrink-0 transition-colors"
          >
            {lang === 'zh' ? '开启错题复习' : 'Start Mistake Review'}
          </button>
        </div>
      )}

      {/* Category Accuracy Breakdown */}
      <div className="p-5 bg-white dark:bg-[#242824] rounded-2xl border border-[#E8E2D2] dark:border-[#353B35] shadow-sm space-y-4">
        <h3 className="font-bold text-sm text-[#3E4A3E] dark:text-[#F5F2EA] font-serif">
          {lang === 'zh' ? '知识点分类表现与遗忘衰减指标' : 'Category Performance & Recency-Decay Metrics'}
        </h3>

        <div className="space-y-3">
          {categoryMetrics.map((cat) => (
            <div
              key={cat.category}
              className="p-3.5 bg-[#F5F2EA]/60 dark:bg-[#2D322D]/60 rounded-xl border border-[#E8E2D2] dark:border-[#353B35] text-xs"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-[#2D2A26] dark:text-[#EAE7DF]">
                  {cat.category}
                </span>
                <span className="font-semibold text-[#7C776B] dark:text-[#A09886]">
                  {lang === 'zh' ? '加权正确率：' : 'Weighted Accuracy:'} <span className="text-[#5A6D5B] dark:text-[#A3B5A4] font-bold">{cat.weightedAccuracy}%</span>
                </span>
              </div>

              <div className="w-full bg-[#EAE5D8] dark:bg-[#383E38] h-2 rounded-full overflow-hidden my-1.5">
                <div
                  className={`h-full rounded-full transition-all ${
                    cat.isWeak ? 'bg-[#82755E]' : 'bg-[#5A6D5B]'
                  }`}
                  style={{ width: `${cat.weightedAccuracy}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-[#7C776B] dark:text-[#A09886]">
                <span>
                  {lang === 'zh'
                    ? `总作答：${cat.totalAttempts} 次（正确 ${cat.correctAttempts} 次）`
                    : `Total Attempts: ${cat.totalAttempts} (${cat.correctAttempts} correct)`}
                </span>
                {cat.isWeak && (
                  <span className="text-[#82755E] dark:text-[#D9C5B2] font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> {lang === 'zh' ? '标记为薄弱知识点 (<60%)' : 'Flagged as Weak Topic (<60%)'}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Complete Learning History Log Table */}
      <div className="p-5 bg-white dark:bg-[#242824] rounded-2xl border border-[#E8E2D2] dark:border-[#353B35] shadow-sm">
        <h3 className="font-bold text-sm text-[#3E4A3E] dark:text-[#F5F2EA] font-serif mb-4">
          {lang === 'zh' ? '完整测试会话记录' : 'Complete Quiz Session Records'}
        </h3>

        {quizResults.length === 0 ? (
          <p className="text-xs text-[#7C776B] text-center py-6">
            {lang === 'zh' ? '暂无测试记录。完成练习或模拟考试后将自动在此记录。' : 'No quiz records yet. Complete practice sessions or exams to populate logs.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E8E2D2] dark:border-[#353B35] text-[#7C776B] font-semibold">
                  <th className="pb-3">{lang === 'zh' ? '日期' : 'Date'}</th>
                  <th className="pb-3">{lang === 'zh' ? '题库集合' : 'Collection'}</th>
                  <th className="pb-3">{lang === 'zh' ? '模式' : 'Mode'}</th>
                  <th className="pb-3">{lang === 'zh' ? '得分' : 'Score'}</th>
                  <th className="pb-3">{lang === 'zh' ? '结果' : 'Result'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E2D2]/50 dark:divide-[#353B35]">
                {quizResults.map((res) => {
                  const modeDisplay = lang === 'zh'
                    ? res.mode === 'EXAM' ? '考试模式'
                      : res.mode === 'PRACTICE' ? '练习模式'
                      : res.mode === 'MISTAKE_REVIEW' ? '错题复习'
                      : res.mode === 'WEAK_TOPIC' ? '薄弱专项' : res.mode
                    : res.mode;
                  return (
                    <tr key={res.id}>
                      <td className="py-3 text-[#7C776B]">{new Date(res.date).toLocaleDateString()}</td>
                      <td className="py-3 font-semibold text-[#2D2A26] dark:text-[#EAE7DF]">{res.collectionName}</td>
                      <td className="py-3 text-[#7C776B]">{modeDisplay}</td>
                      <td className="py-3 font-bold text-[#5A6D5B] dark:text-[#A3B5A4]">{res.scorePercentage}%</td>
                      <td className="py-3">
                        <span
                          className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                            res.passed
                              ? 'bg-[#5A6D5B]/20 text-[#3E4A3E] dark:text-[#A3B5A4]'
                              : 'bg-rose-100/80 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                          }`}
                        >
                          {res.passed ? (lang === 'zh' ? '考核通过' : 'PASSED') : (lang === 'zh' ? '未通过' : 'FAILED')}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};


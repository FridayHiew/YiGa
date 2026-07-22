import React, { useState } from 'react';
import { AppStorageState, KnowledgeCollection, ValidationReport } from '../types';
import { parseJSONImport, parseZIPImport } from '../utils/importer';
import { downloadSampleJSONTemplate } from '../utils/exporter';
import { getTranslation } from '../utils/i18n';
import { UploadCloud, FileCode, CheckCircle2, Sparkles, Copy, Check, Paperclip } from 'lucide-react';

interface ImportViewProps {
  appState: AppStorageState;
  onUpdateCollections: (collections: KnowledgeCollection[]) => void;
  onNavigateTab: (tab: any) => void;
}

export const ImportView: React.FC<ImportViewProps> = ({
  appState,
  onUpdateCollections,
  onNavigateTab,
}) => {
  const { collections, settings } = appState;
  const lang = settings.language;

  const [report, setReport] = useState<ValidationReport | null>(null);
  const [conflictStrategy, setConflictStrategy] = useState<'SKIP' | 'OVERWRITE' | 'IMPORT_NEW'>('IMPORT_NEW');
  const [isProcessing, setIsProcessing] = useState(false);
  const [importSuccessMsg, setImportSuccessMsg] = useState<string | null>(null);
  const [selectedDifficultyLevel, setSelectedDifficultyLevel] = useState<'beginner' | 'intermediate' | 'master'>('beginner');
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const getPromptText = (level: 'beginner' | 'intermediate' | 'master') => {
    if (level === 'beginner') {
      return `Please generate a foundational, beginner-level learning collection in valid JSON format based on the attached document(s) / text provided. Focus on basic principles, definitions, and essential concepts.

Strictly output ONLY a single raw JSON object (no markdown formatting, no code block markers, no intro text) following this exact schema:

{
  "collectionName": "Foundational Learning Package",
  "version": 1,
  "description": "Beginner-level collection covering fundamental concepts and essential definitions.",
  "group": "Specify Subject Group e.g. Cybersecurity, Medicine, IT, Business",
  "difficulty": "Beginner",
  "questions": [
    {
      "id": "q001",
      "category": "Core Fundamentals",
      "difficulty": "Beginner",
      "knowledgeLevel": "Remember",
      "questionType": "Conceptual",
      "tags": ["basics", "fundamentals"],
      "questionText": "Clear foundational question testing essential terminology or core rules...",
      "statements": {},
      "optionA": "First straightforward option",
      "optionB": "Second option",
      "optionC": "Third option",
      "optionD": "Fourth option",
      "correctAnswer": "A",
      "explanation": "Provide detailed reasoning explaining why the correct answer is selected and why other options are incorrect. Reference: Chapter/Section/Page.",
      "sourceReference": "Chapter 1, Page 5",
      "imageFile": ""
    }
  ]
}`;
    } else if (level === 'intermediate') {
      return `Please generate a practical, intermediate-level learning collection in valid JSON format based on the attached document(s) / text provided. Focus on procedural application, real-world scenario analysis, and problem-solving.

Strictly output ONLY a single raw JSON object (no markdown formatting, no code block markers, no intro text) following this exact schema:

{
  "collectionName": "Practical Application Package",
  "version": 1,
  "description": "Intermediate-level collection focusing on practical scenarios and procedural workflows.",
  "group": "Specify Subject Group e.g. Cybersecurity, Medicine, IT, Business",
  "difficulty": "Intermediate",
  "questions": [
    {
      "id": "q001",
      "category": "Practical Scenarios",
      "difficulty": "Intermediate",
      "knowledgeLevel": "Apply",
      "questionType": "Scenario",
      "tags": ["practice", "workflow"],
      "questionText": "Practical scenario question testing application of concepts to real-world situations...",
      "statements": {},
      "optionA": "First plausible scenario option",
      "optionB": "Second option",
      "optionC": "Third option",
      "optionD": "Fourth option",
      "correctAnswer": "B",
      "explanation": "Provide detailed reasoning explaining the optimal approach for this scenario. Reference: Chapter/Section/Page.",
      "sourceReference": "Chapter 3, Page 24",
      "imageFile": ""
    }
  ]
}`;
    } else {
      return `Please generate an expert, master-level professional assessment collection in valid JSON format based on the attached document(s) / text provided. Focus on deep troubleshooting, complex case studies, critical evaluation, and expert analysis.

Strictly output ONLY a single raw JSON object (no markdown formatting, no code block markers, no intro text) following this exact schema:

{
  "collectionName": "Generated Learning Package",
  "version": 1,
  "description": "Master-level professional assessment generated from uploaded document.",
  "group": "Specify Subject Group e.g. Cybersecurity, Medicine, IT, Business",
  "difficulty": "Master",
  "questions": [
    {
      "id": "q001",
      "category": "Expert Troubleshooting",
      "difficulty": "Master",
      "knowledgeLevel": "Analyze",
      "questionType": "Analysis",
      "tags": ["expert", "troubleshooting"],
      "questionText": "Complex case study / analysis question testing deep technical expertise and evaluation...",
      "statements": {},
      "optionA": "First comprehensive option",
      "optionB": "Second option",
      "optionC": "Third option",
      "optionD": "Fourth option",
      "correctAnswer": "A",
      "explanation": "Provide detailed reasoning explaining why the correct answer is selected and why other options are incorrect. Reference: Chapter/Section/Page.",
      "sourceReference": "Chapter 5, Section 2",
      "imageFile": ""
    }
  ]
}`;
    }
  };

  const aiPromptText = getPromptText(selectedDifficultyLevel);

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(aiPromptText);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2500);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setReport(null);
    setImportSuccessMsg(null);

    try {
      const filename = file.name.toLowerCase();
      let res: ValidationReport;

      if (filename.endsWith('.json')) {
        const text = await file.text();
        res = await parseJSONImport(text);
      } else if (filename.endsWith('.zip')) {
        const buffer = await file.arrayBuffer();
        res = await parseZIPImport(buffer);
      } else {
        alert(lang === 'zh' ? '不支持的文件格式，请上传 .json 或 .zip 格式文件。' : 'Unsupported file format. Please upload a .json or .zip package.');
        setIsProcessing(false);
        return;
      }

      setReport(res);
    } catch (err: any) {
      alert(lang === 'zh' ? `读取文件失败: ${err.message}` : `Error reading file: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmImport = () => {
    if (!report || !report.isValid || report.extractedQuestions.length === 0) return;

    const colName = report.collectionName || (lang === 'zh' ? '导入题库' : 'Imported Collection');
    const existingIndex = collections.findIndex((c) => c.name.toLowerCase() === colName.toLowerCase());

    let updatedCollections = [...collections];

    if (existingIndex >= 0 && conflictStrategy === 'SKIP') {
      alert(lang === 'zh' ? `题库集合“${colName}”已存在，根据冲突策略已跳过导入。` : `Collection "${colName}" already exists. Import skipped based on strategy.`);
      return;
    } else if (existingIndex >= 0 && conflictStrategy === 'OVERWRITE') {
      // Overwrite questions
      updatedCollections[existingIndex] = {
        ...updatedCollections[existingIndex],
        description: report.collectionDescription || updatedCollections[existingIndex].description,
        group: report.collectionGroup || updatedCollections[existingIndex].group || 'General',
        difficulty: report.collectionDifficulty || updatedCollections[existingIndex].difficulty || 'Master',
        updatedAt: new Date().toISOString(),
        questionCount: report.extractedQuestions.length,
        questions: report.extractedQuestions,
        categories: Array.from(new Set(report.extractedQuestions.map((q) => q.category))),
      };
    } else {
      // Create new collection
      const finalName = existingIndex >= 0 ? `${colName} (${new Date().toLocaleTimeString()})` : colName;
      const newCollection: KnowledgeCollection = {
        id: `col_${Date.now()}`,
        name: finalName,
        description: report.collectionDescription || (lang === 'zh' ? `包含 ${report.extractedQuestions.length} 道题目的导入题库。` : `Imported with ${report.extractedQuestions.length} questions.`),
        group: report.collectionGroup || 'General',
        difficulty: report.collectionDifficulty || 'Master',
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        questionCount: report.extractedQuestions.length,
        categories: Array.from(new Set(report.extractedQuestions.map((q) => q.category))),
        questions: report.extractedQuestions,
      };
      updatedCollections.push(newCollection);
    }

    onUpdateCollections(updatedCollections);
    setImportSuccessMsg(
      lang === 'zh'
        ? `成功将 ${report.extractedQuestions.length} 道题目导入至“${colName}”！`
        : `Successfully imported ${report.extractedQuestions.length} questions into "${colName}"!`
    );
    setReport(null);
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-[#3E4A3E] dark:text-[#F5F2EA] font-serif">
          {getTranslation(lang, 'import')}
        </h2>
        <p className="text-xs text-[#7C776B] dark:text-[#A09886]">
          {lang === 'zh' ? '从 JSON 题库文件或包含图片的 ZIP 压缩包导入学习资料' : 'Import learning materials from JSON or ZIP packages with images'}
        </p>
      </div>

      {/* File Upload Dropzone */}
      <div className="p-8 bg-white dark:bg-[#242824] border-2 border-dashed border-[#E8E2D2] dark:border-[#353B35] rounded-3xl text-center hover:border-[#5A6D5B] transition-colors">
        <div className="w-14 h-14 rounded-2xl bg-[#5A6D5B]/10 text-[#5A6D5B] dark:text-[#A3B5A4] flex items-center justify-center mx-auto mb-3">
          <UploadCloud className="w-7 h-7" />
        </div>
        <h3 className="font-bold text-sm text-[#3E4A3E] dark:text-[#F5F2EA] mb-1 font-serif">
          {lang === 'zh' ? '选择或拖拽题库文件到此处' : 'Select or drag & drop learning material file'}
        </h3>
        <p className="text-xs text-[#7C776B] dark:text-[#A09886] max-w-sm mx-auto mb-4">
          {lang === 'zh' ? '支持' : 'Supports'} <span className="font-bold text-[#2D2A26] dark:text-[#EAE7DF]">.json</span> {lang === 'zh' ? '或包含题目和图表的' : 'or'} <span className="font-bold text-[#2D2A26] dark:text-[#EAE7DF]">.zip</span> {lang === 'zh' ? '压缩包' : '(containing questions + images)'}
        </p>

        <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#5A6D5B] hover:bg-[#485749] text-white font-semibold text-xs cursor-pointer transition-all shadow-sm">
          <UploadCloud className="w-4 h-4" />
          <span>{lang === 'zh' ? '浏览本地文件' : 'Browse File'}</span>
          <input
            type="file"
            accept=".json,.zip"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
      </div>

      {/* AI Prompt Template Section (Before Starter Template Section) */}
      <div className="p-5 bg-white dark:bg-[#242824] rounded-2xl border border-[#E8E2D2] dark:border-[#353B35] shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#5A6D5B]/10 text-[#5A6D5B] dark:text-[#A3B5A4] flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#3E4A3E] dark:text-[#F5F2EA] font-serif">
                {lang === 'zh' ? 'AI 智能题库生成提示词' : 'AI Collection Generator Prompt'}
              </h3>
              <p className="text-xs text-[#7C776B] dark:text-[#A09886]">
                {lang === 'zh' ? '复制提示词发送给 ChatGPT、Gemini 或 Claude，快速将文档转为标准 JSON 题库' : 'Ask ChatGPT, Gemini, or Claude to build a package from your attached files/documents'}
              </p>
            </div>
          </div>

          <button
            onClick={handleCopyPrompt}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shrink-0 ${
              copiedPrompt
                ? 'bg-emerald-600 text-white'
                : 'bg-[#5A6D5B] hover:bg-[#485749] text-white shadow-sm'
            }`}
          >
            {copiedPrompt ? (
              <>
                <Check className="w-4 h-4" />
                <span>{lang === 'zh' ? '已复制到剪贴板！' : 'Copied to Clipboard!'}</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>{lang === 'zh' ? `复制 ${selectedDifficultyLevel === 'beginner' ? '初级' : selectedDifficultyLevel === 'intermediate' ? '中级' : '高级'} 提示词` : `Copy ${selectedDifficultyLevel.toUpperCase()} Prompt`}</span>
              </>
            )}
          </button>
        </div>

        {/* Level Selector Tabs */}
        <div className="flex items-center gap-2 border-b border-[#E8E2D2] dark:border-[#353B35] pb-3">
          <span className="text-xs font-semibold text-[#7C776B] dark:text-[#A09886] mr-1">{lang === 'zh' ? '目标难度:' : 'Target Level:'}</span>
          {(['beginner', 'intermediate', 'master'] as const).map((lvl) => {
            const isActive = selectedDifficultyLevel === lvl;
            const labels = {
              beginner: lang === 'zh' ? '🟢 初级 (Beginner)' : '🟢 Beginner',
              intermediate: lang === 'zh' ? '🟡 中级 (Intermediate)' : '🟡 Intermediate',
              master: lang === 'zh' ? '🔴 高级 (Master)' : '🔴 Master',
            };
            return (
              <button
                key={lvl}
                onClick={() => setSelectedDifficultyLevel(lvl)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-[#5A6D5B] text-white shadow-sm'
                    : 'bg-[#F5F2EA] dark:bg-[#2D322D] text-[#6B6559] dark:text-[#A09886] hover:bg-[#EAE5D8] dark:hover:bg-[#353B35]'
                }`}
              >
                {labels[lvl]}
              </button>
            );
          })}
        </div>

        {/* Prompt Code Block */}
        <div className="relative">
          <pre className="p-4 bg-[#F5F2EA] dark:bg-[#1D211D] border border-[#E8E2D2] dark:border-[#353B35] rounded-xl text-[11px] font-mono text-[#2D2A26] dark:text-[#EAE7DF] overflow-x-auto max-h-48 whitespace-pre-wrap leading-relaxed">
            {aiPromptText}
          </pre>
        </div>

        <div className="flex items-center gap-2 text-xs text-[#5A6D5B] dark:text-[#A3B5A4] bg-[#5A6D5B]/10 p-2.5 rounded-xl font-medium">
          <Paperclip className="w-4 h-4 shrink-0" />
          <span>
            <strong>{lang === 'zh' ? '使用说明：' : 'Instruction:'}</strong>{' '}
            {lang === 'zh'
              ? '复制上方提示词，附带您的学习资料或 PDF 文件发送给 ChatGPT、Gemini 或 Claude 即可生成标准 JSON 题库。'
              : 'Copy the prompt above, attach your study files/PDFs, and paste into ChatGPT or Gemini to receive a ready-to-import JSON package.'}
          </span>
        </div>
      </div>

      {/* Starter Template Downloader */}
      <div className="p-5 bg-[#F5F2EA] dark:bg-[#2D322D] rounded-2xl border border-[#E8E2D2] dark:border-[#353B35] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="text-xs font-bold text-[#3E4A3E] dark:text-[#F5F2EA] font-serif">
            {lang === 'zh' ? '需要空白 JSON 模板？' : 'Need a starter template?'}
          </h4>
          <p className="text-[11px] text-[#7C776B] dark:text-[#A09886]">
            {lang === 'zh' ? '下载标准预置格式的 JSON 题目模版文件' : 'Download standard pre-formatted question template for JSON'}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={downloadSampleJSONTemplate}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-[#242824] text-[#2D2A26] dark:text-[#EAE7DF] border border-[#E8E2D2] dark:border-[#353B35] hover:bg-[#EAE5D8] text-xs font-semibold shadow-sm transition-colors"
          >
            <FileCode className="w-3.5 h-3.5 text-[#5A6D5B]" />
            <span>{lang === 'zh' ? '下载 JSON 模板' : 'Download JSON Template'}</span>
          </button>
        </div>
      </div>

      {/* Import Success Message */}
      {importSuccessMsg && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
              {importSuccessMsg}
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('library')}
            className="text-xs font-semibold px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
          >
            {lang === 'zh' ? '前往题库库房' : 'Go to Library'}
          </button>
        </div>
      )}

      {/* Pre-Import Validation & Preview Report */}
      {report && (
        <div className="p-6 bg-white dark:bg-[#242824] border border-[#E8E2D2] dark:border-[#353B35] rounded-2xl space-y-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#E8E2D2] dark:border-[#353B35] pb-4">
            <div>
              <h3 className="font-bold text-base text-[#3E4A3E] dark:text-[#F5F2EA] font-serif">
                {lang === 'zh' ? '导入前数据校验报告' : 'Pre-Import Validation Report'}
              </h3>
              <p className="text-xs text-[#7C776B] dark:text-[#A09886]">
                {lang === 'zh' ? '题库集合：' : 'Collection:'} <span className="font-bold text-[#2D2A26] dark:text-[#EAE7DF]">{report.collectionName}</span>
              </p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold ${
                report.isValid
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200'
                  : 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200'
              }`}
            >
              {report.isValid
                ? (lang === 'zh' ? '校验通过' : 'Validation Passed')
                : (lang === 'zh' ? '校验失败' : 'Validation Failed')}
            </span>
          </div>

          {/* Metrics summary */}
          <div className="grid grid-cols-3 gap-3 text-center text-xs">
            <div className="p-3 rounded-xl bg-[#F5F2EA] dark:bg-[#2D322D]">
              <span className="text-[#7C776B] dark:text-[#A09886] block text-[10px]">
                {lang === 'zh' ? '解析总数' : 'Total Parsed'}
              </span>
              <span className="font-bold text-[#2D2A26] dark:text-[#EAE7DF] text-sm">{report.totalRows}</span>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40">
              <span className="text-emerald-600 dark:text-emerald-400 block text-[10px]">
                {lang === 'zh' ? '有效题目' : 'Valid Questions'}
              </span>
              <span className="font-bold text-emerald-700 dark:text-emerald-300 text-sm">{report.validRows}</span>
            </div>
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40">
              <span className="text-rose-600 dark:text-rose-400 block text-[10px]">
                {lang === 'zh' ? '跳过 / 无效' : 'Skipped / Invalid'}
              </span>
              <span className="font-bold text-rose-700 dark:text-rose-300 text-sm">{report.invalidRows}</span>
            </div>
          </div>

          {/* Validation Errors/Warnings if any */}
          {report.errors.length > 0 && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 text-rose-700 dark:text-rose-300 text-xs space-y-1">
              <span className="font-bold block">{lang === 'zh' ? '校验错误说明：' : 'Validation Errors:'}</span>
              {report.errors.map((err, idx) => (
                <p key={idx} className="text-[11px]">
                  • {lang === 'zh' ? `第 ${err.row} 行 [${err.field}]: ${err.message}` : `Row ${err.row} [${err.field}]: ${err.message}`}
                </p>
              ))}
            </div>
          )}

          {/* Duplicate Conflict Strategy Selector */}
          <div className="p-4 bg-[#F5F2EA] dark:bg-[#2D322D] rounded-xl border border-[#E8E2D2] dark:border-[#353B35]">
            <label className="text-xs font-bold text-[#2D2A26] dark:text-[#EAE7DF] block mb-2">
              {lang === 'zh' ? '若集合或题目 ID 已存在：' : 'If Collection or Question ID Exists:'}
            </label>
            <div className="grid grid-cols-3 gap-2 text-xs">
              {[
                { id: 'IMPORT_NEW', label: lang === 'zh' ? '导入为新题库' : 'Import as New' },
                { id: 'OVERWRITE', label: lang === 'zh' ? '覆盖现有题库' : 'Overwrite Existing' },
                { id: 'SKIP', label: lang === 'zh' ? '跳过重复项' : 'Skip Duplicates' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setConflictStrategy(opt.id as any)}
                  className={`py-2 px-3 rounded-lg font-semibold border transition-all ${
                    conflictStrategy === opt.id
                      ? 'bg-[#5A6D5B] text-white border-[#5A6D5B] shadow-sm'
                      : 'bg-white dark:bg-[#242824] border-[#E8E2D2] dark:border-[#353B35] text-[#2D2A26] dark:text-[#EAE7DF]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Confirm Button */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={() => setReport(null)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#7C776B] hover:bg-[#F5F2EA] dark:hover:bg-[#2D322D]"
            >
              {lang === 'zh' ? '取消' : 'Discard'}
            </button>
            <button
              disabled={!report.isValid || report.extractedQuestions.length === 0}
              onClick={handleConfirmImport}
              className="px-5 py-2.5 rounded-xl bg-[#5A6D5B] hover:bg-[#485749] text-white font-semibold text-xs transition-all shadow-sm disabled:opacity-50"
            >
              {lang === 'zh' ? '确认并保存至本地数据库' : 'Confirm & Save to Local Database'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

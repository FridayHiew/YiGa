import React, { useState } from 'react';
import JSZip from 'jszip';
import { AppStorageState, KnowledgeCollection, QuizResult } from '../types';
import { saveAppState } from '../utils/storage';
import { getTranslation } from '../utils/i18n';
import { HardDriveDownload, Download, UploadCloud, ShieldCheck, AlertTriangle, CheckCircle2, FileJson } from 'lucide-react';

interface BackupRestoreViewProps {
  appState: AppStorageState;
  onRestoreState: (newState: AppStorageState) => void;
}

export const BackupRestoreView: React.FC<BackupRestoreViewProps> = ({
  appState,
  onRestoreState,
}) => {
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const lang = appState.settings.language;

  const handleExportBackup = async () => {
    try {
      const backupData = {
        version: 1,
        exportedAt: new Date().toISOString(),
        deviceId: appState.deviceId,
        profile: appState.profile,
        settings: appState.settings,
        collections: appState.collections,
        quizResults: appState.quizResults,
        currentStreak: appState.currentStreak,
      };

      const zip = new JSZip();
      zip.file('backup_data.json', JSON.stringify(backupData, null, 2));

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `oktp_backup_${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setSuccessMsg(lang === 'zh' ? '成功生成并下载完整本地数据库备份 ZIP 包！' : 'Successfully generated and downloaded full local backup ZIP package!');
    } catch (e: any) {
      setErrorMsg(lang === 'zh' ? `备份生成失败：${e.message}` : `Backup generation failed: ${e.message}`);
    }
  };

  const handleRestoreBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      let backupData: any = null;

      if (file.name.endsWith('.zip')) {
        const zip = await JSZip.loadAsync(await file.arrayBuffer());
        const jsonEntry = zip.file('backup_data.json');
        if (!jsonEntry) throw new Error(lang === 'zh' ? '无效的备份包：缺少 backup_data.json 文件' : 'Invalid backup package: missing backup_data.json');
        const text = await jsonEntry.async('text');
        backupData = JSON.parse(text);
      } else if (file.name.endsWith('.json')) {
        const text = await file.text();
        backupData = JSON.parse(text);
      } else {
        throw new Error(lang === 'zh' ? '不支持的备份文件格式，请上传 .zip 或 .json 备份文件。' : 'Unsupported backup file format. Please upload .zip or .json backup.');
      }

      // Check VR-10 version compatibility
      if (!backupData || !backupData.collections || !Array.isArray(backupData.collections)) {
        throw new Error(lang === 'zh' ? '文件损坏或无效的备份内容' : 'Corrupted or invalid backup content');
      }

      const restoredState: AppStorageState = {
        ...appState,
        profile: backupData.profile || appState.profile,
        settings: backupData.settings || appState.settings,
        collections: backupData.collections,
        quizResults: backupData.quizResults || [],
        currentStreak: backupData.currentStreak || 0,
      };

      saveAppState(restoredState);
      onRestoreState(restoredState);

      setSuccessMsg(
        lang === 'zh'
          ? `备份恢复成功！已成功载入 ${backupData.collections.length} 个题库集合及 ${backupData.quizResults?.length || 0} 条历史测试记录。`
          : `Backup restored successfully! ${backupData.collections.length} collections and ${backupData.quizResults?.length || 0} quiz history sessions loaded.`
      );
      window.scrollTo(0, 0);
    } catch (e: any) {
      setErrorMsg(lang === 'zh' ? `恢复失败：${e.message}` : `Restore failed: ${e.message}`);
      window.scrollTo(0, 0);
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-3xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          {getTranslation(appState.settings.language, 'backupRestore')}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {lang === 'zh'
            ? '通过导出或恢复完整本地数据库包，妥善保护您的学习进度与知识库'
            : 'Protect your learning progress by exporting or restoring full local database packages'}
        </p>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center gap-3 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl flex items-center gap-3 text-rose-800 dark:text-rose-300 text-xs font-semibold">
          <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Export Backup Card */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
              <Download className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 mb-1">
              {lang === 'zh' ? '创建本地备份包' : 'Create Local Backup Package'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {lang === 'zh'
                ? '打包导出所有题目集合、图片图表资源、测验历史记录及个人偏好设置至 ZIP 压缩包。'
                : 'Bundles all question collections, image assets, quiz history, and user settings into an encrypted/compressed backup ZIP file.'}
            </p>
          </div>

          <button
            onClick={handleExportBackup}
            className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-all shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>{lang === 'zh' ? '导出备份 ZIP' : 'Export Backup ZIP'}</span>
          </button>
        </div>

        {/* Restore Backup Card */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-3">
              <UploadCloud className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 mb-1">
              {lang === 'zh' ? '恢复历史备份' : 'Restore Previous Backup'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {lang === 'zh'
                ? '选择先前导出的备份文件（.zip 或 .json），恢复题目集合、学习统计与个人配置。'
                : 'Select a previously exported backup file (.zip or .json) to restore your questions, statistics, and profile.'}
            </p>
          </div>

          <label className="w-full py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-all shadow-md shadow-purple-500/20 flex items-center justify-center gap-2 cursor-pointer">
            <UploadCloud className="w-4 h-4" />
            <span>{lang === 'zh' ? '选择备份文件' : 'Select Backup File'}</span>
            <input
              type="file"
              accept=".zip,.json"
              onChange={handleRestoreBackup}
              className="hidden"
            />
          </label>
        </div>
      </div>
    </div>
  );
};

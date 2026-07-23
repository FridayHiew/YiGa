import React from 'react';
import { AppSettings } from '../types';
import { getTranslation } from '../utils/i18n';
import { LayoutDashboard, Library, UploadCloud, BarChart3, HardDriveDownload, KeyRound, Settings, Lock } from 'lucide-react';

export type TabType = 'dashboard' | 'library' | 'import' | 'analytics' | 'backup' | 'admin' | 'settings' | 'license';

interface NavigationProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  isAdmin: boolean;
  settings: AppSettings;
  hasValidLicense: boolean;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onSelectTab,
  isAdmin,
  settings,
  hasValidLicense,
}) => {
  const lang = settings.language;

  const navItems = [
    { id: 'dashboard' as TabType, label: getTranslation(lang, 'dashboard'), icon: LayoutDashboard },
    { id: 'library' as TabType, label: getTranslation(lang, 'library'), icon: Library },
    { id: 'import' as TabType, label: getTranslation(lang, 'import'), icon: UploadCloud, isLocked: !hasValidLicense },
    { id: 'analytics' as TabType, label: getTranslation(lang, 'analytics'), icon: BarChart3 },
    { id: 'backup' as TabType, label: getTranslation(lang, 'backupRestore'), icon: HardDriveDownload, isLocked: !hasValidLicense },
    ...(isAdmin ? [{ id: 'admin' as TabType, label: getTranslation(lang, 'adminGenerator'), icon: KeyRound }] : []),
    { id: 'settings' as TabType, label: getTranslation(lang, 'settings'), icon: Settings },
  ];

  return (
    <>
      {/* Top Navigation Bar - Responsive for Tablet & Desktop */}
      <nav className="hidden md:block bg-[#F5F2EA] dark:bg-[#242824] border-b border-[#E8E2D2] dark:border-[#353B35] transition-colors sticky top-[61px] z-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar py-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all touch-manipulation min-h-[40px] ${
                    isActive
                      ? 'bg-[#5A6D5B] text-white shadow-sm dark:bg-[#708571]'
                      : 'text-[#7C776B] dark:text-[#A09886] hover:text-[#2D2A26] dark:hover:text-[#F5F2EA] hover:bg-[#EAE5D8] dark:hover:bg-[#2D322D]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {item.isLocked && <Lock className="w-3 h-3 text-rose-500/80 dark:text-rose-400/80 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Mobile Fixed Bottom Navigation Bar - PWA App Experience */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FDFCF8]/95 dark:bg-[#1C1E1C]/95 backdrop-blur-md border-t border-[#E8E2D2] dark:border-[#353B35] pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1 px-1 shadow-lg transition-colors">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar px-2 py-0.5 justify-start min-[420px]:justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all min-h-[48px] min-w-[62px] flex-shrink-0 touch-manipulation relative ${
                  isActive
                    ? 'text-[#5A6D5B] dark:text-[#A3B5A4] font-bold'
                    : 'text-[#7C776B] dark:text-[#A09886] opacity-75 active:opacity-100'
                }`}
              >
                <div className={`p-1 rounded-lg ${isActive ? 'bg-[#5A6D5B]/15 dark:bg-[#708571]/30' : ''}`}>
                  <Icon className="w-5 h-5" />
                </div>
                {item.isLocked && (
                  <div className="absolute top-1 right-2.5 bg-rose-500 text-white rounded-full p-0.5 border border-white dark:border-[#1C1E1C]">
                    <Lock className="w-2.5 h-2.5" />
                  </div>
                )}
                <span className="text-[10px] tracking-tight leading-tight mt-0.5 whitespace-nowrap text-center">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};

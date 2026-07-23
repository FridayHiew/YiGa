import React, { useState } from 'react';
import { AppStorageState, KnowledgeCollection, QuizConfig } from '../types';
import { exportCollectionAsJSON, exportCollectionAsZIP } from '../utils/exporter';
import { getTranslation } from '../utils/i18n';
import { Plus, Play, FileText, Download, Trash2, Edit3, BookOpen, Layers, Check, X, Search, Folder, Tag } from 'lucide-react';

interface LibraryViewProps {
  appState: AppStorageState;
  onUpdateCollections: (collections: KnowledgeCollection[]) => void;
  onStartQuiz: (config: QuizConfig) => void;
  onNavigateTab: (tab: any) => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  appState,
  onUpdateCollections,
  onStartQuiz,
  onNavigateTab,
}) => {
  const { collections, settings } = appState;
  const lang = settings.language;

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('ALL');
  const [selectedCollection, setSelectedCollection] = useState<KnowledgeCollection | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Edit Collection Form State
  const [editingCollection, setEditingCollection] = useState<KnowledgeCollection | null>(null);
  const [editColName, setEditColName] = useState('');
  const [editColDesc, setEditColDesc] = useState('');
  const [editColGroup, setEditColGroup] = useState('General');
  const [editColDifficulty, setEditColDifficulty] = useState('Master');

  // New Collection Form State
  const [newColName, setNewColName] = useState('');
  const [newColDesc, setNewColDesc] = useState('');
  const [newColGroup, setNewColGroup] = useState('General');
  const [newColDifficulty, setNewColDifficulty] = useState('Master');

  const allGroups = Array.from(new Set(collections.map((c) => c.group || 'General')));

  const filteredCollections = collections.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.group || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.categories.some((cat) => cat.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesGroup = selectedGroupFilter === 'ALL' || (c.group || 'General') === selectedGroupFilter;

    return matchesSearch && matchesGroup;
  });

  // Group filtered collections by group
  const groupedCollections: Record<string, KnowledgeCollection[]> = {};
  filteredCollections.forEach((col) => {
    const groupKey = col.group?.trim() || 'General';
    if (!groupedCollections[groupKey]) {
      groupedCollections[groupKey] = [];
    }
    groupedCollections[groupKey].push(col);
  });

  const handleStartEdit = (col: KnowledgeCollection) => {
    setEditingCollection(col);
    setEditColName(col.name);
    setEditColDesc(col.description || '');
    setEditColGroup(col.group || 'General');
    setEditColDifficulty(col.difficulty || 'Master');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCollection || !editColName.trim()) return;

    const updated = collections.map((c) => {
      if (c.id === editingCollection.id) {
        return {
          ...c,
          name: editColName.trim(),
          description: editColDesc.trim(),
          group: editColGroup.trim() || 'General',
          difficulty: editColDifficulty,
          updatedAt: new Date().toISOString(),
        };
      }
      return c;
    });

    onUpdateCollections(updated);

    if (selectedCollection?.id === editingCollection.id) {
      setSelectedCollection({
        ...selectedCollection,
        name: editColName.trim(),
        description: editColDesc.trim(),
        group: editColGroup.trim() || 'General',
        difficulty: editColDifficulty,
        updatedAt: new Date().toISOString(),
      });
    }

    setEditingCollection(null);
  };

  const handleCreateCollection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColName.trim()) return;

    const newCol: KnowledgeCollection = {
      id: `col_${Date.now()}`,
      name: newColName.trim(),
      description: newColDesc.trim() || 'Custom Knowledge Collection',
      group: newColGroup.trim() || 'General',
      difficulty: newColDifficulty,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      questionCount: 0,
      categories: ['General'],
      questions: [],
    };

    onUpdateCollections([...collections, newCol]);
    setNewColName('');
    setNewColDesc('');
    setNewColGroup('General');
    setNewColDifficulty('Master');
    setShowCreateModal(false);
  };

  const handleDeleteCollection = (id: string) => {
    if (confirm('Are you sure you want to delete this collection and its questions?')) {
      onUpdateCollections(collections.filter((c) => c.id !== id));
      if (selectedCollection?.id === id) {
        setSelectedCollection(null);
      }
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#3E4A3E] dark:text-[#F5F2EA] font-serif">
            {getTranslation(lang, 'library')}
          </h2>
          <p className="text-xs text-[#7C776B] dark:text-[#A09886]">
            {lang === 'zh' ? '管理与组织按学科分类及难易度分组的知识题库集合' : 'Manage and organize your question collections grouped by subject folders and difficulty levels'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateTab('import')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#F5F2EA] dark:bg-[#2D322D] hover:bg-[#EAE5D8] text-[#2D2A26] dark:text-[#EAE7DF] font-semibold text-xs transition-colors border border-[#E8E2D2] dark:border-[#353B35]"
          >
            <Download className="w-4 h-4" />
            <span>{getTranslation(lang, 'importPackage')}</span>
          </button>
        </div>
      </div>

      {/* Search & Group Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#A09886]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={lang === 'zh' ? '搜索题库名称、分组或分类...' : 'Search collections, groups, or categories...'}
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-[#242824] border border-[#E8E2D2] dark:border-[#353B35] rounded-xl text-xs text-[#2D2A26] dark:text-[#EAE7DF] focus:outline-none focus:ring-2 focus:ring-[#5A6D5B]"
          />
        </div>

        <div className="flex items-center gap-2">
          <Folder className="w-4 h-4 text-[#5A6D5B]" />
          <select
            value={selectedGroupFilter}
            onChange={(e) => setSelectedGroupFilter(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-[#242824] border border-[#E8E2D2] dark:border-[#353B35] rounded-xl text-xs font-semibold text-[#2D2A26] dark:text-[#EAE7DF] focus:outline-none focus:ring-2 focus:ring-[#5A6D5B]"
          >
            <option value="ALL">{lang === 'zh' ? `全部分组 (${allGroups.length})` : `All Groups (${allGroups.length})`}</option>
            {allGroups.map((g) => (
              <option key={g} value={g}>
                📁 {lang === 'zh' ? `分组: ${g}` : `Group: ${g}`}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Collections Grouped by Group Field */}
      {Object.keys(groupedCollections).length === 0 ? (
        <div className="p-8 text-center bg-white dark:bg-[#242824] border border-[#E8E2D2] dark:border-[#353B35] rounded-2xl">
          <p className="text-xs text-[#7C776B] dark:text-[#A09886]">
            {lang === 'zh' ? '未找到符合筛选条件的题库集合。' : 'No collections found matching your filter criteria.'}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedCollections).map(([groupName, groupCols]) => (
            <div key={groupName} className="space-y-3">
              {/* Group Header */}
              <div className="flex items-center justify-between border-b border-[#E8E2D2] dark:border-[#353B35] pb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-[#5A6D5B]/10 text-[#5A6D5B] dark:text-[#A3B5A4]">
                    <Folder className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-sm text-[#3E4A3E] dark:text-[#F5F2EA] font-serif">
                    {lang === 'zh' ? `分组: ${groupName}` : `Group: ${groupName}`}
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#5A6D5B]/10 text-[#5A6D5B] dark:text-[#A3B5A4] font-bold border border-[#5A6D5B]/20">
                    {groupCols.length} {lang === 'zh' ? '个集合' : groupCols.length === 1 ? 'Collection' : 'Collections'}
                  </span>
                </div>
              </div>

              {/* Collections Cards Grid for this Group */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupCols.map((collection) => (
                  <div
                    key={collection.id}
                    className="p-5 bg-white dark:bg-[#242824] border border-[#E8E2D2] dark:border-[#353B35] rounded-2xl shadow-sm flex flex-col justify-between hover:border-[#5A6D5B] transition-all"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <h3 className="font-bold text-sm text-[#3E4A3E] dark:text-[#F5F2EA] line-clamp-1 font-serif">
                          {collection.name}
                        </h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F5F2EA] dark:bg-[#2D322D] text-[#5A6D5B] dark:text-[#A3B5A4] border border-[#E8E2D2] dark:border-[#353B35] shrink-0">
                          {collection.questions.length} {lang === 'zh' ? '道题目' : 'Questions'}
                        </span>
                      </div>

                      {/* Group Tag & Difficulty Badges */}
                      <div className="flex items-center gap-1.5 flex-wrap my-2">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#5A6D5B]/10 text-[#5A6D5B] dark:text-[#A3B5A4] border border-[#5A6D5B]/20">
                          <Folder className="w-3 h-3" />
                          {collection.group || 'General'}
                        </span>

                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                            collection.difficulty === 'Beginner'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                              : collection.difficulty === 'Intermediate'
                              ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                              : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                          }`}
                        >
                          {collection.difficulty === 'Beginner'
                            ? (lang === 'zh' ? '🟢 初级' : '🟢 Beginner')
                            : collection.difficulty === 'Intermediate'
                            ? (lang === 'zh' ? '🟡 中级' : '🟡 Intermediate')
                            : (lang === 'zh' ? '🔴 高级' : '🔴 Master')}
                        </span>
                      </div>

                      <p className="text-xs text-[#7C776B] dark:text-[#A09886] line-clamp-2 mb-3">
                        {collection.description || (lang === 'zh' ? '暂无描述。' : 'No description provided.')}
                      </p>

                      {/* Categories Tags */}
                      <div className="flex flex-wrap gap-1 mb-4">
                        {collection.categories.slice(0, 3).map((cat) => (
                          <span
                            key={cat}
                            className="text-[10px] px-2 py-0.5 rounded bg-[#F5F2EA] dark:bg-[#2D322D] text-[#6B6559] dark:text-[#A09886]"
                          >
                            {cat}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2 pt-3 border-t border-[#E8E2D2] dark:border-[#353B35]">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          disabled={collection.questions.length === 0}
                          onClick={() =>
                            onStartQuiz({
                              collectionId: collection.id,
                              collectionName: collection.name,
                              mode: 'PRACTICE',
                              questionCount: Math.min(10, collection.questions.length),
                            })
                          }
                          className="w-full py-2 px-3 rounded-xl bg-[#5A6D5B] hover:bg-[#485749] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>{lang === 'zh' ? '练习' : 'Practice'}</span>
                        </button>

                        <button
                          disabled={collection.questions.length === 0}
                          onClick={() =>
                            onStartQuiz({
                              collectionId: collection.id,
                              collectionName: collection.name,
                              mode: 'EXAM',
                              questionCount: Math.min(20, collection.questions.length),
                              timeLimitMinutes: Math.min(20, collection.questions.length),
                            })
                          }
                          className="w-full py-2 px-3 rounded-xl bg-[#EAE5D8] dark:bg-[#2D322D] hover:bg-[#D9C5B2] text-[#3E4A3E] dark:text-[#F5F2EA] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 border border-[#D9C5B2] dark:border-[#353B35]"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>{lang === 'zh' ? '模拟考试' : 'Exam'}</span>
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1">
                        <button
                          onClick={() => setSelectedCollection(collection)}
                          className="text-[#7C776B] hover:text-[#2D2A26] dark:hover:text-[#F5F2EA] font-medium"
                        >
                          {lang === 'zh' ? `查看题目 (${collection.questions.length})` : `View Questions (${collection.questions.length})`}
                        </button>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleStartEdit(collection)}
                            className="p-1.5 rounded-lg text-[#5A6D5B] hover:bg-[#F5F2EA] dark:hover:bg-[#2D322D] transition-colors"
                            title="Edit Collection Details"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => exportCollectionAsZIP(collection)}
                            className="p-1.5 rounded-lg text-[#A09886] hover:bg-[#F5F2EA] dark:hover:bg-[#2D322D] transition-colors"
                            title="Export Collection ZIP"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteCollection(collection.id)}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            title="Delete Collection"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Collection Modal */}
      {editingCollection && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#242824] border border-[#E8E2D2] dark:border-[#353B35] rounded-2xl p-6 shadow-2xl max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-[#3E4A3E] dark:text-[#F5F2EA] font-serif">
                Edit Collection Details
              </h3>
              <button
                onClick={() => setEditingCollection(null)}
                className="text-[#7C776B] hover:text-[#2D2A26] dark:hover:text-[#F5F2EA]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#6B6559] dark:text-[#A09886] block mb-1">
                  Collection Name *
                </label>
                <input
                  type="text"
                  required
                  value={editColName}
                  onChange={(e) => setEditColName(e.target.value)}
                  placeholder="e.g., Python Basics & OOP"
                  className="w-full px-3 py-2 text-xs bg-[#F5F2EA] dark:bg-[#2D322D] border border-[#E8E2D2] dark:border-[#353B35] rounded-xl text-[#2D2A26] dark:text-[#EAE7DF] focus:outline-none focus:ring-2 focus:ring-[#5A6D5B]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#6B6559] dark:text-[#A09886] block mb-1">
                  Group / Subject Folder *
                </label>
                <input
                  type="text"
                  required
                  list="edit-group-suggestions"
                  value={editColGroup}
                  onChange={(e) => setEditColGroup(e.target.value)}
                  placeholder="e.g., Cybersecurity, Cloud, Programming"
                  className="w-full px-3 py-2 text-xs bg-[#F5F2EA] dark:bg-[#2D322D] border border-[#E8E2D2] dark:border-[#353B35] rounded-xl text-[#2D2A26] dark:text-[#EAE7DF] focus:outline-none focus:ring-2 focus:ring-[#5A6D5B]"
                />
                <datalist id="edit-group-suggestions">
                  {allGroups.map((g) => (
                    <option key={g} value={g} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#6B6559] dark:text-[#A09886] block mb-1">
                  Difficulty Level *
                </label>
                <select
                  value={editColDifficulty}
                  onChange={(e) => setEditColDifficulty(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#F5F2EA] dark:bg-[#2D322D] border border-[#E8E2D2] dark:border-[#353B35] rounded-xl text-[#2D2A26] dark:text-[#EAE7DF] focus:outline-none focus:ring-2 focus:ring-[#5A6D5B]"
                >
                  <option value="Beginner">🟢 Beginner</option>
                  <option value="Intermediate">🟡 Intermediate</option>
                  <option value="Master">🔴 Master (Expert)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#6B6559] dark:text-[#A09886] block mb-1">
                  Description
                </label>
                <textarea
                  value={editColDesc}
                  onChange={(e) => setEditColDesc(e.target.value)}
                  rows={3}
                  placeholder="Short description of learning materials..."
                  className="w-full px-3 py-2 text-xs bg-[#F5F2EA] dark:bg-[#2D322D] border border-[#E8E2D2] dark:border-[#353B35] rounded-xl text-[#2D2A26] dark:text-[#EAE7DF] focus:outline-none focus:ring-2 focus:ring-[#5A6D5B]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingCollection(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#7C776B] hover:bg-[#F5F2EA] dark:hover:bg-[#2D322D]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#5A6D5B] hover:bg-[#485749] text-white font-semibold text-xs transition-all shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Collection Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#242824] border border-[#E8E2D2] dark:border-[#353B35] rounded-2xl p-6 shadow-2xl max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-[#3E4A3E] dark:text-[#F5F2EA] font-serif">
                Create New Knowledge Collection
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-[#7C776B] hover:text-[#2D2A26] dark:hover:text-[#F5F2EA]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCollection} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#6B6559] dark:text-[#A09886] block mb-1">
                  Collection Name *
                </label>
                <input
                  type="text"
                  required
                  value={newColName}
                  onChange={(e) => setNewColName(e.target.value)}
                  placeholder="e.g., Python Basics & OOP"
                  className="w-full px-3 py-2 text-xs bg-[#F5F2EA] dark:bg-[#2D322D] border border-[#E8E2D2] dark:border-[#353B35] rounded-xl text-[#2D2A26] dark:text-[#EAE7DF] focus:outline-none focus:ring-2 focus:ring-[#5A6D5B]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#6B6559] dark:text-[#A09886] block mb-1">
                  Group / Subject Folder *
                </label>
                <input
                  type="text"
                  required
                  list="new-group-suggestions"
                  value={newColGroup}
                  onChange={(e) => setNewColGroup(e.target.value)}
                  placeholder="e.g., Cybersecurity, Cloud, Programming"
                  className="w-full px-3 py-2 text-xs bg-[#F5F2EA] dark:bg-[#2D322D] border border-[#E8E2D2] dark:border-[#353B35] rounded-xl text-[#2D2A26] dark:text-[#EAE7DF] focus:outline-none focus:ring-2 focus:ring-[#5A6D5B]"
                />
                <datalist id="new-group-suggestions">
                  {allGroups.map((g) => (
                    <option key={g} value={g} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#6B6559] dark:text-[#A09886] block mb-1">
                  Difficulty Level *
                </label>
                <select
                  value={newColDifficulty}
                  onChange={(e) => setNewColDifficulty(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#F5F2EA] dark:bg-[#2D322D] border border-[#E8E2D2] dark:border-[#353B35] rounded-xl text-[#2D2A26] dark:text-[#EAE7DF] focus:outline-none focus:ring-2 focus:ring-[#5A6D5B]"
                >
                  <option value="Beginner">🟢 Beginner</option>
                  <option value="Intermediate">🟡 Intermediate</option>
                  <option value="Master">🔴 Master (Expert)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#6B6559] dark:text-[#A09886] block mb-1">
                  Description
                </label>
                <textarea
                  value={newColDesc}
                  onChange={(e) => setNewColDesc(e.target.value)}
                  rows={3}
                  placeholder="Short description of learning materials..."
                  className="w-full px-3 py-2 text-xs bg-[#F5F2EA] dark:bg-[#2D322D] border border-[#E8E2D2] dark:border-[#353B35] rounded-xl text-[#2D2A26] dark:text-[#EAE7DF] focus:outline-none focus:ring-2 focus:ring-[#5A6D5B]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#7C776B] hover:bg-[#F5F2EA] dark:hover:bg-[#2D322D]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#5A6D5B] hover:bg-[#485749] text-white font-semibold text-xs transition-all shadow-sm"
                >
                  Create Collection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Selected Collection Questions Details Drawer/Modal */}
      {selectedCollection && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#242824] border border-[#E8E2D2] dark:border-[#353B35] rounded-2xl p-6 shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-[#E8E2D2] dark:border-[#353B35] shrink-0">
              <div className="flex items-center gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-[#3E4A3E] dark:text-[#F5F2EA] font-serif">
                      {selectedCollection.name}
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#5A6D5B]/10 text-[#5A6D5B] dark:text-[#A3B5A4] border border-[#5A6D5B]/20">
                      📁 {selectedCollection.group || 'General'}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                        selectedCollection.difficulty === 'Beginner'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                          : selectedCollection.difficulty === 'Intermediate'
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                          : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                      }`}
                    >
                      {selectedCollection.difficulty === 'Beginner'
                        ? '🟢 Beginner'
                        : selectedCollection.difficulty === 'Intermediate'
                        ? '🟡 Intermediate'
                        : '🔴 Master'}
                    </span>
                  </div>
                  <p className="text-xs text-[#7C776B] dark:text-[#A09886]">
                    {selectedCollection.questions.length} Questions stored locally
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCollection(null)}
                className="text-[#7C776B] hover:text-[#2D2A26] dark:hover:text-[#F5F2EA]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-3 py-4 flex-1 pr-1">
              {selectedCollection.questions.length === 0 ? (
                <p className="text-xs text-[#7C776B] text-center py-6">
                  No questions in this collection yet. Use the Import Module to import JSON or ZIP packages.
                </p>
              ) : (
                selectedCollection.questions.map((q, idx) => (
                  <div
                    key={q.id}
                    className="p-3.5 bg-[#F5F2EA]/60 dark:bg-[#2D322D]/60 rounded-xl border border-[#E8E2D2] dark:border-[#353B35] text-xs"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="font-bold text-[#5A6D5B] dark:text-[#A3B5A4]">
                        Q{idx + 1}. [{q.category}]
                      </span>
                      <span className="text-[10px] text-[#A09886]">ID: {q.id}</span>
                    </div>

                    <p className="font-semibold text-[#2D2A26] dark:text-[#EAE7DF] mb-2">
                      {q.questionText}
                    </p>

                    {q.image && (
                      <div className="my-3 max-h-64 rounded-2xl overflow-hidden border border-[#E8E2D2] dark:border-[#353B35] bg-[#F5F2EA] dark:bg-[#2D322D] flex items-center justify-center p-2">
                        <img
                          src={q.image}
                          alt="Question supporting diagram"
                          className="max-h-60 object-contain rounded-xl"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mb-2">
                      {q.options.map((opt, oIdx) => (
                        <div
                          key={oIdx}
                          className={`p-2 rounded-lg border text-[11px] font-medium ${
                            oIdx === q.correctIndex
                              ? 'bg-[#5A6D5B]/15 dark:bg-[#5A6D5B]/30 border-[#5A6D5B] text-[#3E4A3E] dark:text-[#A3B5A4] font-bold'
                              : 'bg-white dark:bg-[#242824] border-[#E8E2D2] dark:border-[#353B35] text-[#2D2A26] dark:text-[#EAE7DF]'
                          }`}
                        >
                          <span className="mr-1">{String.fromCharCode(65 + oIdx)}.</span> {opt}
                        </div>
                      ))}
                    </div>

                    {q.explanation && (
                      <p className="text-[11px] text-[#7C776B] dark:text-[#A09886] italic bg-white/50 dark:bg-[#242824]/50 p-2 rounded-lg">
                        Explanation: {q.explanation}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="pt-4 border-t border-[#E8E2D2] dark:border-[#353B35] flex justify-end shrink-0">
              <button
                onClick={() => setSelectedCollection(null)}
                className="px-4 py-2 rounded-xl bg-[#F5F2EA] dark:bg-[#2D322D] text-[#2D2A26] dark:text-[#EAE7DF] font-semibold text-xs border border-[#E8E2D2] dark:border-[#353B35]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import JSZip from 'jszip';
import { KnowledgeCollection } from '../types';

/**
 * Trigger file download in browser
 */
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Format collection according to standard JSON schema
 */
function formatCollectionForExport(collection: KnowledgeCollection) {
  return {
    collectionName: collection.name,
    version: collection.version || 1,
    description: collection.description || 'Expert professional assessment generated from uploaded document.',
    group: collection.group || 'General',
    difficulty: collection.difficulty || 'Master',
    questions: collection.questions.map((q) => {
      const idx = q.correctIndex >= 0 && q.correctIndex <= 3 ? q.correctIndex : 0;
      const optionLetters = ['A', 'B', 'C', 'D'];
      return {
        id: q.id,
        category: q.category || '',
        difficulty: q.difficulty || 'Expert',
        knowledgeLevel: q.knowledgeLevel || 'Analyze',
        questionType: q.questionType || 'Analysis',
        tags: q.tags || [],
        questionText: q.questionText,
        statements: q.statements || {},
        optionA: q.options[0] || '',
        optionB: q.options[1] || '',
        optionC: q.options[2] || '',
        optionD: q.options[3] || '',
        correctAnswer: optionLetters[idx],
        explanation: q.explanation || '',
        sourceReference: q.sourceReference || '',
        imageFile: q.image || '',
      };
    }),
  };
}

/**
 * Export collection as JSON
 */
export function exportCollectionAsJSON(collection: KnowledgeCollection) {
  const exportData = formatCollectionForExport(collection);
  const dataStr = JSON.stringify(exportData, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const filename = `${collection.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_package.json`;
  downloadBlob(blob, filename);
}

/**
 * Export collection as ZIP package
 */
export async function exportCollectionAsZIP(collection: KnowledgeCollection) {
  const zip = new JSZip();

  const exportData = formatCollectionForExport(collection);
  // Create questions.json
  zip.file('questions.json', JSON.stringify(exportData, null, 2));

  // Add images if any
  const imgFolder = zip.folder('images');
  if (imgFolder) {
    for (let i = 0; i < collection.questions.length; i++) {
      const q = collection.questions[i];
      if (q.image && q.image.startsWith('data:image/')) {
        const parts = q.image.split(',');
        const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/png';
        const ext = mime.split('/')[1] || 'png';
        const base64Data = parts[1];
        imgFolder.file(`q_${q.id}.${ext}`, base64Data, { base64: true });
      }
    }
  }

  const content = await zip.generateAsync({ type: 'blob' });
  const filename = `${collection.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_package.zip`;
  downloadBlob(content, filename);
}

/**
 * Download sample JSON template matching system schema
 */
export function downloadSampleJSONTemplate() {
  const template = {
    collectionName: 'Generated Learning Package',
    version: 1,
    description: 'Expert professional assessment generated from uploaded document.',
    group: 'IT & Networking',
    difficulty: 'Master',
    questions: [
      {
        id: 'q001',
        category: 'Networking',
        difficulty: 'Expert',
        knowledgeLevel: 'Analyze',
        questionType: 'Analysis',
        tags: ['networking', 'protocols'],
        questionText: 'Which protocol resolves domain names to IP addresses?',
        statements: {},
        optionA: 'DHCP',
        optionB: 'DNS',
        optionC: 'SNMP',
        optionD: 'FTP',
        correctAnswer: 'B',
        explanation: 'Provide detailed reasoning. Explain why the correct answer is selected and why other options are incorrect. Reference: Chapter/Section/Page.',
        sourceReference: 'Chapter 4, Section 2',
        imageFile: '',
      },
      {
        id: 'q002',
        category: 'Security',
        difficulty: 'Expert',
        knowledgeLevel: 'Analyze',
        questionType: 'Analysis',
        tags: ['security', 'cia'],
        questionText: 'What does the \'C\' in the CIA triad stand for?',
        statements: {},
        optionA: 'Control',
        optionB: 'Confidentiality',
        optionC: 'Cryptography',
        optionD: 'Compliance',
        correctAnswer: 'B',
        explanation: 'Provide detailed reasoning. Explain why the correct answer is selected and why other options are incorrect. Reference: Chapter/Section/Page.',
        sourceReference: 'Chapter 1, Page 12',
        imageFile: '',
      },
    ],
  };

  const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
  downloadBlob(blob, 'sample_questions_template.json');
}

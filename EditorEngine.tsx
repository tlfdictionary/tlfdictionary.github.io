
import React, { useState, useRef } from 'react';
import { JargonTerm, DictionaryData, Meaning } from './types';
import { geminiService } from './services/geminiService';

interface EditorEngineProps {
  data: DictionaryData;
  onUpdate: (newData: DictionaryData) => void;
}

const EditorEngine: React.FC<EditorEngineProps> = ({ data, onUpdate }) => {
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [newCat, setNewCat] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newTerm, setNewTerm] = useState<{
    term: string;
    pronunciation: string;
    meanings: Meaning[];
    category: string;
  }>({
    term: '',
    pronunciation: '',
    meanings: [{ partOfSpeech: 'noun', definition: '', example: '' }],
    category: data.categories[0] || 'General'
  });

  const handleAddTerm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTerm.term || newTerm.meanings.some(m => !m.definition)) return;

    const term: JargonTerm = {
      ...newTerm,
      id: Math.random().toString(36).substr(2, 9),
      tags: [],
      createdAt: Date.now(),
      isAiGenerated: false
    };

    onUpdate({
      ...data,
      terms: [term, ...data.terms]
    });

    setNewTerm({
      term: '',
      pronunciation: '',
      meanings: [{ partOfSpeech: 'noun', definition: '', example: '' }],
      category: data.categories[0] || 'General'
    });
  };

  const handleAiAssist = async () => {
    if (!newTerm.term) return;
    setIsAiLoading(true);
    try {
      const defined = await geminiService.defineTerm(newTerm.term);
      setNewTerm(prev => ({
        ...prev,
        pronunciation: defined.pronunciation || '',
        meanings: defined.meanings || prev.meanings,
        category: data.categories.includes(defined.category || '') ? defined.category! : prev.category
      }));
    } catch (err) {
      alert("AI failed to define. Please try manually.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const addMeaning = () => {
    setNewTerm(prev => ({
      ...prev,
      meanings: [...prev.meanings, { partOfSpeech: 'noun', definition: '', example: '' }]
    }));
  };

  const removeMeaning = (index: number) => {
    if (newTerm.meanings.length <= 1) return;
    const updated = [...newTerm.meanings];
    updated.splice(index, 1);
    setNewTerm({ ...newTerm, meanings: updated });
  };

  const updateMeaning = (index: number, field: keyof Meaning, value: string) => {
    const updated = [...newTerm.meanings];
    updated[index] = { ...updated[index], [field]: value };
    setNewTerm({ ...newTerm, meanings: updated });
  };

  const deleteTerm = (id: string) => {
    onUpdate({ ...data, terms: data.terms.filter(t => t.id !== id) });
  };

  const addCategory = () => {
    if (!newCat || data.categories.includes(newCat)) return;
    onUpdate({ ...data, categories: [...data.categories, newCat] });
    setNewCat('');
  };

  const deleteCategory = (cat: string) => {
    if (cat === 'General') return;
    onUpdate({
      ...data,
      categories: data.categories.filter(c => c !== cat),
      terms: data.terms.map(t => t.category === cat ? { ...t, category: 'General' } : t)
    });
  };

  const downloadJson = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'words.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.terms && json.categories) {
          onUpdate(json);
          alert("Dictionary updated successfully!");
        }
      } catch (err) {
        alert("Invalid JSON file.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-4">Categories</h3>
          <div className="space-y-2 mb-4">
            {data.categories.map(cat => (
              <div key={cat} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl group">
                <span className="text-sm font-medium text-gray-700">{cat}</span>
                {cat !== 'General' && (
                  <button 
                    onClick={() => deleteCategory(cat)}
                    className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="New tag..." 
              className="flex-1 px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg outline-none focus:border-indigo-500"
              value={newCat}
              onChange={(e) => setNewCat(e.target.value)}
            />
            <button 
              onClick={addCategory}
              className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>

        <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 space-y-3">
          <h3 className="text-xs font-black text-indigo-700 uppercase tracking-widest">Master File Management</h3>
          <p className="text-[10px] text-indigo-400 font-medium">Download your current state to manually update the 'words.json' file in your project repository.</p>
          <div className="flex flex-col gap-2">
            <button 
              onClick={downloadJson}
              className="w-full py-3 bg-white text-indigo-700 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:shadow-md transition-all border border-indigo-200"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export words.json
            </button>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-3 bg-transparent text-indigo-400 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:text-indigo-600 transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Import Local File
            </button>
            <input 
              type="file" 
              className="hidden" 
              ref={fileInputRef} 
              accept=".json" 
              onChange={handleImport} 
            />
          </div>
        </div>
      </div>

      <div className="lg:col-span-2 space-y-8">
        <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Add New Word</h3>
          <form onSubmit={handleAddTerm} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex gap-2">
                <input 
                  required
                  type="text" 
                  placeholder="Term" 
                  className="flex-1 p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-100 outline-none"
                  value={newTerm.term}
                  onChange={(e) => setNewTerm({...newTerm, term: e.target.value})}
                />
                <button 
                  type="button"
                  onClick={handleAiAssist}
                  disabled={isAiLoading || !newTerm.term}
                  className="px-4 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors disabled:opacity-50"
                >
                  {isAiLoading ? "..." : "AI Assist"}
                </button>
              </div>
              <input 
                type="text" 
                placeholder="Pronunciation (e.g. /ˈlɪŋɡoʊ/)" 
                className="p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-100 outline-none"
                value={newTerm.pronunciation}
                onChange={(e) => setNewTerm({...newTerm, pronunciation: e.target.value})}
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Meanings</h4>
                <button 
                  type="button"
                  onClick={addMeaning}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
                >
                  + Add Meaning
                </button>
              </div>
              {newTerm.meanings.map((meaning, index) => (
                <div key={index} className="p-4 bg-gray-50 border border-gray-100 rounded-xl relative space-y-3">
                  {newTerm.meanings.length > 1 && (
                    <button 
                      type="button"
                      onClick={() => removeMeaning(index)}
                      className="absolute top-2 right-2 text-gray-300 hover:text-red-500"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <select 
                      className="p-2 bg-white border border-gray-100 rounded-lg outline-none text-sm"
                      value={meaning.partOfSpeech}
                      onChange={(e) => updateMeaning(index, 'partOfSpeech', e.target.value)}
                    >
                      <option value="noun">noun</option>
                      <option value="verb">verb</option>
                      <option value="adjective">adjective</option>
                      <option value="adverb">adverb</option>
                      <option value="slang">slang</option>
                    </select>
                    <input 
                      required
                      placeholder="Definition"
                      className="md:col-span-2 p-2 bg-white border border-gray-100 rounded-lg outline-none text-sm"
                      value={meaning.definition}
                      onChange={(e) => updateMeaning(index, 'definition', e.target.value)}
                    />
                  </div>
                  <input 
                    placeholder="Example sentence"
                    className="w-full p-2 bg-white border border-gray-100 rounded-lg outline-none text-sm"
                    value={meaning.example || ''}
                    onChange={(e) => updateMeaning(index, 'example', e.target.value)}
                  />
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Dictionary Category</label>
              <select 
                className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-100 outline-none cursor-pointer"
                value={newTerm.category}
                onChange={(e) => setNewTerm({...newTerm, category: e.target.value})}
              >
                {data.categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            
            <button className="w-full py-4 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition-all shadow-lg">
              Save Entry
            </button>
          </form>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Lexicon Data ({data.terms.length})</h3>
          <div className="space-y-3">
            {data.terms.map(term => (
              <div key={term.id} className="bg-white p-4 rounded-xl border border-gray-100 flex justify-between items-center shadow-sm">
                <div>
                  <h4 className="font-bold text-gray-900">{term.term}</h4>
                  <p className="text-xs text-gray-400">{term.category} • {term.meanings?.length || 0} meanings</p>
                </div>
                <button onClick={() => deleteTerm(term.id)} className="p-2 text-red-100 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditorEngine;

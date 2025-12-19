
import React, { useState, useMemo, useEffect } from 'react';
import { JargonTerm, DictionaryData } from './types';

const GOOGLE_FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSfP8y9_k1m6m7P_your_form_id/viewform"; // Replace with actual form URL

const App: React.FC = () => {
  const [data, setData] = useState<DictionaryData>({ terms: [], categories: ['General'] });
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      // Still check local storage for cache, but primary is words.json
      const saved = localStorage.getItem('lingo_data_v2');
      if (saved) {
        setData(JSON.parse(saved));
      } else {
        try {
          const response = await fetch('./words.json');
          const json = await response.json();
          setData(json);
        } catch (error) {
          console.error("Failed to load words.json", error);
        }
      }
      setIsInitialLoad(false);
    };
    loadData();
  }, []);

  const filteredTerms = useMemo(() => {
    return data.terms
      .filter(t => 
        (activeCategory === 'All' || t.category === activeCategory) &&
        (t.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
         t.meanings.some(m => m.definition.toLowerCase().includes(searchQuery.toLowerCase())))
      )
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [data.terms, searchQuery, activeCategory]);

  if (isInitialLoad) return null;

  return (
    <div className="min-h-screen flex flex-col items-center p-6 md:p-12 lg:p-20">
      <header className="w-full max-w-5xl flex flex-col gap-8 mb-16">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="text-3xl font-black tracking-tighter text-gray-900 group">
            The Unofficial <span className="text-red-600 transition-transform group-hover:underline inline-block"><a href="https://leaders.tech" target="_blank" rel="noopener noreferrer">TLF</a></span> Dictionary
          </div>
          <nav>
            <a 
              href={GOOGLE_FORM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-2xl text-sm font-bold bg-red-600 text-white shadow-lg shadow-red-100 hover:bg-red-700 hover:-translate-y-0.5 transition-all flex items-center gap-2 active:scale-95"
            >
              Want to add a word?
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </nav>
        </div>

        <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400 group-focus-within:text-red-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search definitions or words..."
              className="w-full pl-14 pr-6 py-6 bg-white border border-gray-100 rounded-3xl shadow-sm focus:ring-8 focus:ring-red-50 focus:border-red-200 outline-none transition-all text-xl font-medium placeholder:text-gray-300"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveCategory('All')}
              className={`px-5 py-2 rounded-full text-xs font-bold tracking-wide transition-all ${
                activeCategory === 'All' 
                  ? 'bg-gray-900 text-white' 
                  : 'bg-white text-gray-400 hover:text-gray-600 hover:bg-gray-50 border border-gray-100 shadow-sm'
              }`}
            >
              ALL
            </button>
            {data.categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-5 py-2 rounded-full text-xs font-bold tracking-wide transition-all ${
                  activeCategory === cat 
                    ? 'bg-red-600 text-white' 
                    : 'bg-white text-gray-400 hover:text-gray-600 hover:bg-gray-50 border border-gray-100 shadow-sm'
                }`}
              >
                {cat.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="w-full max-w-5xl">
        <div className="animate-in fade-in duration-700">
          {filteredTerms.length === 0 ? (
            <div className="text-center py-32 bg-white rounded-[40px] border border-dashed border-gray-200">
              <p className="text-gray-400 font-medium text-lg">
                {searchQuery ? `No results for "${searchQuery}"` : "The dictionary is currently silent."}
              </p>
              <div className="mt-8">
                <a 
                  href={GOOGLE_FORM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-red-600 font-bold hover:underline flex items-center justify-center gap-2"
                >
                  Submit a new entry via Google Forms
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </a>
              </div>
            </div>
          ) : (
            <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
              {filteredTerms.map((term) => (
                <div 
                  key={term.id} 
                  className="break-inside-avoid bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500"
                >
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-[10px] uppercase tracking-[0.2em] font-black text-red-600 bg-red-50/50 px-3 py-1 rounded-lg">
                      {term.category}
                    </span>
                  </div>
                  <div className="mb-6">
                    <h3 className="text-2xl font-black text-gray-900 tracking-tight">{term.term}</h3>
                    {term.pronunciation && (
                      <p className="text-sm font-medium text-red-400 mt-1 italic">{term.pronunciation}</p>
                    )}
                  </div>
                  
                  <div className="space-y-6">
                    {term.meanings?.map((meaning, idx) => (
                      <div key={idx} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-300">{idx + 1}.</span>
                          <span className="text-xs font-black text-red-300 italic uppercase tracking-wider">{meaning.partOfSpeech}</span>
                        </div>
                        <p className="text-gray-700 leading-relaxed text-[15px] font-medium">
                          {meaning.definition}
                        </p>
                        {meaning.example && (
                          <div className="relative pl-4">
                            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-red-50 rounded-full" />
                            <p className="italic text-gray-400 text-xs leading-relaxed">
                              "{meaning.example}"
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {term.isAiGenerated && (
                    <div className="mt-8 pt-6 border-t border-gray-50 flex items-center justify-between">
                      <div className="text-[9px] text-red-300 flex items-center gap-1 font-bold uppercase tracking-widest">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        AI ASSISTED
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <footer className="mt-auto pt-32 pb-12 text-center">
        <div className="inline-flex flex-col items-center gap-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full border border-gray-100">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              {data.terms.length} Definitions Distributed
            </p>
          </div>
          <p className="text-[10px] text-gray-300 font-medium max-w-xs leading-relaxed">
            Maintained by the TLF community. New words are periodically synced from the contribution form.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;

"use client";

import { useState, useEffect, useCallback } from "react";

interface InspirationItem {
  id: string;
  image: string;
  prompt: string;
  title: string;
  category: string;
  model?: string;
  tags?: string[];
}

// ─── 弹窗组件 ─────────────────────────────────────────────────────────────────

function InspirationModal({ item, onClose }: { item: InspirationItem; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!item.prompt) return;
    await navigator.clipboard.writeText(item.prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div className="relative">
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute -top-2 -right-14 z-10 h-10 w-10 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div
          className="flex max-h-[90vh] w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          {/* 左侧图片 */}
          <div className="flex-1 bg-black flex items-center justify-center min-w-0">
            <img
              src={item.image}
              alt={item.prompt}
              className="max-h-[90vh] w-full object-contain"
              draggable={false}
              onContextMenu={e => e.preventDefault()}
            />
          </div>

          {/* 右侧信息面板 */}
          <div className="w-80 shrink-0 bg-white flex flex-col">
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {item.prompt && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-900">画面描述</span>
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1 text-xs text-violet-500 hover:text-violet-600 transition-colors font-medium"
                    >
                      {copied
                        ? <><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>已复制</>
                        : <><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>复制描述词</>
                      }
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">{item.prompt}</p>
                </div>
              )}

              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">创作信息</h3>
                <div className="space-y-2.5">
                  {item.category && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">分类</span>
                      <span className="text-xs text-gray-800">{item.category}</span>
                    </div>
                  )}
                  {item.model && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">模型</span>
                      <span className="text-xs text-gray-800">{item.model}</span>
                    </div>
                  )}
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs text-gray-500 shrink-0">标签</span>
                      <div className="flex flex-wrap gap-1 justify-end">
                        {item.tags.map((tag, i) => (
                          <span key={i} className="text-[10px] bg-violet-50 text-violet-600 rounded-full px-2 py-0.5">{tag}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-end">
              <button
                onClick={handleCopy}
                className="bg-violet-500 hover:bg-violet-600 text-white rounded-full px-5 py-2 text-sm font-medium transition-colors"
              >
                {copied ? '已复制' : '复制提示词'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ImageCard({ item, onClick }: { item: InspirationItem; onClick: () => void }) {
  return (
    <div
      className="relative overflow-hidden rounded-xl cursor-pointer group mb-3 break-inside-avoid bg-gray-100"
      onClick={onClick}
    >
      <img
        src={item.image}
        alt={item.prompt || item.title}
        className="w-full object-cover transition-transform duration-300 group-hover:scale-105"
        loading="lazy"
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <p className="text-white text-xs leading-relaxed line-clamp-2">{item.prompt || item.title}</p>
          {item.category && (
            <span className="mt-1 inline-block text-white/70 text-[10px] bg-white/20 rounded-full px-2 py-0.5">{item.category}</span>
          )}
        </div>
      </div>
    </div>
  );
}

function SearchBar({ value, onChange, onSearch }: { value: string; onChange: (v: string) => void; onSearch: () => void }) {
  return (
    <div className="relative max-w-2xl mx-auto">
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && onSearch()}
        placeholder="搜索提示词..."
        className="w-full pl-10 pr-20 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 shadow-sm"
      />
      <button
        onClick={onSearch}
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-violet-600 text-white rounded-lg px-4 py-1.5 text-sm font-medium hover:bg-violet-700 transition-colors"
      >
        搜索
      </button>
    </div>
  );
}

export default function InspirationGallery() {
  const [activeCategory, setActiveCategory] = useState('全部');
  const [searchQuery, setSearchQuery] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [items, setItems] = useState<InspirationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [pageToken, setPageToken] = useState('');
  const [categories, setCategories] = useState<string[]>(['全部']);
  const [selectedItem, setSelectedItem] = useState<InspirationItem | null>(null);
  const [toast, setToast] = useState<string>('');

  const fetchData = useCallback(async (category: string, keyword: string, token: string, reset: boolean) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page_size: '30' });
      if (category !== '全部') params.set('category', category);
      if (keyword) params.set('keyword', keyword);
      if (token) params.set('page_token', token);
      const res = await fetch(`/api/inspiration?${params}`);
      const data = await res.json();
      if (data.success) {
        setItems(prev => reset ? data.data : [...prev, ...data.data]);
        setHasMore(data.has_more);
        setPageToken(data.page_token || '');
        if (data.categories?.length > 0) {
          setCategories(prev => {
            const all = new Set([...prev.filter(c => c !== '全部'), ...data.categories]);
            return ['全部', ...Array.from(all)];
          });
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setItems([]);
    setPageToken('');
    fetchData(activeCategory, searchQuery, '', true);
  }, [activeCategory, searchQuery, fetchData]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-4 mb-3">
            <h1 className="text-lg font-bold text-gray-900 flex-shrink-0">✨ 灵感库</h1>
            <SearchBar value={inputValue} onChange={setInputValue} onSearch={() => setSearchQuery(inputValue)} />
          </div>
          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex-shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors whitespace-nowrap ${
                  activeCategory === cat ? 'bg-violet-600 text-white' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-4">
        {loading && items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin mb-3" />
            <p className="text-sm">加载中...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <div className="text-4xl mb-3">🎨</div>
            <p>暂无相关作品</p>
          </div>
        ) : (
          <>
            <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 xl:columns-6 gap-3">
              {items.map(item => <ImageCard key={item.id} item={item} onClick={() => setSelectedItem(item)} />)}
            </div>
            {hasMore && (
              <div className="flex justify-center py-8">
                <button
                  onClick={() => fetchData(activeCategory, searchQuery, pageToken, false)}
                  disabled={loading}
                  className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 px-6 py-2 rounded-full border border-gray-200 hover:border-gray-300 bg-white"
                >
                  {loading && <div className="w-4 h-4 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />}
                  加载更多
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-sm px-4 py-2 rounded-full shadow-lg z-50">
          {toast}
        </div>
      )}

      {selectedItem && (
        <InspirationModal item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}
    </div>
  );
}

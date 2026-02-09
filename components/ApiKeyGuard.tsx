import React, { useEffect, useState } from 'react';

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
}

export const ApiKeyGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hasKey, setHasKey] = useState(false);
  const [checking, setChecking] = useState(true);

  const checkKey = async () => {
    if (window.aistudio) {
      const has = await window.aistudio.hasSelectedApiKey();
      setHasKey(has);
    }
    setChecking(false);
  };

  useEffect(() => {
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setHasKey(true);
    } else {
        alert("未偵測到 AI Studio 環境。");
    }
  };

  if (checking) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-crimson-texture">
            <div className="w-16 h-16 border-4 border-gold/30 border-t-gold rounded-full animate-spin"></div>
        </div>
    );
  }

  if (!hasKey) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-crimson-texture relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full bg-wave-pattern opacity-10 pointer-events-none"></div>
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full border border-gold/20 pointer-events-none"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] rounded-full border border-gold/20 pointer-events-none"></div>

        <div className="bg-paper p-10 max-w-md w-full relative z-10 shadow-paper-3 clip-paper-cut">
            {/* Gold Frame Border inside */}
            <div className="absolute inset-2 border border-gold opacity-50 pointer-events-none"></div>
            
            <div className="absolute -top-6 -left-6 w-12 h-12 bg-crimson flex items-center justify-center rounded-full shadow-lg border-2 border-gold">
                <span className="text-xl font-serif text-gold font-bold">!</span>
            </div>
            
            <h1 className="text-4xl font-serif font-black text-ink mb-2">
                LuxeAI
            </h1>
            <p className="text-gold-dark text-lg font-serif tracking-widest mb-6 border-b border-gold/30 pb-4 inline-block">
                影像工作室
            </p>

            <p className="text-ink/80 text-base font-medium mb-8 leading-relaxed">
                啟動 <span className="font-bold text-crimson">Gemini 3 Pro Image</span> 模型<br/>
                體驗極致奢華的生成式藝術
            </p>

            <button
                onClick={handleSelectKey}
                className="w-full bg-gold-gradient text-crimson-dark font-bold text-lg py-4 px-6 rounded shadow-lg hover:shadow-gold-glow hover:-translate-y-1 transition-all duration-300"
            >
                選擇 API 金鑰
            </button>
            
            <p className="mt-6 text-sm">
                <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="text-gold-dark hover:text-crimson transition-colors underline underline-offset-4 decoration-gold/50">
                    → 查看計費說明
                </a>
            </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
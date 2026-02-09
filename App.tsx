import React, { useState, useRef } from 'react';
import { ApiKeyGuard } from './components/ApiKeyGuard';
import { searchCompanyLogo, generateBrandInteraction, generateRedCarpetTemplateSwap } from './services/geminiService';
import { AppMode, ProcessingState, LogoSearchResult } from './types';

// --- Helper Functions ---

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            // Remove data url prefix (e.g. "data:image/jpeg;base64,")
            const base64 = result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = error => reject(error);
    });
};

// --- Styled Components (Luxury Theme) ---

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <div className="mb-8 relative">
        <h2 className="text-4xl md:text-5xl font-serif font-bold text-ink mb-2 tracking-tight">
            {children}
        </h2>
        <div className="h-1 w-24 bg-gold-gradient rounded-full"></div>
    </div>
);

const FloatingMenuCard = ({ index, title, description, image, onClick, delay = false, isProcessing = false }: any) => {
    // Add robustness: If local image is missing, fallback to the GitHub raw image
    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
        if (index === 1) {
            // Fallback for Red Carpet - Using RAW GitHub content
            e.currentTarget.src = "https://raw.githubusercontent.com/david1117/ChineseNewYear_n_RedCarpet/afbb49c0c1dbb9fb0df8e603985fda3a65670f42/Images/Red_CarpetShot.png";
        } else {
            // Fallback for Brand Card (CNY Theme) - Using RAW GitHub content
            e.currentTarget.src = "https://raw.githubusercontent.com/david1117/ChineseNewYear_n_RedCarpet/afbb49c0c1dbb9fb0df8e603985fda3a65670f42/Images/ChineseNewYearCard.png";
        }
    };

    return (
        <div
            onClick={onClick}
            className={`
            relative group flex flex-row h-64 w-full max-w-2xl mx-auto
            bg-paper cursor-pointer
            shadow-paper-2 hover:shadow-paper-3 hover:-translate-y-1
            transition-all duration-500 overflow-hidden rounded-2xl
            ${delay ? 'animate-float-delayed' : 'animate-float'}
            ${isProcessing ? 'ring-2 ring-gold ring-offset-2' : ''}
        `}
        >
            {/* Image Section (Paper Cut Look) */}
            <div className="w-1/2 relative overflow-hidden clip-diagonal-right">
                <img 
                    src={image} 
                    alt={title} 
                    onError={handleImageError}
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 grayscale group-hover:grayscale-0" 
                />
                <div className="absolute inset-0 bg-crimson mix-blend-multiply opacity-20 group-hover:opacity-0 transition-opacity duration-500"></div>
            </div>

            {/* Content Section */}
            <div className="w-1/2 p-8 flex flex-col justify-center relative">
                {/* Decorative BG Character */}
                <div className="absolute right-2 top-2 text-9xl font-serif text-gray-100 opacity-50 select-none pointer-events-none z-0">
                    {index === 1 ? '星' : '禮'}
                </div>

                <div className="relative z-10">
                    <span className="text-gold-dark font-serif text-xs tracking-[0.2em] uppercase mb-2 block">Feature 0{index}</span>
                    <h3 className="text-2xl font-serif font-bold text-crimson mb-3 group-hover:text-gold-dark transition-colors">{title}</h3>
                    <p className="text-sm font-sans text-ink/70 leading-relaxed mb-6 border-l-2 border-gold/30 pl-3">
                        {description}
                    </p>
                    
                    <div className="flex items-center gap-2 text-gold-dark font-serif text-sm group-hover:gap-4 transition-all">
                        {isProcessing ? (
                            <span className="animate-pulse text-crimson font-bold">● 背景運算中...</span>
                        ) : (
                            <>
                                <span>開始創作</span>
                                <span>→</span>
                            </>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Gold Border Frame */}
            <div className="absolute inset-0 border border-gold/20 pointer-events-none group-hover:border-gold/60 transition-colors duration-500 rounded-2xl"></div>
        </div>
    );
};

const Button = ({ onClick, disabled, children, variant = "primary" }: any) => {
    // Primary is Gold Gradient, Secondary is outlined
    const baseClass = "w-full font-bold text-lg py-4 px-6 transition-all duration-300 relative overflow-hidden group rounded-xl";
    const primaryClass = "bg-gold-gradient text-crimson-dark shadow-lg hover:shadow-gold-glow hover:-translate-y-0.5";
    const secondaryClass = "bg-transparent border-2 border-gold text-gold-dark hover:bg-gold/10";
    const disabledClass = "opacity-60 cursor-not-allowed"; // Removed grayscale to keep it visible

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`${baseClass} ${disabled ? disabledClass : (variant === "primary" ? primaryClass : secondaryClass)}`}
        >
             <span className="relative z-10 flex items-center justify-center gap-2">{children}</span>
             {variant === 'primary' && !disabled && <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>}
        </button>
    )
};

const Input = ({ label, ...props }: any) => (
    <div className="mb-6 group">
        <label className="block text-crimson-dark font-serif font-bold text-sm mb-2 tracking-widest">{label}</label>
        <div className="relative">
            <input
                {...props}
                className="w-full bg-cream border-b-2 border-gold/30 px-4 py-3 font-medium text-ink focus:outline-none focus:border-gold focus:bg-white transition-all placeholder-gray-400 rounded-t-lg"
            />
            <div className="absolute bottom-0 left-0 w-0 h-[2px] bg-gold transition-all duration-500 group-hover:w-full"></div>
        </div>
    </div>
);

const Spinner = () => (
    <div className="relative w-20 h-20">
        <div className="absolute inset-0 border-4 border-gold/20 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-gold border-t-transparent rounded-full animate-spin"></div>
        <div className="absolute inset-4 bg-crimson rounded-full animate-pulse opacity-20"></div>
    </div>
);

// Define Brand Presets for the UI Grid
const BRAND_PRESETS_UI = [
    { 
        name: "可果美", 
        id: "kagome",
        logo: "https://raw.githubusercontent.com/david1117/ChineseNewYear_n_RedCarpet/be621e5924378f1c14dc94aab9e891f48e0efa55/Images/Kagome_Taiwan.png"
    },
    { 
        name: "Horoyoi", 
        id: "horoyoi",
        logo: "https://raw.githubusercontent.com/david1117/ChineseNewYear_n_RedCarpet/025773a1c09cbe623d6d8da89390b4f1558ffd54/Images/Horoyoi.webp"
    },
    { 
        name: "EverClean", 
        id: "everclean",
        logo: "https://raw.githubusercontent.com/david1117/ChineseNewYear_n_RedCarpet/abe509b990b079a2b9b02cecd76035bd84ad03a9/Images/everclean.png"
    },
    { 
        name: "卡迪那", 
        id: "cadina",
        logo: "https://raw.githubusercontent.com/david1117/ChineseNewYear_n_RedCarpet/abe509b990b079a2b9b02cecd76035bd84ad03a9/Images/Cadina.png"
    },
    { 
        name: "ScoopAway", 
        id: "scoopaway",
        logo: "https://raw.githubusercontent.com/david1117/ChineseNewYear_n_RedCarpet/3f63eb43b844530adc6f1f0ed49563e821154499/Images/ScoopAway.png"
    }
];

// --- Main App Component ---

const App: React.FC = () => {
    const [mode, setMode] = useState<AppMode>(AppMode.LANDING);
    
    // Independent Processing States for Background Execution
    const [rcProcessingState, setRcProcessingState] = useState<ProcessingState>(ProcessingState.IDLE);
    const [rcErrorMsg, setRcErrorMsg] = useState<string | null>(null);

    const [brandProcessingState, setBrandProcessingState] = useState<ProcessingState>(ProcessingState.IDLE);
    const [brandErrorMsg, setBrandErrorMsg] = useState<string | null>(null);

    // Red Carpet State
    const [rcImageBase64, setRcImageBase64] = useState<string | null>(null);
    const [rcFileName, setRcFileName] = useState<string | null>(null);
    const [rcResult, setRcResult] = useState<string | null>(null);
    const [rcHistory, setRcHistory] = useState<string[]>([]); // History array
    const [rcDressStyle, setRcDressStyle] = useState('');
    
    // Ref for Red Carpet File Input (hidden in right panel)
    const rcFileInputRef = useRef<HTMLInputElement>(null);

    // Brand State
    const [brandName, setBrandName] = useState('');
    const [brandResult, setBrandResult] = useState<string | null>(null);
    const [brandHistory, setBrandHistory] = useState<string[]>([]); // History array
    const [brandImageBase64, setBrandImageBase64] = useState<string | null>(null);
    const [brandFileName, setBrandFileName] = useState<string | null>(null);

    // Ref for Brand File Input (hidden in right panel)
    const brandFileInputRef = useRef<HTMLInputElement>(null);

    // Modified Switch Mode: Only changes view, PRESERVES state
    const switchMode = (newMode: AppMode) => {
        setMode(newMode);
    };

    // --- Handlers ---

    const handleRcFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setRcFileName(file.name);
            try {
                const base64 = await fileToBase64(file);
                setRcImageBase64(base64);
                // Reset to IDLE to immediately show the uploaded image preview
                setRcProcessingState(ProcessingState.IDLE);
            } catch (err) {
                console.error("File processing error", err);
                setRcErrorMsg("圖片處理失敗");
            }
        }
    };
    
    // Trigger hidden RC file input
    const triggerRcFileUpload = () => {
        // Only trigger if not currently generating
        if (rcProcessingState !== ProcessingState.SEARCHING_LOGO && rcProcessingState !== ProcessingState.GENERATING) {
            rcFileInputRef.current?.click();
        }
    };

    const handleRcSubmit = async () => {
        if (!rcImageBase64) {
            setRcErrorMsg("請在右側預覽區點擊上傳照片");
            return;
        }
        setRcErrorMsg(null);
        setRcProcessingState(ProcessingState.GENERATING);

        try {
            const result = await generateRedCarpetTemplateSwap(
                rcImageBase64, 
                {
                    gender: 'original',
                    bodyType: 'original',
                    dressStyle: rcDressStyle
                }
            );
            setRcResult(result);
            // Update History (Max 3)
            setRcHistory(prev => {
                const newHistory = [result, ...prev].filter((item, index, self) => self.indexOf(item) === index);
                return newHistory.slice(0, 3);
            });
            setRcProcessingState(ProcessingState.COMPLETE);

        } catch (err: any) {
            setRcErrorMsg(err.message || "發生錯誤，請重試");
            setRcProcessingState(ProcessingState.ERROR);
        }
    };

    const handleBrandFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setBrandFileName(file.name);
            try {
                const base64 = await fileToBase64(file);
                setBrandImageBase64(base64);
                // Reset to IDLE to immediately show the uploaded image preview
                setBrandProcessingState(ProcessingState.IDLE);
            } catch (err) {
                console.error("File processing error", err);
                setBrandErrorMsg("圖片處理失敗");
            }
        }
    };

    // Trigger hidden file input
    const triggerBrandFileUpload = () => {
        if (brandProcessingState !== ProcessingState.GENERATING) {
            brandFileInputRef.current?.click();
        }
    };

    const handleBrandSubmit = async () => {
        if (!brandName) {
            setBrandErrorMsg("請輸入品牌名稱");
            return;
        }
        if (!brandImageBase64) {
            setBrandErrorMsg("請在右側預覽區點擊上傳照片");
            return;
        }

        setBrandProcessingState(ProcessingState.GENERATING);
        setBrandErrorMsg(null);

        try {
            const result = await generateBrandInteraction(
                brandImageBase64, 
                brandName,
                ""
            );
            setBrandResult(result);
            // Update History (Max 3)
            setBrandHistory(prev => {
                const newHistory = [result, ...prev].filter((item, index, self) => self.indexOf(item) === index);
                return newHistory.slice(0, 3);
            });
            setBrandProcessingState(ProcessingState.COMPLETE);
        } catch (err: any) {
            setBrandErrorMsg(err.message || "生成失敗");
            setBrandProcessingState(ProcessingState.ERROR);
        }
    };

    // --- Views ---

    const renderLanding = () => {
        const isRcRunning = rcProcessingState === ProcessingState.SEARCHING_LOGO || rcProcessingState === ProcessingState.GENERATING;
        const isBrandRunning = brandProcessingState === ProcessingState.GENERATING;

        return (
            <div className="min-h-[calc(100vh-80px)] p-6 relative flex flex-col items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-wave-pattern opacity-10 animate-cloud-drift"></div>
                <div className="absolute top-[-10%] left-1/2 transform -translate-x-1/2 w-[800px] h-[800px] bg-gold rounded-full opacity-5 blur-3xl pointer-events-none"></div>

                <div className="z-10 w-full max-w-5xl px-4 flex flex-col lg:flex-row gap-12 items-center">
                    <div className="w-full lg:w-1/2 text-center lg:text-left text-cream mb-8 lg:mb-0">
                        <h1 className="text-6xl md:text-8xl font-serif font-black mb-6 text-gradient-gold">
                            春樹夥伴<br/>
                            誠摯祝福
                        </h1>
                        <p className="text-xl md:text-2xl font-light tracking-wide text-cream/90 mb-8 leading-relaxed">
                            在新的一年<br/>
                            馬到成功 立馬有錢
                        </p>
                        <div className="w-24 h-1 bg-gold mx-auto lg:mx-0"></div>
                    </div>

                    <div className="w-full lg:w-1/2 flex flex-col gap-8">
                        <FloatingMenuCard
                            index={1}
                            title="紅毯時刻"
                            description="智慧 Logo 搜尋與場景合成，打造好萊塢紅毯時刻。"
                            image="https://raw.githubusercontent.com/david1117/ChineseNewYear_n_RedCarpet/afbb49c0c1dbb9fb0df8e603985fda3a65670f42/Images/Red_CarpetShot.png"
                            onClick={() => switchMode(AppMode.RED_CARPET)}
                            delay={false}
                            isProcessing={isRcRunning}
                        />

                        <FloatingMenuCard
                            index={2}
                            title="品牌賀卡"
                            description="AI技術，生成極致真實的商業產品賀卡。"
                            image="https://raw.githubusercontent.com/david1117/ChineseNewYear_n_RedCarpet/afbb49c0c1dbb9fb0df8e603985fda3a65670f42/Images/ChineseNewYearCard.png"
                            onClick={() => switchMode(AppMode.BRAND_INTERACTION)}
                            delay={true}
                            isProcessing={isBrandRunning}
                        />
                    </div>
                </div>
            </div>
        );
    };

    const renderRedCarpet = () => (
        <div className="max-w-7xl mx-auto px-4 py-12 relative z-10">
            <button onClick={() => switchMode(AppMode.LANDING)} className="mb-8 font-serif text-cream hover:text-gold flex items-center gap-2 text-lg transition-colors">
                <span>←</span> 返回主選單
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                {/* Control Panel */}
                <div className="lg:col-span-5 space-y-8">
                    <div className="bg-paper p-6 md:p-10 shadow-paper-3 relative rounded-3xl">
                        <SectionTitle>紅毯時刻</SectionTitle>
                        <p className="font-sans text-ink/70 mb-8 border-l-2 border-crimson pl-4">
                            聯合 6 大品牌贊助，將您的形象融入奢華紅毯場景。
                        </p>

                        <Input
                            label="禮服款式 STYLE"
                            placeholder="例如: 黑色晚禮服, 燕尾服..."
                            value={rcDressStyle}
                            onChange={(e: any) => setRcDressStyle(e.target.value)}
                        />

                        <div className="mt-10 pt-4 border-t border-gold/20">
                            <Button
                                onClick={handleRcSubmit}
                                disabled={rcProcessingState === ProcessingState.SEARCHING_LOGO || rcProcessingState === ProcessingState.GENERATING}
                                variant="primary"
                            >
                                {rcProcessingState === ProcessingState.IDLE ? "生成巨星影像" : (rcProcessingState === ProcessingState.COMPLETE || rcProcessingState === ProcessingState.ERROR ? "再次生成" : "AI 運算中...")}
                            </Button>
                        </div>

                        {rcErrorMsg && (
                            <div className="mt-6 bg-red-50 text-crimson text-sm p-4 border border-crimson/20 rounded-lg">
                                {rcErrorMsg}
                            </div>
                        )}
                    </div>
                </div>

                {/* Preview Panel */}
                <div className="lg:col-span-7 flex flex-col gap-6">
                    <div 
                        onClick={triggerRcFileUpload}
                        className={`h-full min-h-[600px] bg-crimson-dark shadow-paper-3 relative flex items-center justify-center overflow-hidden p-4 rounded-3xl border border-gold/30 transition-all duration-300 ${rcProcessingState === ProcessingState.IDLE || rcProcessingState === ProcessingState.COMPLETE ? "cursor-pointer hover:border-gold hover:shadow-gold-glow" : ""}`}
                    >
                         {/* Hidden File Input */}
                        <input 
                            type="file" 
                            ref={rcFileInputRef}
                            accept="image/*"
                            onChange={handleRcFileChange}
                            className="hidden"
                        />

                        {/* Gold Frame Border */}
                        <div className="absolute inset-4 border border-gold/40 pointer-events-none rounded-2xl"></div>
                        <div className="absolute inset-5 border border-gold/20 pointer-events-none rounded-xl"></div>
                        
                        {/* Corner Decors */}
                        <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-gold"></div>
                        <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-gold"></div>
                        <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-gold"></div>
                        <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-gold"></div>

                        {rcProcessingState === ProcessingState.SEARCHING_LOGO && (
                            <div className="text-center z-10 flex flex-col items-center justify-center">
                                <Spinner />
                                <p className="mt-8 font-serif text-gold text-xl tracking-widest animate-pulse">搜尋 LOGO 中...</p>
                            </div>
                        )}
                        {rcProcessingState === ProcessingState.GENERATING && (
                            <div className="text-center z-10 flex flex-col items-center justify-center">
                                <Spinner />
                                <p className="mt-8 font-serif text-gold text-xl tracking-widest animate-pulse">正在構圖...</p>
                            </div>
                        )}
                        {rcProcessingState === ProcessingState.COMPLETE && rcResult ? (
                            <div className="w-full h-full relative group p-2 cursor-default" onClick={(e) => e.stopPropagation()}>
                                <img src={rcResult} alt="Result" className="w-full h-full object-contain drop-shadow-2xl rounded-xl" />
                                <a
                                    href={rcResult}
                                    download="luxe_result.png"
                                    className="absolute bottom-8 right-8 bg-gold-gradient text-crimson-dark font-bold px-6 py-3 shadow-lg hover:-translate-y-1 transition-all rounded-xl z-20"
                                >
                                    下載影像 ↓
                                </a>
                                <button 
                                    onClick={(e) => { e.preventDefault(); triggerRcFileUpload(); }}
                                    className="absolute bottom-8 left-8 bg-black/50 hover:bg-black/80 text-white px-4 py-2 rounded-lg backdrop-blur-sm text-sm border border-white/20 z-20"
                                >
                                    ↻ 重新上傳
                                </button>
                            </div>
                        ) : (
                            rcProcessingState === ProcessingState.IDLE && (
                                rcImageBase64 ? (
                                    <div className="w-full h-full relative group">
                                        <img 
                                            src={`data:image/jpeg;base64,${rcImageBase64}`} 
                                            alt="Preview" 
                                            className="w-full h-full object-contain opacity-80 group-hover:opacity-60 transition-opacity" 
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="bg-black/60 backdrop-blur-sm px-6 py-4 rounded-xl border border-gold/50 text-gold font-serif tracking-widest group-hover:scale-110 transition-transform">
                                                點擊更換圖片
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center opacity-60 hover:opacity-100 transition-opacity">
                                        <div className="w-24 h-24 border-2 border-dashed border-gold rounded-full flex items-center justify-center mx-auto mb-6 bg-crimson-light/30">
                                            <span className="text-4xl text-gold font-light">+</span>
                                        </div>
                                        <p className="text-gold font-serif text-xl uppercase tracking-[0.3em] mb-2">點擊上傳圖檔</p>
                                        <p className="text-cream/50 text-sm font-sans">支援 JPG, PNG 格式</p>
                                    </div>
                                )
                            )
                        )}
                    </div>

                    {/* History Gallery - Moved BELOW the main image */}
                    {rcHistory.length > 0 && (
                        <div className="flex justify-center gap-4 w-full">
                            {rcHistory.map((img, idx) => (
                                <div 
                                    key={idx} 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setRcResult(img);
                                        setRcProcessingState(ProcessingState.COMPLETE);
                                    }}
                                    className={`
                                        w-20 h-24 rounded-lg overflow-hidden cursor-pointer border-2 transition-all duration-300 hover:scale-105 shadow-lg
                                        ${rcResult === img && rcProcessingState === ProcessingState.COMPLETE 
                                            ? 'border-gold ring-2 ring-gold/50 shadow-gold-glow scale-105' 
                                            : 'border-gold/30 opacity-70 hover:opacity-100 hover:border-gold'
                                        }
                                    `}
                                >
                                    <img src={img} alt={`History ${idx}`} className="w-full h-full object-cover" />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    const renderBrandInteraction = () => (
        <div className="max-w-7xl mx-auto px-4 py-12 relative z-10">
            <button onClick={() => switchMode(AppMode.LANDING)} className="mb-8 font-serif text-cream hover:text-gold flex items-center gap-2 text-lg transition-colors">
                <span>←</span> 返回主選單
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                <div className="lg:col-span-5 space-y-8">
                    <div className="bg-paper p-6 md:p-10 shadow-paper-3 relative rounded-3xl">
                        <SectionTitle>品牌賀卡</SectionTitle>
                        <p className="font-sans text-ink/70 mb-8 border-l-2 border-crimson pl-4">
                            結合AI品牌識別，生成高質感商業賀卡。
                        </p>

                        <div className="mb-8">
                            <label className="block text-crimson-dark font-serif font-bold text-sm mb-4 tracking-widest">品牌名稱 BRAND NAME</label>
                            
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {BRAND_PRESETS_UI.map((brand: any) => (
                                    <button
                                        key={brand.id}
                                        onClick={() => setBrandName(brand.name)}
                                        className={`
                                            h-24 rounded-xl border-2 transition-all duration-300 flex items-center justify-center p-2 relative overflow-hidden group
                                            ${brandName === brand.name
                                                ? 'bg-gold-gradient border-gold text-crimson-dark shadow-gold-glow scale-105 z-10'
                                                : 'bg-cream/10 border-gold/30 text-gold hover:border-gold hover:bg-gold/10'
                                            }
                                        `}
                                    >
                                        {brand.logo ? (
                                            <img 
                                                src={brand.logo} 
                                                alt={brand.name} 
                                                className="w-full h-full object-contain p-2 z-10 filter drop-shadow-sm" 
                                            />
                                        ) : (
                                            <span className="font-serif font-bold text-lg tracking-wide z-10">{brand.name}</span>
                                        )}
                                        
                                        {brandName === brand.name && <div className="absolute inset-0 bg-white/20 animate-shimmer"></div>}
                                    </button>
                                ))}

                                <div className={`
                                    h-24 rounded-xl border-2 transition-all duration-300 relative bg-cream/10 flex flex-col justify-center px-4
                                    ${!BRAND_PRESETS_UI.some(b => b.name === brandName) && brandName
                                        ? 'border-gold shadow-gold-glow bg-white/5'
                                        : 'border-gold/30 hover:border-gold'
                                    }
                                `}>
                                     <label className="text-[10px] uppercase text-gold/70 tracking-wider mb-1 font-serif">Custom Brand</label>
                                     <input
                                        type="text"
                                        placeholder="自訂名稱..."
                                        value={BRAND_PRESETS_UI.some(b => b.name === brandName) ? '' : brandName}
                                        onChange={(e) => setBrandName(e.target.value)}
                                        className="bg-transparent text-gold font-bold text-lg w-full focus:outline-none placeholder-gold/30"
                                     />
                                </div>
                            </div>
                        </div>

                        <div className="mt-10 pt-4 border-t border-gold/20">
                            <Button
                                onClick={handleBrandSubmit}
                                disabled={brandProcessingState === ProcessingState.GENERATING}
                                variant="primary"
                            >
                                {brandProcessingState === ProcessingState.GENERATING ? "生成中..." : "✨ 生成商業賀卡"}
                            </Button>
                        </div>

                        {brandErrorMsg && (
                            <div className="mt-6 bg-red-50 text-crimson text-sm p-4 border border-crimson/20 rounded-lg">
                                {brandErrorMsg}
                            </div>
                        )}
                    </div>
                </div>

                <div className="lg:col-span-7 flex flex-col gap-6">
                    <div 
                        onClick={triggerBrandFileUpload}
                        className={`h-full min-h-[600px] bg-crimson-dark shadow-paper-3 relative flex items-center justify-center overflow-hidden p-4 rounded-3xl border border-gold/30 transition-all duration-300 ${brandProcessingState === ProcessingState.IDLE ? "cursor-pointer hover:border-gold hover:shadow-gold-glow" : ""}`}
                    >
                        <input 
                            type="file" 
                            ref={brandFileInputRef}
                            accept="image/*"
                            onChange={handleBrandFileChange}
                            className="hidden"
                        />

                        <div className="absolute inset-4 border border-gold/40 pointer-events-none rounded-2xl"></div>
                        <div className="absolute inset-5 border border-gold/20 pointer-events-none rounded-xl"></div>

                        <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-gold"></div>
                        <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-gold"></div>
                        <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-gold"></div>
                        <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-gold"></div>

                        {brandProcessingState === ProcessingState.GENERATING && (
                            <div className="text-center z-10 flex flex-col items-center justify-center">
                                <Spinner />
                                <p className="mt-8 font-serif text-gold text-xl tracking-widest animate-pulse">AI 識別與構圖中...</p>
                            </div>
                        )}
                        
                        {brandProcessingState === ProcessingState.COMPLETE && brandResult ? (
                            <div className="w-full h-full relative group p-2 cursor-default" onClick={(e) => e.stopPropagation()}>
                                <img src={brandResult} alt="Result" className="w-full h-full object-contain drop-shadow-2xl rounded-xl" />
                                <a
                                    href={brandResult}
                                    download="luxe_brand_result.png"
                                    className="absolute bottom-8 right-8 bg-gold-gradient text-crimson-dark font-bold px-6 py-3 shadow-lg hover:-translate-y-1 transition-all rounded-xl z-20"
                                >
                                    下載影像 ↓
                                </a>
                                <button 
                                    onClick={(e) => { e.preventDefault(); triggerBrandFileUpload(); }}
                                    className="absolute bottom-8 left-8 bg-black/50 hover:bg-black/80 text-white px-4 py-2 rounded-lg backdrop-blur-sm text-sm border border-white/20 z-20"
                                >
                                    ↻ 重新上傳
                                </button>
                            </div>
                        ) : (
                            brandProcessingState === ProcessingState.IDLE && (
                                brandImageBase64 ? (
                                    <div className="w-full h-full relative group">
                                        <img 
                                            src={`data:image/jpeg;base64,${brandImageBase64}`} 
                                            alt="Preview" 
                                            className="w-full h-full object-contain opacity-80 group-hover:opacity-60 transition-opacity" 
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="bg-black/60 backdrop-blur-sm px-6 py-4 rounded-xl border border-gold/50 text-gold font-serif tracking-widest group-hover:scale-110 transition-transform">
                                                點擊更換圖片
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center opacity-60 hover:opacity-100 transition-opacity">
                                        <div className="w-24 h-24 border-2 border-dashed border-gold rounded-full flex items-center justify-center mx-auto mb-6 bg-crimson-light/30">
                                            <span className="text-4xl text-gold font-light">+</span>
                                        </div>
                                        <p className="text-gold font-serif text-xl uppercase tracking-[0.3em] mb-2">點擊上傳圖檔</p>
                                        <p className="text-cream/50 text-sm font-sans">支援 JPG, PNG 格式</p>
                                    </div>
                                )
                            )
                        )}
                    </div>
                    
                    {/* History Gallery - Moved BELOW the main image */}
                    {brandHistory.length > 0 && (
                        <div className="flex justify-center gap-4 w-full">
                            {brandHistory.map((img, idx) => (
                                <div 
                                    key={idx} 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setBrandResult(img);
                                        setBrandProcessingState(ProcessingState.COMPLETE);
                                    }}
                                    className={`
                                        w-20 h-24 rounded-lg overflow-hidden cursor-pointer border-2 transition-all duration-300 hover:scale-105 shadow-lg
                                        ${brandResult === img && brandProcessingState === ProcessingState.COMPLETE 
                                            ? 'border-gold ring-2 ring-gold/50 shadow-gold-glow scale-105' 
                                            : 'border-gold/30 opacity-70 hover:opacity-100 hover:border-gold'
                                        }
                                    `}
                                >
                                    <img src={img} alt={`History ${idx}`} className="w-full h-full object-cover" />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <ApiKeyGuard>
            <div className="min-h-screen font-sans selection:bg-gold selection:text-crimson">
                <header className="fixed top-0 w-full z-40 bg-crimson-dark/90 backdrop-blur border-b border-gold/30 h-20 flex items-center shadow-lg">
                    <div className="max-w-7xl mx-auto px-6 w-full flex items-center justify-between">
                        <span
                            className="font-serif font-black text-3xl tracking-tight text-cream cursor-pointer flex items-center gap-1 hover:text-gold transition-colors"
                            onClick={() => switchMode(AppMode.LANDING)}
                        >
                            春樹夥伴<span className="text-gold">新年賀卡</span>
                        </span>
                    </div>
                </header>

                <main className="pt-24 pb-12 relative overflow-x-hidden min-h-screen bg-crimson-texture">
                    {mode === AppMode.LANDING && renderLanding()}
                    {mode === AppMode.RED_CARPET && renderRedCarpet()}
                    {mode === AppMode.BRAND_INTERACTION && renderBrandInteraction()}
                </main>
            </div>
        </ApiKeyGuard>
    );
};

export default App;
import { GoogleGenAI } from "@google/genai";
import { LogoSearchResult } from "../types";

// Helper to convert File/Blob to Base64
const fileToBase64 = (file: File | Blob): Promise<string> => {
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

// Initialize Gemini Client
const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found. Please select a key.");
  }
  return new GoogleGenAI({ apiKey });
};

// --- Brand Presets (Slogans) ---
const BRAND_PRESETS: Record<string, string> = {
  "卡迪那": "拜年就用卡迪那 一年好運不喊卡",
  "ScoopAway": "貓砂用紫包 包你大紅又大紫",
  "可果美": "吃紅沾好運 可喜可賀可果美",
  "Horoyoi": "喝了有億 暴富一整年"
};

// --- Logo Presets (URLs) ---
const LOGO_PRESETS: Record<string, string> = {
  "可果美": "https://raw.githubusercontent.com/david1117/ChineseNewYear_n_RedCarpet/be621e5924378f1c14dc94aab9e891f48e0efa55/Images/Kagome_Taiwan.png",
  "Kagome": "https://raw.githubusercontent.com/david1117/ChineseNewYear_n_RedCarpet/be621e5924378f1c14dc94aab9e891f48e0efa55/Images/Kagome_Taiwan.png",
  "Horoyoi": "https://raw.githubusercontent.com/david1117/ChineseNewYear_n_RedCarpet/025773a1c09cbe623d6d8da89390b4f1558ffd54/Images/Horoyoi.webp",
  "EverClean": "https://raw.githubusercontent.com/david1117/ChineseNewYear_n_RedCarpet/abe509b990b079a2b9b02cecd76035bd84ad03a9/Images/everclean.png",
  "卡迪那": "https://raw.githubusercontent.com/david1117/ChineseNewYear_n_RedCarpet/abe509b990b079a2b9b02cecd76035bd84ad03a9/Images/Cadina.png",
  "ScoopAway": "https://raw.githubusercontent.com/david1117/ChineseNewYear_n_RedCarpet/3f63eb43b844530adc6f1f0ed49563e821154499/Images/ScoopAway.png",
  "VISA": "https://raw.githubusercontent.com/david1117/ChineseNewYear_n_RedCarpet/813d160aff54feb754af1032c625e369ee890e61/Images/Visa_Logo.png",
  "NETFLIX": "https://raw.githubusercontent.com/david1117/ChineseNewYear_n_RedCarpet/813d160aff54feb754af1032c625e369ee890e61/Images/Netflix.jpg",
  "全家": "https://raw.githubusercontent.com/david1117/ChineseNewYear_n_RedCarpet/813d160aff54feb754af1032c625e369ee890e61/Images/Family_Mart.png",
  "家樂福": "https://raw.githubusercontent.com/david1117/ChineseNewYear_n_RedCarpet/813d160aff54feb754af1032c625e369ee890e61/Images/Crrefour.png",
  "特力屋": "https://raw.githubusercontent.com/david1117/ChineseNewYear_n_RedCarpet/42b7dab92b8881313a42fbcd031b40ac64d59f7a/Images/B%26Q.png",
  "國泰產險": "https://raw.githubusercontent.com/david1117/ChineseNewYear_n_RedCarpet/813d160aff54feb754af1032c625e369ee890e61/Images/cathay.png",
  "春樹科技": "https://raw.githubusercontent.com/david1117/ChineseNewYear_n_RedCarpet/c2d8e8057ceb4cc6d51cc09ed666bf2e70742ef7/Images/Spring_Trees.png",
  "發票怪獸": "https://raw.githubusercontent.com/david1117/ChineseNewYear_n_RedCarpet/025773a1c09cbe623d6d8da89390b4f1558ffd54/Images/Q_Monster.png"
};

// Helper to find preset slogan with relaxed matching
const findPresetSlogan = (brandName: string): string | null => {
  const normalizedInput = brandName.trim().toLowerCase().replace(/\s+/g, '');

  // Direct check or partial check against known keys
  for (const [key, value] of Object.entries(BRAND_PRESETS)) {
    const normalizedKey = key.toLowerCase().replace(/\s+/g, '');
    if (normalizedInput.includes(normalizedKey)) {
      return value;
    }
  }
  return null;
};

// Helper to find preset Logo URL
const findPresetLogo = (brandName: string): string | null => {
  const normalizedInput = brandName.trim().toLowerCase();

  // Check strict or case-insensitive match against LOGO_PRESETS keys
  for (const [key, url] of Object.entries(LOGO_PRESETS)) {
    if (key.toLowerCase() === normalizedInput || normalizedInput.includes(key.toLowerCase())) {
      return url;
    }
  }
  return null;
};

/**
 * Helper to fetch a URL and convert to Base64
 * Handles both local paths and external URLs
 */
const urlToBase64 = async (url: string): Promise<string> => {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Image not found: ${url}`);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        } else {
          reject(new Error("Failed to convert blob to base64"));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.warn(`Could not load image at ${url}`, e);
    return "";
  }
};

/**
 * Workflow 1: Red Carpet Logic Layer
 * Uses Gemini 3 Flash to find a logo for the company.
 */
export const searchCompanyLogo = async (companyName: string): Promise<LogoSearchResult | null> => {
  // 1. Check Presets First
  const presetUrl = findPresetLogo(companyName);
  if (presetUrl) {
    console.log(`[Logo Preset Match] Using preset for ${companyName}`);
    return {
      uri: presetUrl,
      title: companyName
    };
  }

  // 2. If no preset, use Gemini Flash to search
  const ai = getClient();
  const modelId = 'gemini-3-flash-preview';
  const prompt = `Find the official logo for the company "${companyName}". Return the URL.`;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;

    if (chunks && chunks.length > 0) {
      const webChunk = chunks.find((c: any) => c.web);
      if (webChunk && webChunk.web) {
        const foundUrl = webChunk.web.uri;

        return {
          uri: foundUrl,
          title: webChunk.web.title
        };
      }
    }
    return null;

  } catch (error) {
    console.error("Error searching for logo:", error);
    throw error;
  }
};

/**
 * Workflow 2: Brand Interaction (Commercial Card)
 * Uses Gemini 3 Pro Image to generate a high-end commercial card.
 */
export const generateBrandInteraction = async (
  userPoseBase64: string,
  brandName: string,
  customHeaderText: string
): Promise<string> => {
  const ai = getClient();
  const modelId = 'gemini-3-pro-image-preview';

  const presetSlogan = findPresetSlogan(brandName);

  // LOGIC START: Check for Preset Logo
  const presetLogoUrl = findPresetLogo(brandName);
  let logoBase64: string | null = null;
  if (presetLogoUrl) {
    try {
      logoBase64 = await urlToBase64(presetLogoUrl);
    } catch (e) {
      console.warn("Failed to load preset logo", e);
    }
  }
  // LOGIC END

  // Define Precise Parameters for Text Instructions
  let headerInstruction = "";
  if (presetSlogan) {
    headerInstruction = `Use EXACTLY this text provided for the Header (Slogan): "${presetSlogan}"`;
  } else if (customHeaderText && customHeaderText.length > 0) {
    headerInstruction = `Use EXACTLY this text provided for the Header (Slogan): "${customHeaderText}"`;
  } else {
    headerInstruction = `ACTION REQUIRED: Use Google Search to find the brand's official slogan. If not found, create a catchy, rhyming CNY marketing slogan appropriate for this brand.`;
  }

  const footerInstruction = `ACTION REQUIRED: Generate a creative, auspicious 4-8 character Chinese New Year greeting specifically for the **Year of the Horse (馬年吉祥話)**. (e.g., 馬到成功, 龍馬精神, etc. but make it creative).`;

  // INSTRUCTION FOR LOGO - STRENGTHENED FOR FIDELITY
  const logoInstruction = logoBase64
    ? `- **BRAND LOGO (CRITICAL)**: Input Image [1] provided is the OFFICIAL LOGO.
       - **MANDATORY**: Render Input Image [1] **EXACTLY AS IS** (Pixel-Perfect) at the top center.
       - **TECHNIQUE**: Apply it as a **Flat Overlay** or **Watermark**.
       - **RESTRICTION**: Do NOT redesign, stylisticize, 3D-render, or alter the colors of the logo. It must be identical to the source.
       - The Logo must be **Self-Illuminated** (unaffected by scene lighting/shadows) to ensure brand visibility.`
    : `- 請務必使用 Google Search 檢索 "${brandName}" 的官方 Logo 與視覺識別系統VI (Logo, Color Palette, Main Products)。`;

  const prompt = `
    Role: 你是一位資深的商業攝影師與平面設計師，專精於亞洲市場的「春節行銷（Lunar New Year Marketing）」。

    Task:
    根據使用者提供的視覺素材（人物）半身 與品牌名稱 ("${brandName}")，生成一張 3D 渲染風格的高級農曆新年賀卡。

    Inputs:
    - Brand Name: "${brandName}"
    - Input Image [0]: User Image (人物).
    ${logoBase64 ? '- Input Image [1]: **OFFICIAL LOGO SOURCE** (Use for texture mapping).' : ''}
    
    TEXT GENERATION INSTRUCTIONS:
    1. Header Text (Slogan):
       - ${headerInstruction}
    
    2. Footer Text (Greeting):
       - ${footerInstruction}

    Design Principles:
    1. 品牌一致性 (Brand Consistency):
       ${logoInstruction}
       - 根據品牌名稱自動判斷主要真實量販產品類型（例如：Horoyoi -> 雞尾酒/罐裝酒, ScoopAway -> 貓砂, 可果美 -> 番茄醬, 卡迪那 -> 零食/薯條）。
    
    2. 人物造型與服裝策略 (Clothing & Styling):
       - 請分析 user_image 中人物的性別：
       - **若為男性 (Male)**：
         - 人物構圖：半身構圖。
         - 服裝：請將服裝更換為「修身西裝 (Suit)」或「質感襯衫 (Crisp Shirt)」。
         - 氛圍：強調清爽、專業、值得信賴的商務形象 (Professional, Clean, Fresh)。
         - 表情：需處理為生動、自信且喜慶。
       - **若為女性 (Female)**：
         - 人物構圖：半身構圖。
         - 服裝：請將服裝更換為「優雅禮服 (Evening Gown)」或「時尚洋裝 (Dress)」。
         - 風格：可參考 user_image 原本的服裝剪裁進行變化，但必須提升至商業廣告的高級質感。
         - 表情：需處理為生動、自信且喜慶。

    3. 視覺層次佈局 (Visual Hierarchy)
       - 頂部區域 (Brand Identity & Greeting):
         * **品牌核心 (LOGO)**: **Insert Input Image [1]** here.
           - Rule: **100% Fidelity**. The logo must look identical to the provided image file.
           - Style: Keep the logo's original flat graphic style. Do **NOT** blend it into the lighting of the environment.
       - 副標題 (Footer Text / Greeting):    
         * 創意祝禱: 將 **Footer Text (馬年吉祥話)** 置於 Logo 正下方，採用「異質化藝術字」，將馬的靈動線條自然融入筆劃結構，兼具品牌辨識度與設計感。
         * 藝術風格: 創意異質化字體 (Creative Typography)。
         * 設計細節: 巧妙提取馬年意象的幾何特徵，將其轉化為文字筆劃的一部分（如橫、撇、捺），使字體本身具備生肖意象與視覺趣味性。

       - 中景區域 (Interaction Zone):
         * 核心動態: 置入上傳之人物半身角色，並與產品或品牌 IP 進行深度互動（如握持、倚靠）。
         * 氛圍渲染: 角色表情應飽滿喜慶，透過環境光遮蔽 (AO) 技術，使角色自然融入場景整體的紅金光影中。

       - 前景區域 (Product Showcase):
         * 精品陳列: 將產品整齊排列於畫面下 1/3 處，呈現高端型錄質感。
         * 材質表現: 產品展現細膩的核心陰影 (Core Shadow)，營造奢華立體感。

       - 底部區域 (Epic Slogan):
         * 視覺錨點: 最下方中心以 **${headerInstruction}** 收尾。字體採氣勢磅礴的 3D 金箔筆刷感書法體，配合細微的擴散光暈 (Glow Effect) 增加重量感。字體筆劃帶有「金色漸層」與「水墨暈染」效果。
         * 視覺特效: 賦予 3D 立體浮雕質感，表面需具備「生金箔」的筆刷紋理。
         * 筆觸細節: **${headerInstruction}**字體筆觸強勁有力，線條流動奔放，充滿速度感與藝術生命力。

       - 背景氛圍 (Atmosphere):
         * 品牌底蘊: 以品牌標準色為基調，虛實結合地融入產品 Logo、Slogan 及馬年意象元素，營造和諧且具層次感的節慶背景。

       - 產品規範與數量:
         * 真實性: 僅使用該品牌於量販通路之真實產品（如包裝零食、瓶裝飲料、罐裝醬料），嚴禁虛假不實商品。
         * 數量控制: 畫面產品總量 **不得超過四樣 (Max 4 items)**，以「精品專櫃」式排列，確保畫面聚焦不雜亂。

    Constraints:
    - 嚴禁出現文字拼寫錯誤（Typo）。
    - 避免過度擁擠，保持高端商務感的留白（Negative Space）。
    - 比例嚴格遵守 3:4。
  `;

  // Construct Parts
  const parts: any[] = [
    { text: prompt },
    {
      inlineData: {
        mimeType: 'image/jpeg',
        data: userPoseBase64
      }
    }
  ];

  if (logoBase64) {
    parts.push({
      inlineData: {
        mimeType: 'image/png',
        data: logoBase64
      }
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: parts
      },
      config: {
        imageConfig: {
          aspectRatio: "3:4", // Standard card ratio
          imageSize: "2K"
        },
        tools: [{ googleSearch: {} }] // Enable search for product inference even if logo is provided
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }

    throw new Error("No image generated.");

  } catch (error) {
    console.error("Error generating brand interaction:", error);
    throw error;
  }
};

/**
 * Workflow 3: Red Carpet Template Swap
 * Automatically uses a red carpet template (if available) or generates a full scene.
 * Replaces a character and inserts a FIXED set of 6 brands by passing specific image data to the model.
 */
export const generateRedCarpetTemplateSwap = async (
  userImageBase64: string,
  options: {
    gender: 'male' | 'female' | 'original',
    bodyType: 'slim' | 'average' | 'athletic' | 'original',
    dressStyle: string
  }
): Promise<string> => {
  const ai = getClient();
  const modelId = 'gemini-3-pro-image-preview';

  // 1. Load Template ONLY. No Logos needed.
  const templateBase64 = await urlToBase64('https://raw.githubusercontent.com/david1117/ChineseNewYear_n_RedCarpet/11987c9adc15f5fcbd7f025ec0f5d0ca9787f7bd/Images/RedCarpet.png');
  const hasTemplate = !!templateBase64 && templateBase64.length > 100;

  const prompt = hasTemplate ? `
    任務: 紅毯角色精準替換 (Precise Red Carpet Character Swap).
    
    提供的圖片 (Images Provided):
    - Input Image [0]: Prompt (此文字)
    - Input Image [1]: user_face_image (用於替換的人臉)
    - Input Image [2]: template_image (紅毯模板)

    template_image 描述 (從左到右):
    - 左 1: 一位穿著金色質感西裝的光頭男士。
    - 左 2: 一位穿著黑色西裝,黑色長領帶的男士。
    - 右 2: 一位留著長棕髮、穿著黑色削肩晚禮服的女士。
    - 右 1: 一位穿著黑色西裝並打著黑色領結的男士。
    - 背景: 黑色牆面。

    核心目標 (CORE OBJECTIVE):
    - 目標對象 (TARGET): 僅針對 "左 2" (一位穿著黑色西裝,黑色長領帶的男士)。
    - 動作 (ACTION): 將 "左 2" 的頭部與身體特徵替換為 user_face_image [1] 中的人物。
    - 替換細節 (Replacement Details):
      - 融合 (Blending): 確保頭部與頸部連接自然，無違和感。
      - 光影 (Lighting): 必須模仿現場的「直射閃光燈 (Direct Flash)」效果，與其他角色一致。
      - 膚色 (Skin Tone): 調整膚色以匹配場景光線。
    - 身高調整: 若為女性，調整至與右2相同高度；若為男性，比左1高半個頭。
    - 性別: ${options.gender === 'original' ? '與 user_face_image 相同' : (options.gender === 'male' ? '男性' : '女性')}.
    - 服裝: ${options.dressStyle || '高端奢華紅毯時尚 (燕尾服/晚禮服)'}.
    - 表情: 生動微笑、自信且喜慶。
    
    保留指令 (PRESERVATION INSTRUCTIONS):
    - 嚴格鎖定 (STRICT LOCK): "左 1", "右 2", "右 1" 以及 "背景 (Background)"。
    - 不要改變其他角色的臉孔、衣服或姿勢。
    - 不要改變背景牆面。
    - 不要生成文字或 Logo。

    技術要求:
    - 輸出為 4K 高解析度、照片般逼真 (Photorealistic)。
    - 保持原圖的構圖與氛圍。
  ` : `
    任務: 進階紅毯生成 (Advanced_Red_Carpet_Generation).
    
    動作: 生成一張逼真的好萊塢紅毯照片，主角為輸入圖片中的人物 (Input Image 1)。
    背景: 黑色牆面。
    風格: 4K, 閃光燈攝影, 紅毯活動燈光.
  `;

  // 2. Construct Parts Array
  const parts: any[] = [
    { text: prompt },
    {
      inlineData: {
        mimeType: 'image/jpeg',
        data: userImageBase64
      }
    }
  ];

  if (hasTemplate) {
    parts.push({
      inlineData: {
        mimeType: 'image/png',
        data: templateBase64
      }
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: { parts },
      config: {
        imageConfig: {
          aspectRatio: "3:4",
          imageSize: "2K"
        },
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }

    throw new Error("No image generated.");

  } catch (error) {
    console.error("Error in template swap:", error);
    throw error;
  }
};
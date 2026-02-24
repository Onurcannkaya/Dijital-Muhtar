import { useState, useEffect } from "react";
import { Sparkles, RefreshCw, AlertTriangle, BookOpen, Copy, CheckCheck, FileEdit } from "lucide-react";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const getGeminiUrl = (model) => `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

const SYSTEM_PROMPT = `Sen bir 'Dijital Muhtar' asistanısın. Görevin, sana gönderilen resmi belge fotoğrafını inceleyip analiz etmektir.
Yanıtını iki bölüm halinde ver:

BÖLÜM 1 (METİNSEL ANALİZ):
Belgedeki hukuki dili vatandaşın anlayacağı sadeliğe indir. Kesinlikle şu 5 başlığı kullan:
1. Özet
2. Önemli Tarihler
3. Adım Adım Eylem Planı
4. Yasal Hakların
5. Kritik Uyarılar

BÖLÜM 2 (YAPILANDIRILMIŞ VERİ):
Dilekçe formlarını otomatik doldurmak için belgeden çıkardığın verileri tam olarak aşağıdaki JSON formatında, \`\`\`json ve \`\`\` etiketleri arasına yaz. Bulamadığın alanları boş bırak:
\`\`\`json
{
  "tutar": "",
  "kurum_adi": "",
  "belge_tarihi": "",
  "dosya_no": "",
  "itiraz_mercii": "",
  "ihlal_maddesi": ""
}
\`\`\`
`;

function parseAIResponse(text) {
  // 1) Extract JSON if present
  let extractedJson = null;
  const jsonRegex = /```json\s*(\{[\s\S]*?\})\s*```/;
  const jsonMatch = text.match(jsonRegex);
  if (jsonMatch && jsonMatch[1]) {
    try {
      extractedJson = JSON.parse(jsonMatch[1]);
    } catch (e) {
      console.warn("JSON parse error:", e);
    }
    text = text.replace(jsonRegex, ""); // remove JSON block from text
  }

  // 2) Parse Text Sections
  const sections = [
    { key: "ozet", prefix: "1. Özet", icon: "📋", title: "Özet" },
    { key: "tarihler", prefix: "2. Önemli Tarihler", icon: "⏰", title: "Önemli Tarihler" },
    { key: "eylem", prefix: "3. Adım Adım Eylem Planı", icon: "✅", title: "Adım Adım Eylem Planı" },
    { key: "haklar", prefix: "4. Yasal Hakların", icon: "⚖️", title: "Yasal Hakların" },
    { key: "uyarilar", prefix: "5. Kritik Uyarılar", icon: "🚨", title: "Kritik Uyarılar" },
  ];

  const parsedSections = [];
  for (let i = 0; i < sections.length; i++) {
    const s = sections[i];
    const startIdx = text.indexOf(s.prefix);
    if (startIdx === -1) continue;
    const contentStart = text.indexOf("\n", startIdx) + 1;
    const nextSection = i + 1 < sections.length ? text.indexOf(sections[i + 1].prefix) : -1;
    const content = (nextSection === -1 ? text.slice(contentStart) : text.slice(contentStart, nextSection)).trim();
    if (content) parsedSections.push({ ...s, content });
  }

  if (parsedSections.length === 0) {
    parsedSections.push({ key: "raw", icon: "📄", title: "AI Analizi", content: text.trim() });
  }

  return { sections: parsedSections, extractedData: extractedJson };
}

export default function AIAssistant({ imageDataUrl, onReset, onDataExtracted }) {
  const [status, setStatus] = useState("idle"); // idle | loading | done | error | no-key
  const [sections, setSections] = useState([]);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!GEMINI_API_KEY) {
      setStatus("no-key");
      return;
    }
    if (imageDataUrl) {
      analyzeDocument(imageDataUrl);
    }
  }, [imageDataUrl]);

  const analyzeDocument = async (b64Image) => {
    setStatus("loading");
    setError("");
    try {
      // Split "data:image/jpeg;base64,..." into mime Type and base64 string
      const [header, base64] = b64Image.split(",");
      const mimeType = header.match(/:(.*?);/)[1];

      const requestBody = JSON.stringify({
        contents: [
          {
            parts: [
              { text: SYSTEM_PROMPT },
              {
                inlineData: {
                  mimeType: mimeType,
                  data: base64,
                },
              },
            ],
          },
        ],
        generationConfig: { temperature: 0.1, maxOutputTokens: 2000 },
      });

      const modelsToTry = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.5-flash", "gemini-3.0-flash"]; // Gemini-3 vs henüz yoksa 1.5'ten başla
      let response = null;

      for (const modelName of modelsToTry) {
        try {
          const res = await fetch(getGeminiUrl(modelName), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: requestBody,
          });

          if (res.ok) {
            response = res;
            break;
          }

          // Eğer model bulunamadıysa (404), yetki yoksa (403), kota dolduysa (429) veya servis yoksa (503) diğerine geç
          if (res.status === 404 || res.status === 403 || res.status === 400 || res.status === 429 || res.status === 503) {
            console.warn(`[${modelName}] Hata aldı (${res.status}). Sıradaki modele geçiliyor...`);
            continue;
          } else {
            const errData = await res.json().catch(() => null);
            throw new Error(errData?.error?.message || `API hatası (${res.status})`);
          }
        } catch (e) {
          if (modelName === modelsToTry[modelsToTry.length - 1]) throw e;
          console.warn(`[${modelName}] İsteği başarısız:`, e);
        }
      }

      if (!response || !response.ok) {
        throw new Error("Tüm modeller denendi ancak başarılı olunamadı, limitleriniz dolmuş olabilir.");
      }

      const data = await response.json();
      const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!raw) throw new Error("Geçersiz API yanıtı");

      const { sections: parsedSecs, extractedData } = parseAIResponse(raw);
      setSections(parsedSecs);
      setStatus("done");

      if (extractedData && Object.values(extractedData).some(v => v)) {
        if (onDataExtracted) onDataExtracted(extractedData);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Bilinmeyen hata");
      setStatus("error");
    }
  };

  const copyAll = () => {
    const fullText = sections.map((s) => `${s.icon} ${s.title}\n${s.content}`).join("\n\n");
    navigator.clipboard.writeText(fullText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
        <h1 className="page-title">AI Analizi</h1>
        <button className="btn btn-secondary btn-sm" style={{ width: "auto", padding: "8px 14px" }} onClick={onReset}>
          <RefreshCw size={15} /> Yeni Belge
        </button>
      </div>
      <p className="page-desc">Belgeniz Gemini AI tarafından analiz edildi.</p>

      {/* Image Preview */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-title" style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: 8 }}>
          <BookOpen size={14} /> İncelenen Belge
        </div>
        <div style={{ textAlign: "center" }}>
          <img
            src={imageDataUrl}
            alt="İncelenen Belge"
            style={{ maxWidth: "100%", maxHeight: 120, objectFit: "contain", borderRadius: 8, border: "1px solid var(--border)" }}
          />
        </div>
      </div>

      {/* NO KEY */}
      {status === "no-key" && (
        <div className="card" style={{ borderColor: "var(--tc-gold)", background: "#fff8e1" }}>
          <div className="card-title" style={{ color: "#9e6000" }}>🔑 API Anahtarı Gerekli</div>
          <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", marginBottom: 12, lineHeight: 1.6 }}>
            AI analizini kullanmak için <code>.env</code> dosyasına Gemini API anahtarınızı ekleyin:
          </p>
          <div style={{ background: "#0d1b2e", color: "#c8a951", borderRadius: 8, padding: "12px 14px", fontFamily: "monospace", fontSize: "0.82rem", marginBottom: 16 }}>
            VITE_GEMINI_API_KEY=your_key_here
          </div>
          <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="btn btn-primary btn-sm" style={{ textDecoration: "none", display: "inline-flex" }}>
            <Sparkles size={15} /> Ücretsiz API Anahtarı Al
          </a>
        </div>
      )}

      {/* LOADING */}
      {status === "loading" && (
        <div className="card loading-center">
          <div style={{ position: "relative" }}>
            <div className="spinner" />
            <Sparkles size={16} style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", color: "var(--tc-blue)" }} />
          </div>
          <span style={{ fontWeight: 600 }}>Yapay Zeka İnceliyor...</span>
          <span style={{ fontSize: "0.8rem", textAlign: "center" }}>Gemini Vision belgenizdeki verileri çıkarıyor ve analiz ediyor.</span>
        </div>
      )}

      {/* ERROR */}
      {status === "error" && (
        <div className="card" style={{ borderColor: "var(--tc-red)", borderWidth: 2 }}>
          <div className="card-title" style={{ color: "var(--tc-red)" }}>
            <AlertTriangle size={18} /> Analiz Başarısız
          </div>
          <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", marginBottom: 16 }}>{error}</p>
          <button className="btn btn-primary" onClick={() => analyzeDocument(imageDataUrl)}>
            <RefreshCw size={16} /> Tekrar Dene
          </button>
        </div>
      )}

      {/* DONE */}
      {status === "done" && (
        <div>
          {/* Action to proceed to PetitionBuilder */}
          <div style={{ marginBottom: 16 }}>
            <button
              className="btn btn-primary"
              style={{ width: "100%", padding: "14px", fontSize: "0.95rem", background: "linear-gradient(135deg, var(--tc-blue), #1e293b)", border: "none" }}
              onClick={() => onDataExtracted && onDataExtracted({ _nav: "petition" })}
            >
              <FileEdit size={18} style={{ marginRight: 8 }} /> Veriler dilekçeye aktarıldı, hazırlamak için tıklayın
            </button>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
            <button className="btn btn-secondary btn-sm" style={{ width: "auto", padding: "8px 14px" }} onClick={copyAll}>
              {copied ? <><CheckCheck size={15} /> Kopyalandı</> : <><Copy size={15} /> Tümünü Kopyala</>}
            </button>
          </div>

          {sections.map((section) => (
            <div key={section.key} className="card" style={{ marginBottom: 12 }}>
              <div className="ai-section-title">
                <span>{section.icon}</span> {section.title}
              </div>
              <div className="ai-section-body" style={{ whiteSpace: "pre-line" }}>
                {section.content}
              </div>
            </div>
          ))}

          <div className="card" style={{ background: "var(--tc-blue-light)", border: "1.5px solid rgba(26,79,160,0.2)", marginTop: 4 }}>
            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
              ⚠️ Bu analiz bilgilendirme amaçlıdır. Hukuki karar için bir avukata veya ilgili kuruma başvurunuz. Dijital Muhtar yalnızca rehberlik sağlar.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

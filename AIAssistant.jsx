import { useState, useEffect } from "react";
import { Sparkles, RefreshCw, AlertTriangle, Clock, BookOpen, ListChecks, Copy, CheckCheck } from "lucide-react";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;

const SYSTEM_PROMPT = `Sen bir 'Dijital Muhtar' asistanısın. Görevin, sana gönderilen resmi belgelerdeki hukuki ve bürokratik dili, ilkokul düzeyindeki bir vatandaşın anlayabileceği sadeliğe indirmektir. Yanıtlarını her zaman tam olarak şu 5 başlığı kullanarak ver:
1. Özet
2. Önemli Tarihler
3. Adım Adım Eylem Planı
4. Yasal Hakların
5. Kritik Uyarılar

Kesinlikle avukat edasıyla değil, yardımcı bir komşu edasıyla konuş.`;

function parseAIResponse(text) {
  const sections = [
    { key: "ozet", prefix: "1. Özet", icon: "📋", title: "Özet" },
    { key: "tarihler", prefix: "2. Önemli Tarihler", icon: "⏰", title: "Önemli Tarihler" },
    { key: "eylem", prefix: "3. Adım Adım Eylem Planı", icon: "✅", title: "Adım Adım Eylem Planı" },
    { key: "haklar", prefix: "4. Yasal Hakların", icon: "⚖️", title: "Yasal Hakların" },
    { key: "uyarilar", prefix: "5. Kritik Uyarılar", icon: "🚨", title: "Kritik Uyarılar" },
  ];

  const result = [];
  for (let i = 0; i < sections.length; i++) {
    const s = sections[i];
    const startIdx = text.indexOf(s.prefix);
    if (startIdx === -1) continue;
    const contentStart = text.indexOf("\n", startIdx) + 1;
    const nextSection = i + 1 < sections.length ? text.indexOf(sections[i + 1].prefix) : -1;
    const content = (nextSection === -1 ? text.slice(contentStart) : text.slice(contentStart, nextSection)).trim();
    if (content) result.push({ ...s, content });
  }

  if (result.length === 0) {
    return [{ key: "raw", icon: "📄", title: "AI Analizi", content: text }];
  }
  return result;
}

export default function AIAssistant({ ocrText, onReset }) {
  const [status, setStatus] = useState("idle"); // idle | loading | done | error | no-key
  const [sections, setSections] = useState([]);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!GEMINI_API_KEY) {
      setStatus("no-key");
      return;
    }
    if (ocrText) {
      analyzeDocument(ocrText);
    }
  }, [ocrText]);

  const analyzeDocument = async (text) => {
    setStatus("loading");
    setError("");
    try {
      const response = await fetch(GEMINI_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: SYSTEM_PROMPT },
                { text: `\n\n---BELGE METNİ---\n${text}` },
              ],
            },
          ],
          generationConfig: { temperature: 0.3, maxOutputTokens: 1500 },
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData?.error?.message || "API hatası");
      }

      const data = await response.json();
      const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!raw) throw new Error("Geçersiz API yanıtı");
      setSections(parseAIResponse(raw));
      setStatus("done");
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

      {/* OCR Preview */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-title" style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: 8 }}>
          <BookOpen size={14} /> Okunan Metin (Önizleme)
        </div>
        <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", maxHeight: 80, overflow: "hidden", position: "relative" }}>
          {ocrText?.substring(0, 200)}{ocrText?.length > 200 && "..."}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 24, background: "linear-gradient(transparent, white)" }} />
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
          <span style={{ fontWeight: 600 }}>Belge analiz ediliyor...</span>
          <span style={{ fontSize: "0.8rem", textAlign: "center" }}>Gemini AI belgenizi okuyup yorumluyor. Bu 5-15 saniye sürebilir.</span>
        </div>
      )}

      {/* ERROR */}
      {status === "error" && (
        <div className="card" style={{ borderColor: "var(--tc-red)", borderWidth: 2 }}>
          <div className="card-title" style={{ color: "var(--tc-red)" }}>
            <AlertTriangle size={18} /> Analiz Başarısız
          </div>
          <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", marginBottom: 16 }}>{error}</p>
          <button className="btn btn-primary" onClick={() => analyzeDocument(ocrText)}>
            <RefreshCw size={16} /> Tekrar Dene
          </button>
        </div>
      )}

      {/* DONE */}
      {status === "done" && (
        <div>
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

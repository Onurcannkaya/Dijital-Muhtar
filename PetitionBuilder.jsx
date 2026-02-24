import { useState, useEffect } from "react";
import { ScrollText, Download, Eye, ChevronDown, ChevronUp } from "lucide-react";
import { jsPDF } from "jspdf";

const TEMPLATES = [
  {
    id: "trafik-itiraz",
    label: "Trafik Cezası İtirazı",
    icon: "🚗",
    fields: ["ad_soyad", "tc_kimlik", "adres", "ceza_no", "ceza_tarihi", "plaka", "itiraz_gerekce"],
    body: (f) => `Sayın İlgili Makam,

${f.ceza_tarihi || "..."} tarihinde ${f.plaka || "..."} plakalı araç sahibi olarak ${f.ceza_no || "..."} sayılı trafik cezasına muhatap olduğumu bildirmek isterim.

Söz konusu cezaya aşağıda belirtilen nedenlerle itiraz etmek zorundayım:

${f.itiraz_gerekce || "..."}

Bu nedenle, ${f.ceza_no || "..."} sayılı trafik cezasının iptalini saygıyla talep ederim.

Gereğini bilgilerinize arz ederim.`,
    konu: "Trafik Para Cezasına İtiraz",
    muhatap: "İdare Mahkemesi / Trafik Tescil ve Denetleme Büro Amirliğine",
  },
  {
    id: "bilgi-edinme",
    label: "Bilgi Edinme Talebi",
    icon: "📄",
    fields: ["ad_soyad", "tc_kimlik", "adres", "kurum_adi", "talep_konusu"],
    body: (f) => `Sayın Yetkili,

4982 sayılı Bilgi Edinme Hakkı Kanunu kapsamında, ${f.talep_konusu || "..."} konusunda bilgi ve/veya belge edinme talebinde bulunmaktayım.

Kanunun öngördüğü 15 iş günü içinde tarafıma gerekli bilgi ve belgelerin iletilmesini saygıyla talep ederim.`,
    konu: "Bilgi Edinme Talebi",
    muhatap: (f) => `${f.kurum_adi || "İlgili Kurum"} Müdürlüğüne`,
  },
  {
    id: "ikayet",
    label: "Şikâyet Dilekçesi",
    icon: "⚠️",
    fields: ["ad_soyad", "tc_kimlik", "adres", "sikayet_konusu", "sikayet_tarihi", "sikayet_aciklama"],
    body: (f) => `Sayın İlgili Makam,

${f.sikayet_tarihi || "..."} tarihinde ${f.sikayet_konusu || "..."} konusunda mağduriyete uğradığımı bildirmek isterim.

OLAY AÇIKLAMASI:
${f.sikayet_aciklama || "..."}

Yaşanan mağduriyetimin giderilmesi ve gerekli işlemlerin yapılması için tarafınıza başvurmaktayım. Konu hakkında tarafıma bilgi verilmesini saygıyla talep ederim.`,
    konu: "Şikâyet ve Şikâyet Bildirimi",
    muhatap: "İlgili Kamu Kurumu Müdürlüğüne",
  },
  {
    id: "kira",
    label: "Kira Tespiti Talebi",
    icon: "🏠",
    fields: ["ad_soyad", "tc_kimlik", "adres", "mal_sahibi", "kira_adresi", "mevcut_kira", "talep_nedeni"],
    body: (f) => `Sayın İlgili Makam,

${f.kira_adresi || "..."} adresinde ${f.mal_sahibi || "..."} adlı kişiye ait taşınmazda kiracı sıfatıyla ikamet etmekteyim. Mevcut kira bedeli aylık ${f.mevcut_kira || "..."} TL olup;

${f.talep_nedeni || "..."}

Bu nedenlerle taşınmazın güncel piyasa rayicine uygun kira bedelinin tespitini saygıyla talep ederim.`,
    konu: "Kira Bedeli Tespiti Talebi",
    muhatap: "Sulh Hukuk Mahkemesine",
  },
];

const FIELD_LABELS = {
  ad_soyad: "Ad Soyad",
  tc_kimlik: "T.C. Kimlik No",
  adres: "Adres",
  ceza_no: "Ceza Tutanak No",
  ceza_tarihi: "Ceza Tarihi",
  plaka: "Araç Plakası",
  itiraz_gerekce: "İtiraz Gerekçesi",
  kurum_adi: "Kurum Adı",
  talep_konusu: "Talep Konusu",
  sikayet_konusu: "Şikâyet Konusu",
  sikayet_tarihi: "Şikâyet Tarihi",
  sikayet_aciklama: "Olay Açıklaması",
  mal_sahibi: "Mal Sahibi Adı",
  kira_adresi: "Kira Adresi",
  mevcut_kira: "Mevcut Kira Bedeli (TL)",
  talep_nedeni: "Talep Nedeni",
};

const MULTILINE = ["itiraz_gerekce", "sikayet_aciklama", "talep_nedeni", "talep_konusu", "adres"];

export default function PetitionBuilder({ initialData }) {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [formData, setFormData] = useState({});
  const [preview, setPreview] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [success, setSuccess] = useState(false);

  // Auto-fill form from Gemini JSON if present
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      const autoFill = {};

      // Auto-select template if AI categorized it
      if (initialData.dilekce_turu) {
        const foundTpl = TEMPLATES.find((t) => t.id === initialData.dilekce_turu);
        if (foundTpl) {
          setSelectedTemplate(foundTpl);
        }
      }

      // Try to intelligently match detected fields to template fields
      if (initialData.dosya_no) autoFill.ceza_no = initialData.dosya_no;
      if (initialData.belge_tarihi) {
        autoFill.ceza_tarihi = initialData.belge_tarihi;
        autoFill.sikayet_tarihi = initialData.belge_tarihi;
      }
      if (initialData.kurum_adi) autoFill.kurum_adi = initialData.kurum_adi;
      if (initialData.tutar) autoFill.mevcut_kira = initialData.tutar;
      // Eğer itiraz_gerekce alanı yoksa oluştur
      if (initialData.ihlal_maddesi) {
        autoFill.itiraz_gerekce = `Hakkımda uygulanan ${initialData.ihlal_maddesi} numaralı madde ihlali asılsızdır. Durumun yeniden değerlendirilerek cezanın iptalini talep ediyorum.`;
      }

      // Diğer kısımlar
      if (initialData.plaka) autoFill.plaka = initialData.plaka;
      if (initialData.konu) autoFill.talep_konusu = initialData.konu;
      if (initialData.konu) autoFill.sikayet_konusu = initialData.konu;

      setFormData((prev) => ({ ...prev, ...autoFill }));
    }
  }, [initialData]);

  const selectTemplate = (tpl) => {
    setSelectedTemplate(tpl);
    // Keep auto-filled data when switching templates, only reset invalid ones
    setPreview("");
    setShowPreview(false);
    setSuccess(false);
  };

  const handleChange = (field, value) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
  };

  const buildPreviewText = () => {
    if (!selectedTemplate) return "";
    const today = new Date().toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" });
    const muhatap = typeof selectedTemplate.muhatap === "function" ? selectedTemplate.muhatap(formData) : selectedTemplate.muhatap;
    const body = selectedTemplate.body(formData);
    return `${muhatap}

KONU: ${selectedTemplate.konu}

${body}

Saygılarımla,

Ad Soyad: ${formData.ad_soyad || "_____"}
T.C. Kimlik No: ${formData.tc_kimlik || "_____"}
Adres: ${formData.adres || "_____"}
Tarih: ${today}
İmza: ___________`;
  };

  const handlePreview = () => {
    const text = buildPreviewText();
    setPreview(text);
    setShowPreview(true);
  };

  const handleDownload = () => {
    setGenerating(true);
    try {
      // Create PDF. Depending on bundler, jsPDF might be default or named export.
      // If we imported { jsPDF }, we use it. If there's an issue we fall back.
      const DocClass = jsPDF ? jsPDF : window.jspdf.jsPDF;
      const doc = new DocClass({ orientation: "portrait", unit: "mm", format: "a4" });

      // Setup Turkish-friendly encoding via font, but jsPDF uses standard Latin by default
      // We'll replace unsupported characters just in case it crashes, though jsPDF standard helvetica usually drops them silently.
      const replaceTR = (text) => {
        if (!text) return "";
        return text
          .replace(/ğ/g, "g").replace(/Ğ/g, "G")
          .replace(/ş/g, "s").replace(/Ş/g, "S")
          .replace(/ı/g, "i").replace(/İ/g, "I")
          .replace(/ö/g, "o").replace(/Ö/g, "O")
          .replace(/ç/g, "c").replace(/Ç/g, "C")
          .replace(/ü/g, "u").replace(/Ü/g, "U");
      };

      const today = new Date().toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" });

      // Header
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("T.C.", 105, 20, { align: "center" });
      doc.setFontSize(12);
      doc.text(replaceTR(selectedTemplate.konu.toUpperCase()), 105, 28, { align: "center" });
      doc.setLineWidth(0.5);
      doc.line(20, 32, 190, 32);

      const rawMuhatap = typeof selectedTemplate.muhatap === "function" ? selectedTemplate.muhatap(formData) : selectedTemplate.muhatap;
      const body = selectedTemplate.body(formData);

      const fullText = replaceTR(`${rawMuhatap}\n\n${body}\n\n---\nAd Soyad: ${formData.ad_soyad || ""}\nT.C. Kimlik No: ${formData.tc_kimlik || ""}\nAdres: ${formData.adres || ""}\nTarih: ${today}\nİmza:`);

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");

      const lines = doc.splitTextToSize(fullText, 165);
      let y = 42;
      lines.forEach((line) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        doc.text(line, 22, y);
        y += 6;
      });

      const filename = `dilekce_${selectedTemplate.id}_${Date.now()}.pdf`;
      doc.save(filename);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      alert("PDF oluşturulurken hata oluştu: " + err.message);
    } finally {
      setGenerating(false);
    }
  };

  const isFormValid = () => {
    if (!selectedTemplate) return false;
    // Just a loose validation instead of strict, to let users preview partial forms
    return selectedTemplate.fields.some((f) => formData[f]?.trim());
  };

  return (
    <div>
      <h1 className="page-title">Dilekçe Oluşturucu</h1>
      <p className="page-desc">Hazır şablonlardan dilekçenizi oluşturun ve PDF olarak indirin. Verileriniz yalnızca cihazınızda işlenir.</p>

      {/* Auto-fill notification */}
      {initialData && Object.keys(initialData).length > 0 && !selectedTemplate && (
        <div className="card" style={{ background: "#e0f2fe", borderColor: "#bde0fe" }}>
          <p style={{ fontSize: "0.85rem", color: "#0284c7", fontWeight: 600, margin: 0 }}>
            ✨ AI tarafından analiz edilen verileriniz hazır. Bir şablon seçtiğinizde ilgili alanlar otomatik doldurulacaktır.
          </p>
        </div>
      )}

      {/* Template Selection */}
      <div className="card">
        <div className="card-title">
          <ScrollText size={16} /> Şablon Seçin
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {TEMPLATES.map((tpl) => (
            <button
              key={tpl.id}
              onClick={() => selectTemplate(tpl)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "14px",
                border: `1.5px solid ${selectedTemplate?.id === tpl.id ? "var(--tc-blue)" : "var(--border)"}`,
                borderRadius: "var(--radius)",
                background: selectedTemplate?.id === tpl.id ? "var(--tc-blue-light)" : "white",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.15s",
              }}
            >
              <span style={{ fontSize: "1.6rem" }}>{tpl.icon}</span>
              <span style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "0.92rem" }}>{tpl.label}</span>
              {selectedTemplate?.id === tpl.id && <span className="status-badge status-info" style={{ marginLeft: "auto" }}>Seçili</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Form */}
      {selectedTemplate && (
        <div className="card">
          <div className="card-title">📝 Bilgilerinizi Girin</div>
          {selectedTemplate.fields.map((field) => (
            <div key={field} className="form-group">
              <label className="form-label">{FIELD_LABELS[field] || field}</label>
              {MULTILINE.includes(field) ? (
                <textarea
                  className="form-textarea"
                  value={formData[field] || ""}
                  onChange={(e) => handleChange(field, e.target.value)}
                  placeholder={`${FIELD_LABELS[field] || field} girin...`}
                  rows={4}
                />
              ) : (
                <input
                  type={field === "tc_kimlik" ? "number" : "text"}
                  className="form-input"
                  value={formData[field] || ""}
                  onChange={(e) => handleChange(field, e.target.value)}
                  placeholder={`${FIELD_LABELS[field] || field} girin...`}
                  maxLength={field === "tc_kimlik" ? 11 : undefined}
                />
              )}
            </div>
          ))}

          {/* Preview toggle */}
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button
              className="btn btn-secondary btn-sm"
              style={{ flex: 1 }}
              onClick={handlePreview}
              disabled={!isFormValid()}
            >
              <Eye size={16} /> Önizle
            </button>
            <button
              className="btn btn-success btn-sm"
              style={{ flex: 1 }}
              onClick={handleDownload}
              disabled={!isFormValid() || generating}
            >
              {generating ? (
                <><div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> Oluşturuluyor...</>
              ) : success ? (
                <>✅ PDF İndirildi!</>
              ) : (
                <><Download size={16} /> PDF İndir</>
              )}
            </button>
          </div>

          {!isFormValid() && (
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 10, textAlign: "center" }}>
              En az bir alanı doldurunuz
            </p>
          )}
        </div>
      )}

      {/* Preview */}
      {showPreview && preview && (
        <div className="card">
          <button
            onClick={() => setShowPreview(!showPreview)}
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", marginBottom: 14 }}
          >
            <span className="card-title" style={{ margin: 0 }}>
              <Eye size={16} /> Dilekçe Önizlemesi
            </span>
            {showPreview ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
          <div style={{
            background: "white",
            border: "1px solid var(--border)",
            borderRadius: 8,
            padding: "20px",
            fontFamily: "Georgia, serif",
            fontSize: "0.82rem",
            lineHeight: 1.8,
            color: "#000",
            whiteSpace: "pre-wrap",
          }}>
            {preview}
          </div>
        </div>
      )}

      {!selectedTemplate && (
        <div className="card" style={{ background: "var(--tc-blue-light)", border: "1.5px solid rgba(26,79,160,0.2)", textAlign: "center" }}>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
            🔒 Tüm veriler yalnızca cihazınızda işlenir ve internet üzerinden gönderilmez. PDF dosyası cihazınıza kaydedilir.
          </p>
        </div>
      )}
    </div>
  );
}

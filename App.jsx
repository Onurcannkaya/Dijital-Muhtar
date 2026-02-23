import { useState } from "react";
import { FileText, Map, ScrollText, Home, ScanLine, ChevronRight, Shield, Bell, User } from "lucide-react";
import OCRScanner from "./OCRScanner";
import AIAssistant from "./AIAssistant";
import MapComponent from "./MapComponent";
import PetitionBuilder from "./PetitionBuilder";
import AboutPage from "./AboutPage";
import "./App.css";

const TABS = [
  { id: "home", label: "Ana Sayfa", icon: Home },
  { id: "scanner", label: "Belge Tara", icon: ScanLine },
  { id: "map", label: "Harita", icon: Map },
  { id: "petition", label: "Dilekçe", icon: ScrollText },
  { id: "about", label: "Hakkında", icon: User },
];

const QUICK_ACTIONS = [
  { id: "scanner", label: "Belge Analiz Et", desc: "Ceza, tebligat veya dilekçeyi tara", icon: ScanLine, color: "#1a4fa0" },
  { id: "map", label: "Yakın Hizmetler", desc: "Eczane, toplanma alanı, yardım", icon: Map, color: "#006633" },
  { id: "petition", label: "Dilekçe Oluştur", desc: "Hazır şablonlardan PDF üret", icon: ScrollText, color: "#8B0000" },
];

export default function App() {
  const [activeTab, setActiveTab] = useState("home");
  const [ocrResult, setOcrResult] = useState(null); // Now stores base64 image data url
  const [extractedData, setExtractedData] = useState(null); // Stores JSON sent from Gemini
  const [notification] = useState("Yeni güncelleme: İtiraz dilekçe şablonu eklendi.");

  const handleScanComplete = (dataUrl) => {
    setOcrResult(dataUrl);
    setActiveTab("scanner");
  };

  const handleDataExtracted = (data) => {
    if (data._nav === "petition") {
      setActiveTab("petition");
    } else {
      // Store the structured JSON in app state so PetitionBuilder can use it
      setExtractedData(data);
    }
  };

  return (
    <div className="app-shell">
      {/* Header */}
      <header className="app-header">
        <div className="header-inner">
          <div className="header-brand">
            <div className="header-emblem">
              <Shield size={20} />
            </div>
            <div>
              <span className="header-title">Dijital Muhtar</span>
              <span className="header-subtitle">Vatandaş Hak Asistanı</span>
            </div>
          </div>
          <button className="notif-btn" aria-label="Bildirimler">
            <Bell size={20} />
            <span className="notif-dot" />
          </button>
        </div>
        {notification && (
          <div className="notification-bar">
            <span>📢 {notification}</span>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="app-main">
        {activeTab === "home" && (
          <div className="home-view">
            <div className="home-hero">
              <div className="hero-badge">TC Cumhurbaşkanlığı Dijital Dönüşüm</div>
              <h1 className="hero-title">Haklarınız, <span className="hero-accent">Yanınızda</span></h1>
              <p className="hero-desc">
                Resmi belgelerinizi yapay zeka ile analiz edin, en yakın hizmet noktalarını bulun, dilekçelerinizi hazırlayın.
              </p>
            </div>

            <div className="quick-actions">
              <h2 className="section-title">Hızlı İşlemler</h2>
              <div className="action-cards">
                {QUICK_ACTIONS.map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.id}
                      className="action-card"
                      onClick={() => setActiveTab(action.id)}
                      style={{ "--card-accent": action.color }}
                    >
                      <div className="action-icon-wrap">
                        <Icon size={28} />
                      </div>
                      <div className="action-text">
                        <span className="action-label">{action.label}</span>
                        <span className="action-desc">{action.desc}</span>
                      </div>
                      <ChevronRight size={18} className="action-arrow" />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="info-section">
              <h2 className="section-title">Bilgi & Rehber</h2>
              <div className="info-cards">
                <div className="info-card">
                  <div className="info-icon">⚖️</div>
                  <div>
                    <div className="info-title">İtiraz Süreleri</div>
                    <div className="info-body">Trafik cezaları için 15 gün, idari para cezaları için 30 gün.</div>
                  </div>
                </div>
                <div className="info-card">
                  <div className="info-icon">📋</div>
                  <div>
                    <div className="info-title">Dilekçe Hakkı</div>
                    <div className="info-body">Her vatandaş resmi kurumlara yazılı başvuru hakkına sahiptir.</div>
                  </div>
                </div>
                <div className="info-card">
                  <div className="info-icon">🔒</div>
                  <div>
                    <div className="info-title">Gizlilik</div>
                    <div className="info-body">Belgeleriniz yalnızca cihazınızda işlenir. Sunucuya gönderilmez.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "scanner" && (
          <div className="tab-view">
            {!ocrResult ? (
              <OCRScanner onScanComplete={handleScanComplete} />
            ) : (
              <AIAssistant
                imageDataUrl={ocrResult}
                onReset={() => { setOcrResult(null); setExtractedData(null); }}
                onDataExtracted={handleDataExtracted}
              />
            )}
          </div>
        )}

        {activeTab === "map" && (
          <div className="tab-view">
            <MapComponent />
          </div>
        )}

        {activeTab === "petition" && (
          <div className="tab-view">
            <PetitionBuilder initialData={extractedData} />
          </div>
        )}

        {activeTab === "about" && (
          <div className="tab-view">
            <AboutPage />
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              className={`nav-item ${isActive ? "nav-item--active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
              aria-label={tab.label}
            >
              <Icon size={22} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

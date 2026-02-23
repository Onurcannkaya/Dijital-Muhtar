import { useState, useRef, useCallback } from "react";
import { Camera, Upload, X, CheckCircle, ScanLine, RefreshCw, ZoomIn } from "lucide-react";

export default function OCRScanner({ onScanComplete }) {
  const [mode, setMode] = useState("idle"); // idle | camera | captured | error
  const [imageDataUrl, setImageDataUrl] = useState(null);
  const [error, setError] = useState("");

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const streamRef = useRef(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = async () => {
    setError("");
    setMode("camera");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      setError("Kamera erişimi reddedildi. Lütfen tarayıcı izinlerini kontrol edin.");
      setMode("idle");
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    setImageDataUrl(dataUrl);
    stopCamera();
    setMode("captured");
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      setImageDataUrl(dataUrl);
      setMode("captured");
    };
    reader.readAsDataURL(file);
  };

  const reset = () => {
    stopCamera();
    setMode("idle");
    setImageDataUrl(null);
    setError("");
  };

  return (
    <div>
      <h1 className="page-title">Belge Tarayıcı</h1>
      <p className="page-desc">
        Resmi belgenizi kamera ile çekin veya galeriden yükleyin. Yapay zeka ile anında analiz edilecek.
      </p>

      {/* IDLE */}
      {mode === "idle" && (
        <div>
          <div className="card" style={{ textAlign: "center", padding: "32px 20px" }}>
            <div style={{ width: 72, height: 72, background: "var(--tc-blue-light)", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <ScanLine size={36} color="var(--tc-blue)" />
            </div>
            <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: 24, lineHeight: 1.6 }}>
              Ceza makbuzu, tebligat, mahkeme kararı veya herhangi bir resmi belgeyi tarayın.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <button className="btn btn-primary" onClick={startCamera}>
                <Camera size={20} /> Kamera ile Çek
              </button>
              <button className="btn btn-secondary" onClick={() => fileInputRef.current?.click()}>
                <Upload size={20} /> Galeriden Yükle
              </button>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileUpload} />
          </div>

          <div className="card" style={{ background: "var(--tc-blue-light)", border: "1.5px solid rgba(26,79,160,0.2)" }}>
            <div className="card-title" style={{ fontSize: "0.85rem", marginBottom: 8 }}>
              💡 En iyi sonuç için
            </div>
            <ul style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.8, paddingLeft: 16 }}>
              <li>İyi aydınlatılmış bir ortamda çekin</li>
              <li>Belge düz ve titreşimsiz olsun</li>
              <li>Tüm metin alanları kadraj içinde olsun</li>
            </ul>
          </div>
        </div>
      )}

      {/* CAMERA */}
      {mode === "camera" && (
        <div>
          <div className="scan-area" style={{ marginBottom: 16 }}>
            <video ref={videoRef} className="scan-preview" playsInline muted />
            <div className="scan-overlay">
              <div className="scan-guide">
                <div className="scan-line" />
              </div>
              <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.75rem", background: "rgba(0,0,0,0.5)", padding: "4px 12px", borderRadius: 100 }}>
                Belgeyi çerçeve içine alın
              </span>
            </div>
          </div>
          <canvas ref={canvasRef} style={{ display: "none" }} />
          <div style={{ display: "flex", gap: 12 }}>
            <button className="btn btn-danger btn-sm" style={{ flex: "0 0 auto", width: "auto", padding: "12px 20px" }} onClick={reset}>
              <X size={18} />
            </button>
            <button className="btn btn-primary" onClick={capturePhoto}>
              <Camera size={20} /> Fotoğraf Çek
            </button>
          </div>
        </div>
      )}

      {/* CAPTURED */}
      {mode === "captured" && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, color: "var(--tc-green)", fontWeight: 700 }}>
            <CheckCircle size={22} />
            <span>Fotoğraf hazır!</span>
          </div>
          {imageDataUrl && (
            <img src={imageDataUrl} alt="Taranan belge" style={{ width: "100%", borderRadius: "var(--radius)", marginBottom: 14, border: "1.5px solid var(--border)", maxHeight: 300, objectFit: "contain", background: "#f8f9fa" }} />
          )}

          <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
            <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={reset}>
              <RefreshCw size={16} /> Yeniden Çek
            </button>
            <button className="btn btn-primary btn-sm" style={{ flex: 2 }} onClick={() => onScanComplete(imageDataUrl)}>
              ✨ Yapay Zeka ile İncele
            </button>
          </div>
        </div>
      )}

      {/* ERROR */}
      {mode === "error" && (
        <div>
          <div className="card" style={{ borderColor: "var(--tc-red)", borderWidth: 2 }}>
            <div className="card-title" style={{ color: "var(--tc-red)" }}>⚠️ Hata Oluştu</div>
            <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: 16 }}>{error}</p>
            <button className="btn btn-primary" onClick={reset}>
              <RefreshCw size={16} /> Tekrar Dene
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

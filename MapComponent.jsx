import { useState, useEffect, useRef } from "react";
import { MapPin, Loader, RefreshCw, Pill, Users, Heart } from "lucide-react";

const CATEGORY_CONFIG = {
  pharmacy: {
    label: "Nöbetçi Eczane",
    icon: "💊",
    color: "#006633",
    query: "pharmacy",
    lucide: Pill,
  },
  assembly: {
    label: "Toplanma Alanı",
    icon: "🏃",
    color: "#1a4fa0",
    query: "assembly point emergency",
    lucide: Users,
  },
  social: {
    label: "Sosyal Yardım",
    icon: "❤️",
    color: "#8B0000",
    query: "social services community center",
    lucide: Heart,
  },
};

// Haversine distance in km
function calcDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function MapComponent() {
  const [status, setStatus] = useState("idle"); // idle | locating | loading | done | error
  const [userPos, setUserPos] = useState(null);
  const [activeCategory, setActiveCategory] = useState("pharmacy");
  const [places, setPlaces] = useState([]);
  const [error, setError] = useState("");
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapRef = useRef(null);
  const leafletMapRef = useRef(null);
  const markersRef = useRef([]);

  // Load Leaflet CSS & JS dynamically
  useEffect(() => {
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => setMapLoaded(true);
    if (!window.L) {
      document.head.appendChild(script);
    } else {
      setMapLoaded(true);
    }
  }, []);

  const initMap = (lat, lng) => {
    if (!mapRef.current || !window.L) return;
    if (leafletMapRef.current) {
      leafletMapRef.current.remove();
    }
    const map = window.L.map(mapRef.current).setView([lat, lng], 14);
    window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    // User marker
    const userIcon = window.L.divIcon({
      html: `<div style="width:16px;height:16px;background:#E30A17;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
      className: "",
    });
    window.L.marker([lat, lng], { icon: userIcon }).addTo(map).bindPopup("<b>Konumunuz</b>").openPopup();
    leafletMapRef.current = map;
  };

  const fetchPlaces = async (lat, lng, category) => {
    setStatus("loading");
    setPlaces([]);
    try {
      const config = CATEGORY_CONFIG[category];
      const radius = 3000;
      const url = `https://overpass-api.de/api/interpreter?data=[out:json][timeout:15];(node["amenity"="${config.query.split(" ")[0]}"](around:${radius},${lat},${lng});way["amenity"="${config.query.split(" ")[0]}"](around:${radius},${lat},${lng}););out center;`;

      const response = await fetch(url);
      const data = await response.json();

      const results = (data.elements || [])
        .map((el) => {
          const elLat = el.lat || el.center?.lat;
          const elLng = el.lon || el.center?.lon;
          if (!elLat || !elLng) return null;
          return {
            id: el.id,
            name: el.tags?.name || `${config.label} (İsimsiz)`,
            lat: elLat,
            lng: elLng,
            distance: calcDistance(lat, lng, elLat, elLng),
            address: [el.tags?.["addr:street"], el.tags?.["addr:housenumber"]].filter(Boolean).join(" ") || "Adres bilgisi yok",
            phone: el.tags?.phone || el.tags?.["contact:phone"] || null,
          };
        })
        .filter(Boolean)
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 10);

      // Clear old markers
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      // Add new markers
      if (leafletMapRef.current) {
        results.forEach((place) => {
          const placeIcon = window.L.divIcon({
            html: `<div style="background:${config.color};color:white;padding:4px 8px;border-radius:6px;font-size:11px;font-weight:bold;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.2)">${config.icon} ${place.name.substring(0, 20)}</div>`,
            className: "",
            iconAnchor: [0, 0],
          });
          const marker = window.L.marker([place.lat, place.lng], { icon: placeIcon })
            .addTo(leafletMapRef.current)
            .bindPopup(`<b>${place.name}</b><br>${place.address}${place.phone ? `<br>📞 ${place.phone}` : ""}<br>📍 ${(place.distance * 1000).toFixed(0)} m`);
          markersRef.current.push(marker);
        });

        if (results.length > 0) {
          leafletMapRef.current.fitBounds(
            [
              [lat, lng],
              ...results.slice(0, 5).map((p) => [p.lat, p.lng]),
            ],
            { padding: [30, 30] }
          );
        }
      }

      setPlaces(results);
      setStatus("done");
    } catch (err) {
      console.error(err);
      setError("Harita verisi yüklenemedi. İnternet bağlantınızı kontrol edin.");
      setStatus("error");
    }
  };

  const locate = () => {
    setStatus("locating");
    setError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setUserPos({ lat, lng });
        setTimeout(() => {
          if (mapLoaded) {
            initMap(lat, lng);
            fetchPlaces(lat, lng, activeCategory);
          }
        }, 300);
      },
      (err) => {
        setError("Konum alınamadı. Lütfen tarayıcı konum iznini kontrol edin.");
        setStatus("error");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const switchCategory = (cat) => {
    setActiveCategory(cat);
    if (userPos) fetchPlaces(userPos.lat, userPos.lng, cat);
  };

  return (
    <div>
      <h1 className="page-title">Yakın Hizmetler</h1>
      <p className="page-desc">Konumunuza en yakın eczane, toplanma alanı ve sosyal yardım noktalarını bulun.</p>

      {/* Category Filters */}
      <div className="map-filter-row">
        {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
          <button
            key={key}
            className={`filter-chip ${activeCategory === key ? "filter-chip--active" : ""}`}
            onClick={() => switchCategory(key)}
          >
            <span>{cfg.icon}</span> {cfg.label}
          </button>
        ))}
      </div>

      {/* Map Container */}
      <div ref={mapRef} className="map-container" style={{ background: "#e8eef9", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {status === "idle" && (
          <div style={{ textAlign: "center", padding: 24 }}>
            <MapPin size={48} color="var(--tc-blue)" style={{ marginBottom: 12, opacity: 0.5 }} />
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: 16 }}>Yakın hizmetleri görmek için konumunuzu paylaşın</p>
            <button className="btn btn-primary" style={{ width: "auto", padding: "12px 24px" }} onClick={locate} disabled={!mapLoaded}>
              <MapPin size={18} /> Konumumu Bul
            </button>
          </div>
        )}
        {status === "locating" && (
          <div className="loading-center">
            <div className="spinner" />
            <span>Konum alınıyor...</span>
          </div>
        )}
        {status === "loading" && (
          <div style={{ position: "absolute", top: 10, right: 10, background: "white", borderRadius: 8, padding: "8px 14px", boxShadow: "0 2px 8px rgba(0,0,0,0.15)", display: "flex", alignItems: "center", gap: 8, fontSize: "0.82rem", zIndex: 1000 }}>
            <Loader size={14} style={{ animation: "spin 1s linear infinite" }} /> Yükleniyor...
          </div>
        )}
        {status === "error" && (
          <div style={{ textAlign: "center", padding: 24 }}>
            <p style={{ color: "var(--tc-red)", marginBottom: 16 }}>{error}</p>
            <button className="btn btn-primary" style={{ width: "auto" }} onClick={locate}>
              <RefreshCw size={16} /> Tekrar Dene
            </button>
          </div>
        )}
      </div>

      {/* Places List */}
      {places.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div className="section-title" style={{ padding: 0, marginBottom: 12 }}>
            {CATEGORY_CONFIG[activeCategory].icon} {places.length} Sonuç Bulundu
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {places.map((place, idx) => (
              <div key={place.id} className="card" style={{ padding: "14px 16px", cursor: "pointer" }}
                onClick={() => {
                  leafletMapRef.current?.flyTo([place.lat, place.lng], 17);
                  const marker = markersRef.current[idx];
                  if (marker) marker.openPopup();
                }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, fontSize: "0.92rem", flex: 1, paddingRight: 8 }}>{place.name}</span>
                  <span className="status-badge status-info" style={{ flexShrink: 0 }}>
                    📍 {(place.distance * 1000).toFixed(0)} m
                  </span>
                </div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{place.address}</div>
                {place.phone && <div style={{ fontSize: "0.78rem", color: "var(--tc-blue)", marginTop: 4 }}>📞 {place.phone}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {status === "done" && places.length === 0 && (
        <div className="card" style={{ textAlign: "center", marginTop: 16 }}>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
            Bu kategoride yakın çevrenizde sonuç bulunamadı. Haritayı genişleterek arama yapabilirsiniz.
          </p>
        </div>
      )}
    </div>
  );
}

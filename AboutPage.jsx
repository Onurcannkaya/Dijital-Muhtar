import { Github, Linkedin, Mail, MapPin, Award, BookOpen, Presentation, Calendar } from "lucide-react";

export default function AboutPage() {
    return (
        <div className="about-page">
            <div className="about-header">
                <div className="profile-image-container">
                    {/* We will use a placeholder or image passed by the user */}
                    <img src="/assets/profile.png" alt="Onur Can Kaya" className="profile-image" />
                </div>
                <h1 className="profile-name">Onur Can Kaya</h1>
                <p className="profile-title">Harita Mühendisi & CBS Uzmanı</p>

                <div className="profile-links">
                    <a href="#" className="profile-link"><MapPin size={18} /> Sivas, Türkiye</a>
                    <a href="mailto:contact@example.com" className="profile-link"><Mail size={18} /> İletişim</a>
                </div>
            </div>

            <div className="about-content">
                <div className="about-card">
                    <h2 className="about-card-title">
                        <BookOpen size={20} className="about-card-icon" />
                        Hikayem
                    </h2>
                    <p className="about-text">
                        Kendimi bildim bileli bir organizasyonun ya bir parçası, ya önderi ya da bir kıvılcımı oldum.
                        2014 yılında mahallemizde kurduğumuz Karainci Gençlik ile başlayan gönüllülük yolculuğum,
                        kısa sürede yerelden ulusala yayıldı. Bu süreçte, yaptığımız çalışmaların etkisiyle
                        Diyanet İşleri Başkanlığı gençlik yönergesini yayınlayarak 81 ilde gençlik yapılanmalarına resmi statü kazandırdı.
                    </p>
                </div>

                <div className="about-card">
                    <h2 className="about-card-title">
                        <Award size={20} className="about-card-icon" />
                        Kariyer & Gönüllülük
                    </h2>
                    <ul className="timeline">
                        <li className="timeline-item">
                            <div className="timeline-marker"></div>
                            <div className="timeline-content">
                                <h3 className="timeline-title">Akıllı Şehir Müdürlüğü</h3>
                                <span className="timeline-date">Sivas Belediyesi • Günümüz</span>
                                <p>Harita mühendisliğinde uzmanlaşarak Coğrafi Bilgi Sistemleri (CBS) alanında yüksek lisans yapıyorum. Şehircilik, veri analizi ve dijital dönüşüm konularında projeler geliştiriyorum.</p>
                            </div>
                        </li>
                        <li className="timeline-item">
                            <div className="timeline-marker"></div>
                            <div className="timeline-content">
                                <h3 className="timeline-title">Kültür ve Sosyal İşler Müdürlüğü</h3>
                                <span className="timeline-date">Sivas Belediyesi • 2023</span>
                                <p>Belediye bünyesinde kültürel projelere ve sosyal çalışmalara katkı sundum.</p>
                            </div>
                        </li>
                        <li className="timeline-item">
                            <div className="timeline-marker"></div>
                            <div className="timeline-content">
                                <h3 className="timeline-title">Cumhurbaşkanlığı Düzeyinde Temsiliyet</h3>
                                <span className="timeline-date">Gençlik ve Spor Bakanlığı • 2022</span>
                                <p>Gönüllü lider, kamp lideri ve Sivas Temsilci Genç olarak aktif görevler aldım. Gençliği ulusal düzeyde temsil etme onuruna eriştim.</p>
                            </div>
                        </li>
                    </ul>
                </div>

                <div className="about-card">
                    <h2 className="about-card-title">
                        <Presentation size={20} className="about-card-icon" />
                        Vizyon
                    </h2>
                    <p className="about-text" style={{ fontStyle: "italic", borderLeft: "3px solid var(--tc-blue)", paddingLeft: "15px" }}>
                        "Hâlâ aktif olarak gönüllülük çalışmalarına katkı sunuyor; yerel kalkınma, gençlik politikaları
                        ve teknoloji tabanlı şehir yönetimi alanlarında değer üretmeye devam ediyorum."
                    </p>
                </div>
            </div>
        </div>
    );
}

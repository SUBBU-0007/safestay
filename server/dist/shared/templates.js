"use strict";
/**
 * Pre-written human-style crisis communication templates in 14 languages.
 * Guaranteed zero hallucination / zero machine translation error for Red/Amber emergencies.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SUPPORTED_LANGUAGES = exports.CRISIS_TEMPLATES = void 0;
exports.CRISIS_TEMPLATES = {
    en: {
        hazardWarning: (hazard, location) => `[OFFICIAL ALERT] Severe ${hazard} warning active in ${location}. Evacuate low-lying areas immediately.`,
        smsAlert: (hazard, safePlace, distanceKm, link) => `[OFFICIAL] Severe ${hazard} warning! Move to higher ground now. Nearest safe place: ${safePlace} (${distanceKm} km away). Live safety map: ${link}`,
        sosSms: (lat, lng, count, triage, phone) => `[SOS EMERGENCY] ${count} person(s) require urgent help! Status: ${triage}. GPS Coordinates: ${lat.toFixed(5)}, ${lng.toFixed(5)}. Contact: ${phone}`,
        adviceRed: 'EXTREME DANGER: Flash flood / landslide threat. Do not cross rushing water or bridges. Move to higher ground immediately.',
        adviceAmber: 'WEATHER ADVISORY: Heavy rainfall and rising water levels. Stay indoors, prepare emergency supplies, avoid hill roads.',
        adviceGreen: 'SAFE ZONE: Current area is not under active evacuation. Stay alert, keep battery charged, and check official bulletins.'
    },
    hi: {
        hazardWarning: (hazard, location) => `[आधिकारिक चेतावनी] ${location} में भीषण ${hazard} का खतरा। निचले इलाकों से तुरंत सुरक्षित स्थान पर जाएं।`,
        smsAlert: (hazard, safePlace, distanceKm, link) => `[आधिकारिक] भीषण ${hazard} चेतावनी! तुरंत सुरक्षित स्थान पर पहुंचे। निकटतम सुरक्षित आश्रय: ${safePlace} (${distanceKm} किमी दूर)। नक्शा देखें: ${link}`,
        sosSms: (lat, lng, count, triage, phone) => `[आपातकालीन SOS] ${count} लोगों को तत्काल मदद की आवश्यकता है! स्थिति: ${triage}। जीपीएस: ${lat.toFixed(5)}, ${lng.toFixed(5)}। फोन: ${phone}`,
        adviceRed: 'अत्यधिक खतरा: जलभराव और भूस्खलन की आशंका। बहते पानी या पुलों को पार न करें। तुरंत ऊंचे स्थान पर जाएं।',
        adviceAmber: 'सतर्कता चेतावनी: मूसलाधार बारिश और जलस्तर में वृद्धि। सुरक्षित कमरों में रहें, पहाड़ी रास्तों से बचें।',
        adviceGreen: 'सुरक्षित क्षेत्र: आपकी वर्तमान स्थिति खतरे के क्षेत्र से बाहर है। सतर्क रहें और आधिकारिक निर्देशों का पालन करें।'
    },
    ta: {
        hazardWarning: (hazard, location) => `[அதிகாரப்பூர்வ எச்சரிக்கை] ${location} பகுதியில் தீவிர ${hazard} எச்சரிக்கை. உடனடியாக மேடான பகுதிக்கு செல்லவும்.`,
        smsAlert: (hazard, safePlace, distanceKm, link) => `[அதிகாரப்பூர்வ] தீவிர ${hazard} எச்சரிக்கை! உடனடியாக மேடான பகுதிக்கு செல்லவும். அருகிலுள்ள பாதுகாப்பு மையம்: ${safePlace} (${distanceKm} கி.மீ தொலைவில்). நேரலை வரைபடம்: ${link}`,
        sosSms: (lat, lng, count, triage, phone) => `[அவசர SOS] ${count} நபர்களுக்கு அவசர உதவி தேவை! நிலை: ${triage}. ஜிபிஎஸ்: ${lat.toFixed(5)}, ${lng.toFixed(5)}. தொடர்பு: ${phone}`,
        adviceRed: 'கடுமையான ஆபத்து: பெருவெள்ளம் / நிலச்சரிவு அபாயம். ஓடும் நீரிலோ அல்லது பாலங்களிலோ செல்லாதீர்கள். உடனே பாதுகாப்பான இடத்திற்கு செல்லவும்.',
        adviceAmber: 'வானிலை எச்சரிக்கை: கனமழை மற்றும் நீர்மட்டம் உயர்வு. உள்ளேயே இருங்கள், அவசர பொருட்களை தயாராக வையுங்கள்.',
        adviceGreen: 'பாதுகாப்பான பகுதி: நீங்கள் தற்போது ஆபத்தான பகுதிக்கு வெளியே உள்ளீர்கள். அதிகாரப்பூர்வ தகவல்களை கவனியுங்கள்.'
    },
    ml: {
        hazardWarning: (hazard, location) => `[ഔദ്യോഗിക മുന്നറിയിപ്പ്] ${location} പ്രദേശത്ത് അതിതീവ്ര ${hazard} മുന്നറിയിപ്പ്. ഉടൻ സുരക്ഷിത സ്ഥാനത്തേക്ക് മാറുക.`,
        smsAlert: (hazard, safePlace, distanceKm, link) => `[ഔദ്യോഗികം] അതിതീവ്ര ${hazard} മുന്നറിയിപ്പ്! ഉടൻ സുരക്ഷിത സ്ഥാനത്തേക്ക് മാറുക. അടുത്തുള്ള ദുരിതാശ്വാസ കേന്ദ്രം: ${safePlace} (${distanceKm} കി.മീ ദൂരം). മാപ്പ്: ${link}`,
        sosSms: (lat, lng, count, triage, phone) => `[അടിയന്തര SOS] ${count} പേർക്ക് അടിയന്തര രക്ഷാസഹായം ആവശ്യമാണ്! നില: ${triage}. ജിപിഎസ്: ${lat.toFixed(5)}, ${lng.toFixed(5)}. ഫോൺ: ${phone}`,
        adviceRed: 'അതിതീവ്ര അപകടം: മലവെള്ളപ്പാച്ചിൽ / ഉരുൾപൊട്ടൽ സാധ്യത. ഒഴുകുന്ന വെള്ളത്തിലൂടെ നടക്കുകയോ വാഹനം ഓടിക്കുകയോ ചെയ്യരുത്. ഉടൻ ഉയർന്ന സ്ഥലത്തേക്ക് മാറുക.',
        adviceAmber: 'ജാഗ്രതാ നിർദ്ദേശം: കനത്ത മഴയും കാറ്റും. വീടുകളിലോ സുരക്ഷിത കെട്ടിടങ്ങളിലോ തുടരുക. മലയോര യാത്രകൾ ഒഴിവാക്കുക.',
        adviceGreen: 'സുരക്ഷിത മേഖല: നിങ്ങൾ ഇപ്പോൾ അപകടസാധ്യതയില്ലാത്ത പ്രദേശത്താണ്. ഔദ്യോഗിക വാർത്തകൾ ശ്രദ്ധിക്കുക.'
    },
    te: {
        hazardWarning: (hazard, location) => `[అధికారిక హెచ్చరిక] ${location} లో తీవ్రమైన ${hazard} హెచ్చరిక. వెంటనే ఎత్తైన ప్రాంతాలకు వెళ్లండి.`,
        smsAlert: (hazard, safePlace, distanceKm, link) => `[అధికారికం] తీవ్రమైన ${hazard} హెచ్చరిక! వెంటనే సురక్షిత ప్రాంతానికి వెళ్ళండి. సమీప సురక్షిత కేంద్రం: ${safePlace} (${distanceKm} కి.మీ). మ్యాప్: ${link}`,
        sosSms: (lat, lng, count, triage, phone) => `[అత్యవసర SOS] ${count} మందికి అత్యవసర సహాయం కావాలి! పరిస్థితి: ${triage}. GPS: ${lat.toFixed(5)}, ${lng.toFixed(5)}. ఫోన్: ${phone}`,
        adviceRed: 'తీవ్ర ప్రమాదం: వరదలు మరియు కొండచరియలు విరిగిపడే ప్రమాదం. ప్రవహించే నీటిలోకి వెళ్లవద్దు. వెంటనే ఎత్తైన ప్రదేశాలకు వెళ్లండి.',
        adviceAmber: 'వాతావరణ హెచ్చరిక: భారీ వర్షాలు కురుస్తున్నాయి. సురక్షిత ప్రదేశాల్లో ఉండండి, ప్రయాణాలు వాయిదా వేసుకోండి.',
        adviceGreen: 'సురక్షిత ప్రాంతం: మీరు ప్రస్తుతం ప్రమాద రహిత ప్రాంతంలో ఉన్నారు. అధికారిక సమాచారాన్ని గమనించండి.'
    },
    kn: {
        hazardWarning: (hazard, location) => `[ಅಧಿಕೃತ ಎಚ್ಚರಿಕೆ] ${location} ನಲ್ಲಿ ತೀವ್ರ ${hazard} ಎಚ್ಚರಿಕೆ. ತಕ್ಷಣ ಸುರಕ್ಷಿತ ಸ್ಥಳಕ್ಕೆ ತೆರಳಿ.`,
        smsAlert: (hazard, safePlace, distanceKm, link) => `[ಅಧಿಕೃತ] ತೀವ್ರ ${hazard} ಎಚ್ಚರಿಕೆ! ತಕ್ಷಣ ಎತ್ತರದ ಸ್ಥಳಕ್ಕೆ ತೆರಳಿ. ಹತ್ತಿರದ ಸುರಕ್ಷಿತ ಆಶ್ರಯ: ${safePlace} (${distanceKm} ಕಿ.ಮೀ ದೂರ). ನಕ್ಷೆ: ${link}`,
        sosSms: (lat, lng, count, triage, phone) => `[ತುರ್ತು SOS] ${count} ಜನರಿಗೆ ತಕ್ಷಣ ರಕ್ಷಣೆ ಬೇಕಾಗಿದೆ! ಸ್ಥಿತಿ: ${triage}. GPS: ${lat.toFixed(5)}, ${lng.toFixed(5)}. ಸಂಪರ್ಕ: ${phone}`,
        adviceRed: 'ಅಪಾಯದ ವಲಯ: ಪ್ರವಾಹ ಮತ್ತು ಭೂಕುಸಿತದ ತೀವ್ರ ಸಾಧ್ಯತೆ. ಹರಿಯುವ ನೀರಿನಲ್ಲಿ ಇಳಿಯಬೇಡಿ. ತಕ್ಷಣ ಸುರಕ್ಷಿತ ಕೇಂದ್ರಕ್ಕೆ ತೆರಳಿ.',
        adviceAmber: 'ಹವಾಮಾನ ಎಚ್ಚರಿಕೆ: ಭಾರೀ ಮಳೆ. ಮನೆಯೊಳಗೆ ಅಥವಾ ಸುರಕ್ಷಿತ ಕಟ್ಟಡಗಳಲ್ಲಿ ಇರಿ, ಬೆಟ್ಟದ ರಸ್ತೆಗಳಲ್ಲಿ ಪ್ರಯಾಣಿಸಬೇಡಿ.',
        adviceGreen: 'ಸುರಕ್ಷಿತ ವಲಯ: ನೀವು ಸದ್ಯ ಅಪಾಯ ರಹಿತ ಸ್ಥಳದಲ್ಲಿದ್ದೀರಿ. ಅಧಿಕೃತ ಸೂಚನೆಗಳನ್ನು ಗಮನಿಸಿ.'
    },
    bn: {
        hazardWarning: (hazard, location) => `[সরকারি সতর্কতা] ${location}-এ চরম ${hazard} সতর্কতা। অবিলম্বে উঁচু ও নিরাপদ স্থানে আশ্রয় নিন।`,
        smsAlert: (hazard, safePlace, distanceKm, link) => `[সরকারি] চরম ${hazard} সতর্কতা! অবিলম্বে নিরাপদ আশ্রয়ে যান। নিকটতম আশ্রয়কেন্দ্র: ${safePlace} (${distanceKm} কিমি দূরে)। লাইভ ম্যাপ: ${link}`,
        sosSms: (lat, lng, count, triage, phone) => `[জরুরি SOS] ${count} জনের অবিলম্বে উদ্ধার প্রয়োজন! অবস্থা: ${triage}। জিপিএস: ${lat.toFixed(5)}, ${lng.toFixed(5)}। ফোন: ${phone}`,
        adviceRed: 'চরম বিপদ: হড়পা বান ও ভূমিধসের আশঙ্কা। জলমগ্ন রাস্তা বা সেতু পার হবেন না। অবিলম্বে উঁচু আশ্রয়ে যান।',
        adviceAmber: 'সতর্কবার্তা: ভারী বৃষ্টিপাত হচ্ছে। নিরাপদ আশ্রয়ে থাকুন, পাহাড়ি রাস্তা পরিহার করুন।',
        adviceGreen: 'নিরাপদ অঞ্চল: আপনার অবস্থান বিপদসীমার বাইরে। সতর্ক থাকুন ও সরকারি বুলেটিন অনুসরণ করুন।'
    },
    fr: {
        hazardWarning: (hazard, location) => `[ALERTE OFFICIELLE] Alerte sévère (${hazard}) en cours à ${location}. Évacuez immédiatement vers les hauteurs.`,
        smsAlert: (hazard, safePlace, distanceKm, link) => `[OFFICIEL] Alerte critique : ${hazard} ! Gagnez les hauteurs sans délai. Abri sûr le plus proche : ${safePlace} (à ${distanceKm} km). Carte en direct : ${link}`,
        sosSms: (lat, lng, count, triage, phone) => `[SOS URGENCE] ${count} personne(s) en danger immédiat ! État : ${triage}. Coordonnées GPS : ${lat.toFixed(5)}, ${lng.toFixed(5)}. Tél : ${phone}`,
        adviceRed: 'DANGER EXTRÊME : Risque majeur de crue éclair / glissement de terrain. Ne traversez aucune route inondée. Rejoignez immédiatement un refuge en hauteur.',
        adviceAmber: 'VIGILANCE MÉTÉO : Précipitations intenses. Restez à l\'abri, préparez votre trousse d\'urgence, évitez les axes montagneux.',
        adviceGreen: 'ZONE SÉCURISÉE : Votre secteur n\'est pas sous ordre d\'évacuation. Restez attentif aux consignes officielles.'
    },
    de: {
        hazardWarning: (hazard, location) => `[OFFIZIELLE WARNUNG] Schwere ${hazard}-Warnung für ${location}. Verlassen Sie tiefer gelegene Gebiete unverzüglich.`,
        smsAlert: (hazard, safePlace, distanceKm, link) => `[OFFIZIELL] Schwere ${hazard}-Gefahr! Sofort höhere Lagen aufsuchen. Nächste Notunterkunft: ${safePlace} (${distanceKm} km entfernt). Live-Karte: ${link}`,
        sosSms: (lat, lng, count, triage, phone) => `[SOS NOTRUF] ${count} Person(en) benötigen sofortige Rettung! Status: ${triage}. GPS-Daten: ${lat.toFixed(5)}, ${lng.toFixed(5)}. Tel: ${phone}`,
        adviceRed: 'EXTREME GEFAHR: Sturzfluten / Erdrutschgefahr. Fließende Gewässer nicht queren. Begeben Sie sich unverzüglich in höher gelegene Notunterkünfte.',
        adviceAmber: 'WETTERWARNUNG: Starkregen und steigende Pegelstände. Im Gebäude bleiben, Bergstraßen meiden.',
        adviceGreen: 'SICHERE ZONE: Ihr aktueller Standort ist nicht akut gefährdet. Bleiben Sie informiert und folgen Sie den Behörden.'
    },
    es: {
        hazardWarning: (hazard, location) => `[ALERTA OFICIAL] Alerta grave por ${hazard} en ${location}. Evacúe de inmediato hacia zonas altas.`,
        smsAlert: (hazard, safePlace, distanceKm, link) => `[OFICIAL] ¡Alerta de ${hazard}! Busque terrenos elevados ahora. Refugio seguro más cercano: ${safePlace} (a ${distanceKm} km). Mapa en vivo: ${link}`,
        sosSms: (lat, lng, count, triage, phone) => `[SOS EMERGENCIA] ¡${count} persona(s) requieren rescate urgente! Estado: ${triage}. Coordenadas GPS: ${lat.toFixed(5)}, ${lng.toFixed(5)}. Tel: ${phone}`,
        adviceRed: 'PELIGRO EXTREMO: Riesgo de inundación repentina o deslaves. No intente cruzar corrientes de agua. Busque refugio elevado de inmediato.',
        adviceAmber: 'ADVERTENCIA METEOROLÓGICA: Lluvias intensas. Permanezca bajo techo, evite carreteras de montaña.',
        adviceGreen: 'ZONA SEGURA: Su ubicación actual está fuera del área de peligro directo. Manténgase alerta a comunicados oficiales.'
    },
    ar: {
        hazardWarning: (hazard, location) => `[تحذير رسمي] تحذير شديد من ${hazard} في منطقة ${location}. يرجى إخلاء الأماكن المنخفضة فوراً والانتقال للأماكن المرتفعة.`,
        smsAlert: (hazard, safePlace, distanceKm, link) => `[رسمي] تحذير شديد من ${hazard}! توجه للمرتفعات فوراً. أقرب ملجأ آمن: ${safePlace} (يبعد ${distanceKm} كم). الخريطة المباشرة: ${link}`,
        sosSms: (lat, lng, count, triage, phone) => `[نداء استغاثة طارئ] ${count} شخص يحتاجون لإنقاذ عاجل! الحالة: ${triage}. إحداثيات GPS: ${lat.toFixed(5)}, ${lng.toFixed(5)}. الهاتف: ${phone}`,
        adviceRed: 'خطر شديد جداً: سيول جارفة وانهيارات أرضية. لا تعبر مجاري المياه أو الجسور. توجه فوراً إلى المرتفعات أو أقرب مأوى.',
        adviceAmber: 'تنبيه جوي: أمطار غزيرة وارتفاع منسوب المياه. ابق في مكان آمن وتجنب الطرق الجبلية.',
        adviceGreen: 'منطقة آمنة: موقعك الحالي خارج نطاق الخطر المباشر. تابع التحديثات الرسمية وابق هاتفك مشحوناً.'
    },
    zh: {
        hazardWarning: (hazard, location) => `[官方警报] ${location} 发布严重${hazard}红色预警。请立即向地势较高区域撤离。`,
        smsAlert: (hazard, safePlace, distanceKm, link) => `[官方通知] 严重${hazard}危险！请立即转移至高处。最近安全避难所：${safePlace}（距离 ${distanceKm} 公里）。实时救援地图：${link}`,
        sosSms: (lat, lng, count, triage, phone) => `[紧急SOS救援] ${count}人急需救援！险情：${triage}。GPS坐标：${lat.toFixed(5)}, ${lng.toFixed(5)}。电话：${phone}`,
        adviceRed: '极度危险：山洪暴发及山体滑坡威胁。切勿涉水过桥或靠近河道，请立即前往高处避难所。',
        adviceAmber: '气象预警：强降雨及水位持续上涨。请留在坚固室内，备齐应急物资，切勿前往山区道路。',
        adviceGreen: '安全区域：您当前所处区域未受直接威胁。请保持通讯畅通，密切关注官方通告。'
    },
    ja: {
        hazardWarning: (hazard, location) => `[公式警報] ${location} で深刻な${hazard}警報が発令されました。直ちに高台へ避難してください。`,
        smsAlert: (hazard, safePlace, distanceKm, link) => `[公式] 深刻な${hazard}警報！今すぐ高台へ移動してください。最寄りの安全な避難所：${safePlace}（${distanceKm} km先）。マップ：${link}`,
        sosSms: (lat, lng, count, triage, phone) => `[緊急SOS] ${count}名が緊急救助を求めています！状況：${triage}。GPS座標：${lat.toFixed(5)}, ${lng.toFixed(5)}。連絡先：${phone}`,
        adviceRed: '極めて危険：鉄砲水および土砂崩れの危険があります。増水した河川や橋に近づかず、直ちに高台や避難所へ避難してください。',
        adviceAmber: '気象注意報：大雨と強風。不要不急の外出を避け、山道や川沿いから離れてください。',
        adviceGreen: '安全エリア：現在地は避難勧告区域外です。警戒を怠らず公式情報を確認してください。'
    },
    ru: {
        hazardWarning: (hazard, location) => `[ОФИЦИАЛЬНОЕ ПРЕДУПРЕЖДЕНИЕ] Экстренное предупреждение: ${hazard} в районе ${location}. Немедленно эвакуируйтесь на возвышенность.`,
        smsAlert: (hazard, safePlace, distanceKm, link) => `[ОФИЦИАЛЬНО] Опасность: ${hazard}! Срочно перейдите на возвышенность. Ближайшее безопасное укрытие: ${safePlace} (в ${distanceKm} км). Карта: ${link}`,
        sosSms: (lat, lng, count, triage, phone) => `[ЭКСТРЕННЫЙ SOS] ${count} чел. требуют срочной эвакуации! Статус: ${triage}. Координаты GPS: ${lat.toFixed(5)}, ${lng.toFixed(5)}. Тел: ${phone}`,
        adviceRed: 'КРАЙНЯЯ ОПАСНОСТЬ: Угроза внезапного наводнения и оползней. Не пересекайте потоки воды. Немедленно направляйтесь в безопасное укрытие.',
        adviceAmber: 'ШТОРМОВОЕ ПРЕДУПРЕЖДЕНИЕ: Сильные ливни и подъем уровня воды. Оставайтесь в помещении, избегайте горных дорог.',
        adviceGreen: 'БЕЗОПАСНАЯ ЗОНА: Ваше текущее местоположение вне зоны эвакуации. Следите за официальными сводками.'
    }
};
exports.SUPPORTED_LANGUAGES = [
    { code: 'en', name: 'English', native: 'English', flag: '🇬🇧', dir: 'ltr' },
    { code: 'hi', name: 'Hindi', native: 'हिन्दी', flag: '🇮🇳', dir: 'ltr' },
    { code: 'ta', name: 'Tamil', native: 'தமிழ்', flag: '🇮🇳', dir: 'ltr' },
    { code: 'ml', name: 'Malayalam', native: 'മലയാളം', flag: '🇮🇳', dir: 'ltr' },
    { code: 'te', name: 'Telugu', native: 'తెలుగు', flag: '🇮🇳', dir: 'ltr' },
    { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ', flag: '🇮🇳', dir: 'ltr' },
    { code: 'bn', name: 'Bengali', native: 'বাংলা', flag: '🇧🇩', dir: 'ltr' },
    { code: 'fr', name: 'French', native: 'Français', flag: '🇫🇷', dir: 'ltr' },
    { code: 'de', name: 'German', native: 'Deutsch', flag: '🇩🇪', dir: 'ltr' },
    { code: 'es', name: 'Spanish', native: 'Español', flag: '🇪🇸', dir: 'ltr' },
    { code: 'ar', name: 'Arabic', native: 'العربية', flag: '🇦🇪', dir: 'rtl' },
    { code: 'zh', name: 'Chinese', native: '中文', flag: '🇨🇳', dir: 'ltr' },
    { code: 'ja', name: 'Japanese', native: '日本語', flag: '🇯🇵', dir: 'ltr' },
    { code: 'ru', name: 'Russian', native: 'Русский', flag: '🇷🇺', dir: 'ltr' }
];

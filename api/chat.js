import https from 'https';
import crypto from 'crypto';

// --- GigaChat Credentials ---
const CLIENT_ID = process.env.GIGACHAT_CLIENT_ID || "019e2c26-97a8-75cf-8d25-1caf90fcdd51";
const SECRET = process.env.GIGACHAT_SECRET || "MDE5ZTJjMjYtOTdhOC03NWNmLThkMjUtMWNhZjkwZmNkZDUxOjFkODQ2ZjZjLTgwNmEtNGIwZi1iZmQ2LTY0Zjg2NTAwMmU2Yg==";

const OAUTH_URL = "https://ngw.devices.sberbank.ru:9443/api/v2/oauth";
const CHAT_URL = "https://gigachat.devices.sberbank.ru/api/v1/chat/completions";

// --- Token Cache ---
let tokenCache = {
  accessToken: "",
  expiresAt: 0,
};

// Custom HTTPS request helper (bypasses Sberbank self-signed SSL certificate errors)
function makeRequest(urlStr, headers, body) {
  const parsedUrl = new URL(urlStr);
  const options = {
    hostname: parsedUrl.hostname,
    port: parsedUrl.port || 443,
    path: parsedUrl.pathname + parsedUrl.search,
    method: "POST",
    headers: {
      ...headers,
      "Content-Length": Buffer.byteLength(body),
    },
    rejectUnauthorized: false,
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let responseBody = "";
      res.on("data", (chunk) => { responseBody += chunk; });
      res.on("end", () => {
        if (res.statusCode && res.statusCode >= 400) {
          reject(new Error(`Status ${res.statusCode}: ${responseBody}`));
        } else {
          try {
            resolve(JSON.parse(responseBody));
          } catch {
            resolve(responseBody);
          }
        }
      });
    });

    req.on("error", (e) => reject(e));
    req.write(body);
    req.end();
  });
}

// OAuth Access Token Fetcher
async function getAccessToken() {
  const now = Date.now() / 1000;
  if (tokenCache.accessToken && now < tokenCache.expiresAt - 60) {
    return tokenCache.accessToken;
  }

  const headers = {
    "Authorization": `Basic ${SECRET}`,
    "RqUID": crypto.randomUUID(),
    "Content-Type": "application/x-www-form-urlencoded",
  };
  const body = "scope=GIGACHAT_API_PERS";

  try {
    const res = await makeRequest(OAUTH_URL, headers, body);
    tokenCache.accessToken = res.access_token;
    tokenCache.expiresAt = res.expires_at ? (res.expires_at / 1000) : (now + 1800);
    return tokenCache.accessToken;
  } catch (e) {
    throw new Error(`GigaChat Auth Failed: ${e.message}`);
  }
}

// IVITSH KSU Knowledge Base Chunks
const KNOWLEDGE_CHUNKS = [
  {
    topic: "дирекция и корпус б",
    keywords: ["дирекц", "деканат", "209", "корпус б", "ивановск", "где находить", "кабинет", "администр", "часы работ"],
    header: "Общая информация и дирекция ИВИТШ",
    content: "Дирекция Высшей ИТ-школы (ИВИТШ) КГУ находится в Корпусе Б на 2 этаже, кабинет Б-209. Работает с Пн по Пт с 9:00 до 17:00 (перерыв 12:00-13:00). Адрес Корпуса Б: ул. Ивановская, 24а [IMG:209.png]."
  },
  {
    topic: "стипендии",
    keywords: ["стипенд", "деньги", "пгас", "академическ", "социальн", "выплат", "повышенн", "сколько платят"],
    header: "Стипендии и финансовая поддержка",
    content: "Академическая стипендия: 3000 руб за сессию на «4» и «5», 4500 руб за отличную сессию («5»). Повышенная стипендия (ПГАС) — от 5000 до 10000 руб за успехи в науке, спорте и творчестве. Социальная стипендия — 2980 руб."
  },
  {
    topic: "объединения и клубы",
    keywords: ["клуб", "объединен", "викт", "медиа", "идея", "мафи", "программирован", "nexthub", "играй", "кружок", "досуг"],
    header: "Студенческие объединения ИВИТШ",
    content: "ВИТШ-медиа (рук. Макар Смирнов), ИДЕЯ (рук. Ирина Горева @KrisBeet), Спортивное программирование (рук. Глеб Лебедев @xeGalaxy), NextHub (рук. Денислав Чеботарев), Играй (рук. Василиса Никитина), Кибербезопасность (@SNEWYEWRS), Спортивная мафия (рук. Владислав Смирнов)."
  },
  {
    topic: "аудитории и коворкинг",
    keywords: ["аудитор", "кабинет", "101", "102", "104", "107", "108", "201", "202", "203", "204", "206", "207", "208", "209", "301", "302", "303", "304", "306", "307", "308", "309", "310", "312", "313", "401", "403", "406", "407", "408", "409", "коворкинг", "этаж", "преподавательск"],
    header: "Аудитории и Коворкинг",
    content: "Все аудитории ИВИТШ (101-409) находятся в Корпусе Б (ул. Ивановская, 24а). 100-е аудитории — 1 этаж. 200-е — 2 этаж (включая Б-209) [IMG:209.png]. 300-е — 3 этаж. 400-е — 4 этаж. Коворкинг ВИТШ находится на 4 этаже Корпуса Б [IMG:coworking.png]. Преподавательская в 208/209 [IMG:teachers.png]."
  },
  {
    topic: "еда и столовые",
    keywords: ["кушать", "поесть", "еда", "столовая", "обед", "кофе", "магазин", "шаурма", "голоден", "перекус"],
    header: "Где поесть рядом с Корпусом Б",
    content: "Рядом с Корпусом Б можно покушать: столовая «Жуй да Ешь» (от 100р, ул. Советская 42/1), Шаурмастер44 (шаурма от 140р, ул. Советская 61/39), «Еда-кафе» (от 150р, ул. Лермонтова 3/1), Coffee Like (Советская 26/1), магазины Пятерочка (Советская 47) и Высшая лига."
  },
  {
    topic: "словарь и адаптация",
    keywords: ["староста", "куратор", "тьютор", "профорг", "культорг", "лекция", "лабораторн", "семинар", "дифзачет", "сдо", "еиос", "зачетка", "расписан"],
    header: "Словарь и понятия учебы",
    content: "Староста: студент-лидер группы. Куратор: преподаватель-наставник. Тьютор: старшекурсник-помощник. Профорг: защита прав, матпомощь. СДО: платформа с тестами (sdo.kosgos.ru). ЭИОС: расписание и портфолио (eios.kosgos.ru)."
  }
];

// Strict RAG Relevance Evaluator
function evaluateQuery(query) {
  const qLower = query.toLowerCase().trim();
  const qWords = qLower.match(/[а-яА-ЯёЁa-zA-Z0-9]{2,}/g) || [];

  let bestMatch = null;
  let maxScore = 0;

  for (const chunk of KNOWLEDGE_CHUNKS) {
    let score = 0;

    // Check explicit keywords
    for (const kw of chunk.keywords) {
      if (qLower.includes(kw)) {
        score += 8;
      }
    }

    // Check content words
    for (const w of qWords) {
      if (w.length < 3) continue;
      if (chunk.content.toLowerCase().includes(w)) score += 2;
    }

    if (score > maxScore) {
      maxScore = score;
      bestMatch = chunk;
    }
  }

  return { score: maxScore, chunk: bestMatch };
}

// ES Module Serverless Handler for Vercel
export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ reply: 'Method Not Allowed' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch(e) {}
    }

    const userMsg = ((body && body.message) || "").trim();

    if (!userMsg) {
      return res.status(400).json({ reply: "Пожалуйста, введите вопрос." });
    }

    // Strict Relevance Check
    const { score, chunk } = evaluateQuery(userMsg);

    // If query is OFF-TOPIC or irrelevant to KSU / IVITSH knowledge base
    if (score < 4 || !chunk) {
      return res.status(200).json({ 
        reply: "Я — цифровой маскот ВИТШик и отвечаю исключительно на вопросы про Высшую ИТ-Школу КГУ, аудитории, расписание, стипендии, клубы и учебу! 😸 Задай мне вопрос по университету!" 
      });
    }

    // Prepare GigaChat prompt strictly bounded by relevant chunk
    const systemPrompt = `Ты — маскот ВИТШик. Отвечай СТРОГО И ИСКЛЮЧИТЕЛЬНО на основе предоставленного текста ниже.

ПРАВИЛА:
1. ОТВЕЧАЙ ЕСТЕСТВЕННО И ДРУЖЕЛЮБНО (1-3 коротких предложения).
2. ЗАПРЕЩЕНО добавлять любые факты, отсутствующие в тексте ниже.
3. КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО писать технические теги вида [SMILEY_...], [EMOJI_...] или вымышленные сведения.
4. ЕСЛИ СПРАШИВАЮТ про аудиторию или коворкинг, сохрани тег изображения [IMG:...].

Текст для ответа:
${chunk.content}`;

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMsg }
    ];

    // Query GigaChat API
    const token = await getAccessToken();
    const chatPayload = {
      model: "GigaChat",
      messages: messages,
      temperature: 0.1, // Minimal temperature for absolute factual fidelity
      max_tokens: 250
    };

    const chatHeaders = {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    const chatResponse = await makeRequest(CHAT_URL, chatHeaders, JSON.stringify(chatPayload));
    let reply = chatResponse.choices?.[0]?.message?.content || "";

    // Clean up unwanted Sberbank smiley tags and unicode ranges
    reply = reply
      .replace(/\[SMILEY_.*?\]/gi, "")
      .replace(/\[EMOJI_.*?\]/gi, "")
      .replace(/\[TAG_.*?\]/gi, "")
      .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, "")
      .trim();

    if (!reply) {
      reply = chunk.content;
    }

    return res.status(200).json({ reply });
  } catch (e) {
    console.error("GigaChat API Error:", e.message);
    // Strict fallback if API fails
    const { chunk } = evaluateQuery(userMsg);
    if (chunk) {
      return res.status(200).json({ reply: chunk.content });
    }
    return res.status(200).json({ 
      reply: "Я отвечаю только на вопросы об ИВИТШ КГУ (аудитории 101-409, дирекция Б-209, стипендии и клубы)! 😸" 
    });
  }
}

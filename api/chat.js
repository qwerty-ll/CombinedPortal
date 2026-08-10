import https from 'https';
import crypto from 'crypto';

// --- GigaChat Credentials ---
const CLIENT_ID = process.env.GIGACHAT_CLIENT_ID || "019e2c26-97a8-75cf-8d25-1caf90fcdd51";
const SECRET = process.env.GIGACHAT_SECRET || "MDE5ZTJjMjYtOTdhOC03NWNmLThkMjUtMWNhZjkwZmNkZDUxOjFkODQ2YzZjLTgwNmEtNGIwZi1iZmQ2LTY0Zjg2NTAwMmU2Yg==";

const OAUTH_URL = "https://ngw.devices.sberbank.ru:9443/api/v2/oauth";
const CHAT_URL = "https://gigachat.devices.sberbank.ru/api/v1/chat/completions";

// --- Token Cache ---
let tokenCache = {
  accessToken: "",
  expiresAt: 0,
};

// --- Custom HTTPS request helper (bypasses Sberbank self-signed SSL certificate errors) ---
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
    rejectUnauthorized: false, // Critical for Sberbank certificates
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

// --- OAuth Access Token Fetcher ---
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

// --- IVITSH KSU Knowledge Base Chunks ---
const KNOWLEDGE_CHUNKS = [
  {
    header: "Общая информация и дирекция ИВИТШ",
    content: "Дирекция Высшей ИТ-школы (ИВИТШ) КГУ находится в Корпусе Б на 2 этаже, кабинет Б-209. Работает с Пн по Пт с 9:00 до 17:00 (перерыв 12:00-13:00). Вся ИТ-школа находится в Корпусе Б по адресу ул. Ивановская, 24а."
  },
  {
    header: "Стипендии и поддержка",
    content: "Академическая стипендия: 3000 руб за сессию на «хорошо» и «отлично», 4500 руб за отличную сессию. Повышенная стипендия (ПГАС) — от 5000 до 10000 руб за достижения в науке, спорте, творчестве. Подача документов в Б-209. Социальная стипендия — 2980 руб."
  },
  {
    header: "Студенческие объединения ИВИТШ",
    content: "ВИТШ-медиа (рук. Макар Смирнов), ИДЕЯ (рук. Ирина Горева @KrisBeet), Спортивное программирование (рук. Глеб Лебедев @xeGalaxy), Учёба без границ (рук. Артём Копьёв), NextHub (рук. Денислав Чеботарев), Играй (рук. Василиса Никитина), Кибербезопасность (@SNEWYEWRS), Спортивная мафия (рук. Владислав Смирнов)."
  },
  {
    header: "Аудитории и Коворкинг",
    content: "Все аудитории ИВИТШ (101-409) находятся в Корпусе Б. 100-е аудитории — 1 этаж [IMG:101.png]. 200-е — 2 этаж (включая Б-209) [IMG:209.png]. 300-е — 3 этаж [IMG:301.png]. 400-е — 4 этаж [IMG:401.png]. Коворкинг ВИТШ находится на 4 этаже Корпуса Б [IMG:coworking.png]. Преподавательская в 208/209 [IMG:teachers.png]."
  },
  {
    header: "Сервисы и ссылки КГУ",
    content: "СДО КГУ (обучение и тесты): https://sdo.kosgos.ru. ЭИОС (портфолио, расписание, зачетка): https://eios.kosgos.ru. Учебный план: sdo/plan. Официальный сайт КГУ: https://kosgos.ru."
  },
  {
    header: "Где поесть рядом с Корпусом Б",
    content: "Жуй да Ешь (столовая от 100р, ул. Советская 42/1), Шаурмастер44 (шаурма от 140р, ул. Советская 61/39), Еда-кафе (от 150р, ул. Лермонтова 3/1), Coffee Like (кофе, Советская 26/1), магазины Пятерочка (Советская 47) и Высшая лига."
  }
];

// Smart RAG Matcher
function getRelevantChunks(query) {
  const words = new Set(query.toLowerCase().match(/[а-яА-ЯёЁa-zA-Z0-9]+/g) || []);
  const scored = [];

  for (const chunk of KNOWLEDGE_CHUNKS) {
    let score = 0;
    const text = (chunk.header + " " + chunk.content).toLowerCase();
    for (const w of words) {
      if (w.length < 2) continue;
      if (text.includes(w)) score += 1;
      if (chunk.header.toLowerCase().includes(w)) score += 3;
    }
    if (score > 0) scored.push({ score, chunk });
  }

  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, 2).map(s => s.chunk);

  if (top.length === 0) return KNOWLEDGE_CHUNKS[0].content;
  return top.map(c => `=== ${c.header} ===\n${c.content}`).join("\n\n");
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
      return res.status(400).json({ reply: "Пожалуйста, введите сообщение." });
    }

    // Smart RAG Context
    const relevantContext = getRelevantChunks(userMsg);

    const systemPrompt = `Ты — ВИТШик, дружелюбный, добрый и умный цифровой маскот Высшей ИТ-школы (ИВИТШ) КГУ. Твоя задача — давать грамотные, ухоженные, вежливые и естественные ответы студентам.

СТРОЖАЙШИЕ ПРАВИЛА ОБЩЕНИЯ:
1. ОТВЕЧАЙ ЕСТЕСТВЕННЫМ И ЖИВЫМ ЯЗЫКОМ, как заботливый друг. Категорически ЗАПРЕЩЕНО просто цитировать заголовки '###' или сухой текст словарной статьи! Встраивай знания в приятные развёрнутые предложения.
2. ИСПОЛЬЗУЙ ТОЛЬКО БАЗУ ЗНАНИЙ НИЖЕ. Если просят решить задачу по программированию, написать код или спрашивают про сторонние вузы/фильмы/спорт — вежливо откажи фразой: 'Я помогаю только с вопросами ИВИТШ КГУ и не обсуждаю сторонние темы! 😸'
3. ЕСЛИ ИНФОРМАЦИИ НЕТ В БАЗЕ ЗНАНИЙ — отвечай: 'К сожалению, у меня в базе знаний нет информации об этом. Задай мне другой вопрос об ИВИТШ! 🐾'
4. ВСТАВЛЯЙ ТЕГ [IMG:filename.png] на отдельной строке, если спрашиваешь или отвечаешь про кабинеты (например [IMG:209.png] для дирекции или [IMG:coworking.png] для коворкинга).

База знаний для ответа:
${relevantContext}`;

    const messages = [{ role: "system", content: systemPrompt }];

    // Limit history to last 4 turns for token economy
    const history = (body && body.history) || [];
    const recentHistory = history.slice(-4);
    for (const turn of recentHistory) {
      if (turn.role === "user" || turn.role === "assistant") {
        messages.push({ role: turn.role, content: turn.content });
      }
    }
    messages.push({ role: "user", content: userMsg });

    // Fetch OAuth Token & Query GigaChat API
    const token = await getAccessToken();
    const chatPayload = {
      model: "GigaChat",
      messages: messages,
      temperature: 0.4,
      max_tokens: 350
    };

    const chatHeaders = {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    const chatResponse = await makeRequest(CHAT_URL, chatHeaders, JSON.stringify(chatPayload));
    let reply = chatResponse.choices?.[0]?.message?.content || "";

    // Clean up high unicode emojis
    reply = reply.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, "");

    return res.status(200).json({ reply: reply.trim() });
  } catch (e) {
    console.error("GigaChat API Error:", e.message);
    return res.status(500).json({ error: e.message });
  }
}

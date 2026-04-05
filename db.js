// ── DB.JS ─────────────────────────────────────
const SUPABASE_URL = "https://uqkuklqdfhatqcvwmzdl.supabase.co";
const SUPABASE_KEY = "sb_publishable_R4tj_IV6Jur4OzqSKk6SJA_N5XY5WSy";

// Загрузить данные текущего игрока из БД и синхронизировать localStorage
async function loadMyProfile() {
  const userId = localStorage.getItem("user_id");
  if (!userId) return;

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/players?user_id=eq.${userId}&select=best_score,total_coins`,
    {
      headers: {
        "apikey":        SUPABASE_KEY,
        "Authorization": "Bearer " + SUPABASE_KEY
      }
    }
  );

  const data = await res.json();
  if (data?.[0]) {
    // БД — источник правды, перезаписываем localStorage
    localStorage.setItem("balance", data[0].total_coins ?? 0);
  }
}

async function syncPlayer(score) {
  const userId  = localStorage.getItem("user_id");
  const username = localStorage.getItem("username");
  if (!userId) return;

  const avatarUrl = window.Telegram?.WebApp?.initDataUnsafe?.user?.photo_url || null;
  const coins     = parseInt(localStorage.getItem("balance")) || 0;

  // Читаем текущий best_score
  const existing = await fetch(
    `${SUPABASE_URL}/rest/v1/players?user_id=eq.${userId}&select=best_score`,
    {
      headers: {
        "apikey":        SUPABASE_KEY,
        "Authorization": "Bearer " + SUPABASE_KEY
      }
    }
  ).then(r => r.json());

  const currentBest = existing?.[0]?.best_score ?? -1;
  const newBest = Math.max(score, currentBest);

  await fetch(`${SUPABASE_URL}/rest/v1/players`, {
    method: "POST",
    headers: {
      "apikey":        SUPABASE_KEY,
      "Authorization": "Bearer " + SUPABASE_KEY,
      "Content-Type":  "application/json",
      "Prefer":        "resolution=merge-duplicates"
    },
    body: JSON.stringify({
      user_id:     parseInt(userId),
      username:    username || "Игрок",
      avatar_url:  avatarUrl,
      best_score:  newBest,
      total_coins: coins,
      updated_at:  new Date().toISOString()
    })
  });
}

async function loadLeaderboard() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/players?select=username,avatar_url,best_score&order=best_score.desc&limit=10`,
    {
      headers: {
        "apikey":        SUPABASE_KEY,
        "Authorization": "Bearer " + SUPABASE_KEY
      }
    }
  );
  if (!res.ok) throw new Error("Leaderboard fetch failed: " + res.status);
  return await res.json();
}
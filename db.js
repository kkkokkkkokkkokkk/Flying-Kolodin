const SUPABASE_URL = "https://uqkuklqdfhatqcvwmzdl.supabase.co";
const SUPABASE_KEY = "sb_publishable_R4tj_IV6Jur4OzqSKk6SJA_N5XY5WSy";

async function syncPlayer(score) {
  const userId   = localStorage.getItem("user_id");
  const username = localStorage.getItem("username");
  const avatarUrl = window.Telegram?.WebApp?.initDataUnsafe?.user?.photo_url || null;
  const coins    = parseInt(localStorage.getItem("balance")) || 0;

  await fetch(`${SUPABASE_URL}/rest/v1/players`, {
    method: "POST",
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": "Bearer " + SUPABASE_KEY,
      "Content-Type": "application/json",
      "Prefer": "resolution=merge-duplicates"   // upsert
    },
    body: JSON.stringify({
      user_id:      parseInt(userId),
      username:     username,
      avatar_url:   avatarUrl,
      best_score:   score,
      total_coins:  coins,
      updated_at:   new Date().toISOString()
    })
  });
}

async function loadLeaderboard() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/players?select=username,avatar_url,best_score&order=best_score.desc&limit=10`,
    {
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": "Bearer " + SUPABASE_KEY
      }
    }
  );
  return await res.json();
}
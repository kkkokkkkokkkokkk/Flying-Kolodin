// ── DB.JS ─────────────────────────────────────
const SUPABASE_URL = "https://uqkuklqdfhatqcvwmzdl.supabase.co";
const SUPABASE_KEY = "sb_publishable_R4tj_IV6Jur4OzqSKk6SJA_N5XY5WSy";

// Load profile from DB → sync to localStorage
async function loadMyProfile() {
  const userId = localStorage.getItem("user_id");
  if (!userId) return;

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/players?user_id=eq.${userId}&select=best_score,total_coins,hidden,owned_items,equipped`,
    { headers: { "apikey": SUPABASE_KEY, "Authorization": "Bearer " + SUPABASE_KEY } }
  );

  const data = await res.json();
  if (!data?.[0]) return;

  const row = data[0];
  localStorage.setItem("balance",    row.total_coins  ?? 0);
  localStorage.setItem("best_score", row.best_score   ?? 0);
  localStorage.setItem("hidden",     row.hidden ? "1" : "0");

  // owned_items & equipped — only overwrite if DB has real data
  if (row.owned_items && typeof row.owned_items === "object") {
    localStorage.setItem("owned_items", JSON.stringify(row.owned_items));
  }
  if (row.equipped && typeof row.equipped === "object") {
    localStorage.setItem("equipped", JSON.stringify(row.equipped));
  }
}

// Save score + coins + shop data to DB
async function syncPlayer(score) {
  const userId   = localStorage.getItem("user_id");
  const username = localStorage.getItem("username");
  if (!userId) return;

  const isHidden   = localStorage.getItem("hidden") === "1";
  const avatarUrl  = window.Telegram?.WebApp?.initDataUnsafe?.user?.photo_url || null;
  const coins      = parseInt(localStorage.getItem("balance"))    || 0;
  const ownedRaw   = localStorage.getItem("owned_items");
  const equippedRaw= localStorage.getItem("equipped");

  // Get current best so we never overwrite with a lower score
  const existRes = await fetch(
    `${SUPABASE_URL}/rest/v1/players?user_id=eq.${userId}&select=best_score`,
    { headers: { "apikey": SUPABASE_KEY, "Authorization": "Bearer " + SUPABASE_KEY } }
  );
  const existData  = await existRes.json();
  const currentBest= existData?.[0]?.best_score ?? -1;
  const newBest    = Math.max(score, currentBest);

  const payload = {
    user_id:     parseInt(userId),
    best_score:  newBest,
    total_coins: coins,
    updated_at:  new Date().toISOString()
  };

  if (!isHidden) {
    payload.username   = username || "Игрок";
    payload.avatar_url = avatarUrl;
  }

  // Sync shop state
  try { if (ownedRaw)    payload.owned_items = JSON.parse(ownedRaw);    } catch(_) {}
  try { if (equippedRaw) payload.equipped    = JSON.parse(equippedRaw); } catch(_) {}

  await fetch(`${SUPABASE_URL}/rest/v1/players`, {
    method: "POST",
    headers: {
      "apikey":        SUPABASE_KEY,
      "Authorization": "Bearer " + SUPABASE_KEY,
      "Content-Type":  "application/json",
      "Prefer":        "resolution=merge-duplicates"
    },
    body: JSON.stringify(payload)
  });
}

// Leaderboard
async function loadLeaderboard() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/players?select=username,avatar_url,best_score&order=best_score.desc&limit=10`,
    { headers: { "apikey": SUPABASE_KEY, "Authorization": "Bearer " + SUPABASE_KEY } }
  );
  if (!res.ok) throw new Error("Leaderboard fetch failed: " + res.status);
  return await res.json();
}

// Save only shop data (called after buy/equip without waiting for game end)
async function syncShopOnly() {
  const userId     = localStorage.getItem("user_id");
  if (!userId) return;

  const coins      = parseInt(localStorage.getItem("balance"))    || 0;
  const ownedRaw   = localStorage.getItem("owned_items");
  const equippedRaw= localStorage.getItem("equipped");

  const payload = {
    user_id:     parseInt(userId),
    total_coins: coins,
    updated_at:  new Date().toISOString()
  };
  try { if (ownedRaw)    payload.owned_items = JSON.parse(ownedRaw);    } catch(_) {}
  try { if (equippedRaw) payload.equipped    = JSON.parse(equippedRaw); } catch(_) {}

  await fetch(`${SUPABASE_URL}/rest/v1/players`, {
    method: "POST",
    headers: {
      "apikey":        SUPABASE_KEY,
      "Authorization": "Bearer " + SUPABASE_KEY,
      "Content-Type":  "application/json",
      "Prefer":        "resolution=merge-duplicates"
    },
    body: JSON.stringify(payload)
  });
}
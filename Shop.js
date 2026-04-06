// ══════════════════════════════════════════════
//  SHOP.JS  — items catalogue, buy, equip logic
// ══════════════════════════════════════════════

// ── Item catalogue ─────────────────────────────
const CATALOGUE = {
  skins: [
    { id: "default", name: "Классик",    icon: "🐦", price: 0   },
    { id: "pixel",   name: "Пиксель",    icon: "👾", price: 50  },
    { id: "fire",    name: "Огонь",      icon: "🔥", price: 120 },
    { id: "ghost",   name: "Призрак",    icon: "👻", price: 80  },
    { id: "robot",   name: "Робот",      icon: "🤖", price: 150 },
    { id: "alien",   name: "Инопланетян",icon: "👽", price: 200 },
  ],
  music: [
    { id: "default", name: "Классика",   icon: "🎵", price: 0   },
    { id: "rock",    name: "Рок",        icon: "🎸", price: 80  },
    { id: "lofi",    name: "Lo-Fi",      icon: "🌊", price: 60  },
    { id: "8bit",    name: "8-бит",      icon: "🕹️", price: 70  },
  ],
  bg: [
    { id: "default", name: "Оригинал",   icon: "🌅", price: 0   },
    { id: "city",    name: "Город",      icon: "🌆", price: 70  },
    { id: "space",   name: "Космос",     icon: "🌌", price: 100 },
    { id: "forest",  name: "Лес",        icon: "🌲", price: 90  },
  ],
  pipes: [
    { id: "default", name: "Зелёные",    icon: "🟩", price: 0   },
    { id: "stone",   name: "Камень",     icon: "🪨", price: 90  },
    { id: "neon",    name: "Неон",       icon: "⚡", price: 150 },
    { id: "gold",    name: "Золото",     icon: "🏆", price: 200 },
  ],
};

// ── Local state ────────────────────────────────
// owned  = { skins: Set, music: Set, bg: Set, pipes: Set }
// equipped = { skin, music, bg, pipes }
let owned    = { skins: new Set(["default"]), music: new Set(["default"]), bg: new Set(["default"]), pipes: new Set(["default"]) };
let equipped = { skin: "default", music: "default", bg: "default", pipes: "default" };

function loadShopState() {
  try {
    const o = JSON.parse(localStorage.getItem("owned_items") || "{}");
    for (const cat of ["skins","music","bg","pipes"]) {
      owned[cat] = new Set(o[cat] || ["default"]);
    }
    const e = JSON.parse(localStorage.getItem("equipped") || "{}");
    equipped = { skin: e.skin||"default", music: e.music||"default", bg: e.bg||"default", pipes: e.pipes||"default" };
  } catch(_) {}
}

function saveShopState() {
  const o = {};
  for (const cat of ["skins","music","bg","pipes"]) o[cat] = [...owned[cat]];
  localStorage.setItem("owned_items", JSON.stringify(o));
  localStorage.setItem("equipped", JSON.stringify(equipped));
}

loadShopState();

// ── Getters used by game.js ────────────────────
function getEquipped() { return equipped; }

// ── Render helpers ─────────────────────────────
function renderShopGrid(containerId, cat, accountMode) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const items = CATALOGUE[cat];
  const catKey = cat === "skins" ? "skin" : cat === "pipes" ? "pipes" : cat;

  el.innerHTML = items.map(item => {
    const isOwned    = owned[cat].has(item.id);
    const isEquipped = equipped[catKey] === item.id;
    const isFree     = item.price === 0;

    let btnHtml = "";
    if (accountMode) {
      // Account tab: only show owned items, with equip button
      if (!isOwned) return "";
      if (isEquipped) {
        btnHtml = `<button class="shop-card-btn equipped-btn" disabled>✓ Надето</button>`;
      } else {
        btnHtml = `<button class="shop-card-btn equip" onclick="equipItem('${cat}','${item.id}')">Надеть</button>`;
      }
    } else {
      // Shop tab
      if (isOwned && isFree) {
        btnHtml = isEquipped
          ? `<button class="shop-card-btn equipped-btn" disabled>✓ Надето</button>`
          : `<button class="shop-card-btn equip" onclick="equipItem('${cat}','${item.id}')">Надеть</button>`;
      } else if (isOwned) {
        btnHtml = isEquipped
          ? `<button class="shop-card-btn equipped-btn" disabled>✓ Надето</button>`
          : `<button class="shop-card-btn equip" onclick="equipItem('${cat}','${item.id}')">Надеть</button>`;
      } else {
        btnHtml = `<button class="shop-card-btn buy" onclick="buyItem('${cat}','${item.id}',${item.price},this)">🪙 ${item.price}</button>`;
      }
    }
    if (accountMode && !isOwned) return "";

    return `
      <div class="shop-card ${isEquipped ? 'equipped' : ''}" id="card-${cat}-${item.id}">
        ${isEquipped ? '<span class="equipped-badge">НАДЕТО</span>' : ""}
        <div class="shop-card-icon">${item.icon}</div>
        <div class="shop-card-name">${item.name}</div>
        ${!accountMode && !isOwned ? `<div class="shop-card-price">🪙 ${item.price}</div>` : ""}
        ${btnHtml}
      </div>`;
  }).join("");
}

function renderAllShop() {
  renderShopGrid("grid-skins", "skins", false);
  renderShopGrid("grid-music", "music", false);
  renderShopGrid("grid-bg",    "bg",    false);
  renderShopGrid("grid-pipes", "pipes", false);
}

function renderAllAccount() {
  renderShopGrid("acc-grid-skins", "skins", true);
  renderShopGrid("acc-grid-music", "music", true);
  renderShopGrid("acc-grid-bg",    "bg",    true);
  renderShopGrid("acc-grid-pipes", "pipes", true);

  const username = localStorage.getItem("username") || "Игрок";
  const avatar   = window.Telegram?.WebApp?.initDataUnsafe?.user?.photo_url;
  const best     = localStorage.getItem("best_score") || "0";
  const coins    = localStorage.getItem("balance") || "0";

  const nameEl  = document.getElementById("acc-name");
  const avaEl   = document.getElementById("acc-avatar");
  const bestEl  = document.getElementById("acc-best");
  const coinsEl = document.getElementById("acc-coins");

  if (nameEl)  nameEl.textContent  = username;
  if (bestEl)  bestEl.textContent  = best;
  if (coinsEl) coinsEl.textContent = coins;
  if (avaEl) {
    if (avatar) {
      avaEl.innerHTML = `<img src="${avatar}" alt="">`;
    } else {
      avaEl.textContent = username.charAt(0).toUpperCase();
    }
  }
}

// ── Buy ────────────────────────────────────────
function buyItem(cat, id, price, btn) {
  const balance = parseInt(localStorage.getItem("balance") || "0");
  if (balance < price) {
    const orig = btn.textContent;
    btn.textContent = "Мало монет!";
    btn.style.background = "rgba(255,107,107,.2)";
    btn.style.color = "#ff6b6b";
    setTimeout(() => { btn.textContent = orig; btn.style.background = ""; btn.style.color = ""; }, 1400);
    return;
  }
  localStorage.setItem("balance", balance - price);
  owned[cat].add(id);
  saveShopState();
  updateAllBalanceDisplays();
  renderAllShop();
}

// ── Equip ──────────────────────────────────────
function equipItem(cat, id) {
  const catKey = cat === "skins" ? "skin" : cat;
  equipped[catKey] = id;
  saveShopState();
  renderAllShop();
  renderAllAccount();
}

// ── Inner tab switch ───────────────────────────
function switchInnerTab(tab) {
  document.getElementById("itab-shop").classList.toggle("active", tab === "shop");
  document.getElementById("itab-account").classList.toggle("active", tab === "account");
  document.getElementById("ipanel-shop").classList.toggle("hidden", tab !== "shop");
  document.getElementById("ipanel-account").classList.toggle("hidden", tab !== "account");
  if (tab === "account") renderAllAccount();
}

// ── Screen switch ──────────────────────────────
function showScreen(name) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));

  const screen = document.getElementById("screen-" + name);
  const navBtn = document.getElementById("nav-" + name);
  if (screen) screen.classList.add("active");
  if (navBtn) navBtn.classList.add("active");

  if (name === "shop") {
    updateShopBalance();
    renderAllShop();
  }
}

function updateShopBalance() {
  const el = document.getElementById("shop-balance");
  if (el) el.textContent = localStorage.getItem("balance") || "0";
}

function updateAllBalanceDisplays() {
  const b = localStorage.getItem("balance") || "0";
  const mainEl = document.getElementById("balance");
  const shopEl = document.getElementById("shop-balance");
  if (mainEl) mainEl.textContent = b;
  if (shopEl) shopEl.textContent = b;
}

// Initial render
renderAllShop();
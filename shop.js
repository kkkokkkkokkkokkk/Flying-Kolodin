// ══════════════════════════════════════════════
//  SHOP.JS — catalogue, buy, equip, nav
// ══════════════════════════════════════════════

const CATALOGUE = {
  skins: [
    { id:"default", name:"Колодин",     icon:"🐦", price:0,   file:null  },
    { id:"pixel",   name:"Пиксель",     icon:"👾", price:50,  file:"img/player_pixel.png"  },
    { id:"fire",    name:"Огонь",       icon:"🔥", price:120, file:"img/player_fire.png"   },
    { id:"ghost",   name:"Doxer",     icon:"👻", price:80,  file:"img/player_ghost.png"  },
    { id:"robot",   name:"Робот",       icon:"🤖", price:150, file:"img/player_robot.png"  },
    { id:"alien",   name:"Инопланетян", icon:"👽", price:200, file:"img/player_alien.png"  },
  ],
  music: [
    { id:"default", name:"Будни ДТК",    icon:"🎵", price:0,  file:null },
    { id:"rock",    name:"Рок",         icon:"🎸", price:80, file:"audio/music_rock.mp3"  },
    { id:"lofi",    name:"Lo-Fi",       icon:"🌊", price:60, file:"audio/music_lofi.mp3"  },
    { id:"8bit",    name:"8-бит",       icon:"🕹️", price:70, file:"audio/music_8bit.mp3"  },
  ],
  bg: [
    { id:"default", name:"Оригинал",    icon:"🌅", price:0,   file:null },
    { id:"city",    name:"Город",       icon:"🌆", price:70,  file:"img/bg_city.jpg"   },
    { id:"space",   name:"Космос",      icon:"🌌", price:100, file:"img/bg_space.jpg"  },
    { id:"forest",  name:"Лес",         icon:"🌲", price:90,  file:"img/bg_forest.jpg" },
  ],
  pipes: [
    { id:"default", name:"Зелёные",     icon:"🟩", price:0,   file:null },
    { id:"stone",   name:"Камень",      icon:"🪨", price:90,  file:"img/pipe_stone.png" },
    { id:"neon",    name:"Неон",        icon:"⚡", price:150, file:"img/pipe_neon.png"  },
    { id:"gold",    name:"Золото",      icon:"🏆", price:200, file:"img/pipe_gold.png"  },
  ],
};

// Default file paths (fallback when equipped = "default")
const DEFAULTS = {
  skin:  "img/player.png",
  music: "audio/music.mp3",
  bg:    "img/bg.jpg",
  pipes: "img/pipe.png",
};

// ── State (kept in sync with localStorage) ────
let owned    = { skins:new Set(["default"]), music:new Set(["default"]), bg:new Set(["default"]), pipes:new Set(["default"]) };
let equipped = { skin:"default", music:"default", bg:"default", pipes:"default" };

function _loadState() {
  try {
    const o = JSON.parse(localStorage.getItem("owned_items") || "{}");
    for (const c of ["skins","music","bg","pipes"]) {
      owned[c] = new Set(Array.isArray(o[c]) ? o[c] : ["default"]);
    }
  } catch(_) {}
  try {
    const e = JSON.parse(localStorage.getItem("equipped") || "{}");
    equipped = {
      skin:  e.skin  || "default",
      music: e.music || "default",
      bg:    e.bg    || "default",
      pipes: e.pipes || "default",
    };
  } catch(_) {}
}

function _saveState() {
  const o = {};
  for (const c of ["skins","music","bg","pipes"]) o[c] = [...owned[c]];
  localStorage.setItem("owned_items", JSON.stringify(o));
  localStorage.setItem("equipped",    JSON.stringify(equipped));
  // fire-and-forget DB sync
  if (typeof syncShopOnly === "function") syncShopOnly().catch(console.error);
}

_loadState();

// ── Public getters used by game.js ─────────────
function getEquipped() { return equipped; }

function getAssetPath(category, id) {
  // category: "skin" | "music" | "bg" | "pipes"
  // maps to CATALOGUE key
  const catMap = { skin:"skins", music:"music", bg:"bg", pipes:"pipes" };
  const cat    = catMap[category];
  if (!cat) return DEFAULTS[category];
  if (id === "default") return DEFAULTS[category];
  const item = CATALOGUE[cat].find(i => i.id === id);
  return (item && item.file) ? item.file : DEFAULTS[category];
}

// ── Navigation ─────────────────────────────────
function navTo(name) {
  const appEl   = document.getElementById("app");
  const shopEl  = document.getElementById("shop-screen");
  const navHome = document.getElementById("nav-home");
  const navShop = document.getElementById("nav-shop");

  if (name === "home") {
    appEl.style.display = "flex";
    shopEl.classList.add("screen-hidden");
    navHome.classList.add("active");
    navShop.classList.remove("active");
  } else {
    appEl.style.display = "none";
    shopEl.classList.remove("screen-hidden");
    navHome.classList.remove("active");
    navShop.classList.add("active");
    _syncShopBalancePill();
    // always re-render when opening
    switchInnerTab("shop");
  }
}

function _syncShopBalancePill() {
  const el = document.getElementById("shop-balance");
  if (el) el.textContent = localStorage.getItem("balance") || "0";
}

// ── Inner tab ──────────────────────────────────
function switchInnerTab(tab) {
  const tabShop = document.getElementById("itab-shop");
  const tabAcc  = document.getElementById("itab-account");
  const panShop = document.getElementById("ipanel-shop");
  const panAcc  = document.getElementById("ipanel-account");

  if (!tabShop || !panShop) return;

  tabShop.classList.toggle("active",  tab === "shop");
  tabAcc.classList.toggle("active",   tab === "account");
  panShop.classList.toggle("panel-hidden",   tab !== "shop");
  panAcc.classList.toggle("panel-hidden",    tab !== "account");

  if (tab === "shop")    renderShop();
  if (tab === "account") renderAccount();
}

// ── Render helpers ─────────────────────────────
function _renderGrid(containerId, cat, accountMode) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const eqKey = cat === "skins" ? "skin" : cat;

  el.innerHTML = CATALOGUE[cat].map(item => {
    const isOwned    = owned[cat].has(item.id);
    const isEquipped = equipped[eqKey] === item.id;
    if (accountMode && !isOwned) return "";

    let btn;
    if (isEquipped) {
      btn = `<button class="s-btn s-equipped" disabled>✓ Надето</button>`;
    } else if (isOwned) {
      btn = `<button class="s-btn s-equip" onclick="equipItem('${cat}','${item.id}')">Надеть</button>`;
    } else {
      btn = `<button class="s-btn s-buy" onclick="buyItem('${cat}','${item.id}',${item.price},this)">🪙 ${item.price}</button>`;
    }

    return `
      <div class="s-card${isEquipped?' is-equipped':''}">
        ${isEquipped ? '<span class="s-badge">НАДЕТО</span>' : ''}
        <div class="s-icon">${item.icon}</div>
        <div class="s-name">${item.name}</div>
        ${!accountMode && !isOwned ? `<div class="s-price">🪙 ${item.price}</div>` : ''}
        ${btn}
      </div>`;
  }).join("");
}

function renderShop() {
  _renderGrid("grid-skins", "skins", false);
  _renderGrid("grid-music", "music", false);
  _renderGrid("grid-bg",    "bg",    false);
  _renderGrid("grid-pipes", "pipes", false);
}

function renderAccount() {
  _renderGrid("acc-skins", "skins", true);
  _renderGrid("acc-music", "music", true);
  _renderGrid("acc-bg",    "bg",    true);
  _renderGrid("acc-pipes", "pipes", true);

  const name   = localStorage.getItem("username") || "Игрок";
  const avatar = window.Telegram?.WebApp?.initDataUnsafe?.user?.photo_url || null;
  const best   = localStorage.getItem("best_score") || "0";
  const coins  = localStorage.getItem("balance")    || "0";

  const nameEl  = document.getElementById("acc-name");
  const avaEl   = document.getElementById("acc-avatar");
  const bestEl  = document.getElementById("acc-best");
  const coinsEl = document.getElementById("acc-coins");

  if (nameEl)  nameEl.textContent  = name;
  if (bestEl)  bestEl.textContent  = best;
  if (coinsEl) coinsEl.textContent = coins;
  if (avaEl) {
    if (avatar) {
      avaEl.innerHTML = `<img src="${avatar}" alt="" onerror="this.parentElement.textContent='${name.charAt(0)}'">`;
    } else {
      avaEl.textContent = name.charAt(0).toUpperCase();
    }
  }
}

// ── Buy ────────────────────────────────────────
function buyItem(cat, id, price, btn) {
  const balance = parseInt(localStorage.getItem("balance") || "0");
  if (balance < price) {
    const orig = btn.textContent;
    btn.className    = "s-btn s-no-coins";
    btn.textContent  = "Мало монет!";
    setTimeout(() => { btn.className = "s-btn s-buy"; btn.textContent = orig; }, 1400);
    return;
  }
  const newBal = balance - price;
  localStorage.setItem("balance", newBal);
  owned[cat].add(id);
  _saveState();

  // update balance displays everywhere
  const mainEl = document.getElementById("balance");
  const shopEl = document.getElementById("shop-balance");
  if (mainEl) mainEl.textContent = newBal;
  if (shopEl) shopEl.textContent = newBal;

  renderShop();
}

// ── Equip ──────────────────────────────────────
function equipItem(cat, id) {
  const eqKey = cat === "skins" ? "skin" : cat;
  equipped[eqKey] = id;
  _saveState();

  // Reload assets in running game if possible
  if (typeof reloadGameAssets === "function") reloadGameAssets();

  renderShop();
  const accPanel = document.getElementById("ipanel-account");
  if (accPanel && !accPanel.classList.contains("panel-hidden")) renderAccount();
}
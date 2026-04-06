// ══════════════════════════════════════════════
//  SHOP.JS
// ══════════════════════════════════════════════

const CATALOGUE = {
  skins: [
    { id:"default", name:"Классик",      icon:"🐦", price:0   },
    { id:"pixel",   name:"Пиксель",      icon:"👾", price:50  },
    { id:"fire",    name:"Огонь",        icon:"🔥", price:120 },
    { id:"ghost",   name:"Призрак",      icon:"👻", price:80  },
    { id:"robot",   name:"Робот",        icon:"🤖", price:150 },
    { id:"alien",   name:"Инопланетян",  icon:"👽", price:200 },
  ],
  music: [
    { id:"default", name:"Классика",     icon:"🎵", price:0  },
    { id:"rock",    name:"Рок",          icon:"🎸", price:80 },
    { id:"lofi",    name:"Lo-Fi",        icon:"🌊", price:60 },
    { id:"8bit",    name:"8-бит",        icon:"🕹️", price:70 },
  ],
  bg: [
    { id:"default", name:"Оригинал",     icon:"🌅", price:0   },
    { id:"city",    name:"Город",        icon:"🌆", price:70  },
    { id:"space",   name:"Космос",       icon:"🌌", price:100 },
    { id:"forest",  name:"Лес",          icon:"🌲", price:90  },
  ],
  pipes: [
    { id:"default", name:"Зелёные",      icon:"🟩", price:0   },
    { id:"stone",   name:"Камень",       icon:"🪨", price:90  },
    { id:"neon",    name:"Неон",         icon:"⚡", price:150 },
    { id:"gold",    name:"Золото",       icon:"🏆", price:200 },
  ],
};

// State
let owned    = { skins:new Set(["default"]), music:new Set(["default"]), bg:new Set(["default"]), pipes:new Set(["default"]) };
let equipped = { skin:"default", music:"default", bg:"default", pipes:"default" };

function _loadState() {
  try {
    const o = JSON.parse(localStorage.getItem("owned_items") || "{}");
    for (const c of ["skins","music","bg","pipes"]) owned[c] = new Set(o[c] || ["default"]);
    const e = JSON.parse(localStorage.getItem("equipped") || "{}");
    equipped = { skin:e.skin||"default", music:e.music||"default", bg:e.bg||"default", pipes:e.pipes||"default" };
  } catch(_) {}
}
function _saveState() {
  const o = {};
  for (const c of ["skins","music","bg","pipes"]) o[c] = [...owned[c]];
  localStorage.setItem("owned_items", JSON.stringify(o));
  localStorage.setItem("equipped", JSON.stringify(equipped));
}
_loadState();

// Public getter for game.js
function getEquipped() { return equipped; }

// ── Nav between home / shop ────────────────────
function navTo(name) {
  const appEl    = document.getElementById("app");
  const shopEl   = document.getElementById("shop-screen");
  const navHome  = document.getElementById("nav-home");
  const navShop  = document.getElementById("nav-shop");

  if (name === "home") {
    appEl.style.display  = "flex";
    shopEl.classList.add("screen-hidden");
    navHome.classList.add("active");
    navShop.classList.remove("active");
  } else {
    appEl.style.display  = "none";
    shopEl.classList.remove("screen-hidden");
    navHome.classList.remove("active");
    navShop.classList.add("active");
    // sync balance pill
    const sb = document.getElementById("shop-balance");
    if (sb) sb.textContent = localStorage.getItem("balance") || "0";
    renderShop();
  }
}

// ── Inner tab ──────────────────────────────────
function switchInnerTab(tab) {
  document.getElementById("itab-shop").classList.toggle("active", tab === "shop");
  document.getElementById("itab-account").classList.toggle("active", tab === "account");
  document.getElementById("ipanel-shop").classList.toggle("panel-hidden", tab !== "shop");
  document.getElementById("ipanel-account").classList.toggle("panel-hidden", tab !== "account");
  if (tab === "account") renderAccount();
}

// ── Render shop grids ──────────────────────────
function _renderGrid(containerId, cat, accountMode) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const eqKey = cat === "skins" ? "skin" : cat;

  el.innerHTML = CATALOGUE[cat].map(item => {
    const isOwned    = owned[cat].has(item.id);
    const isEquipped = equipped[eqKey] === item.id;

    if (accountMode && !isOwned) return "";

    let btnHtml;
    if (accountMode) {
      btnHtml = isEquipped
        ? `<button class="s-btn equipped" disabled>✓ Надето</button>`
        : `<button class="s-btn equip" onclick="equipItem('${cat}','${item.id}')">Надеть</button>`;
    } else if (isOwned) {
      btnHtml = isEquipped
        ? `<button class="s-btn equipped" disabled>✓ Надето</button>`
        : `<button class="s-btn equip" onclick="equipItem('${cat}','${item.id}')">Надеть</button>`;
    } else {
      btnHtml = `<button class="s-btn buy" onclick="buyItem('${cat}','${item.id}',${item.price},this)">🪙 ${item.price}</button>`;
    }

    return `
      <div class="s-card ${isEquipped ? 'is-equipped' : ''}">
        ${isEquipped ? '<span class="s-badge">НАДЕТО</span>' : ''}
        <div class="s-icon">${item.icon}</div>
        <div class="s-name">${item.name}</div>
        ${!accountMode && !isOwned ? `<div class="s-price">🪙 ${item.price}</div>` : ''}
        ${btnHtml}
      </div>`;
  }).join("");
}

function renderShop() {
  _renderGrid("grid-skins",  "skins",  false);
  _renderGrid("grid-music",  "music",  false);
  _renderGrid("grid-bg",     "bg",     false);
  _renderGrid("grid-pipes",  "pipes",  false);
}

function renderAccount() {
  _renderGrid("acc-skins", "skins",  true);
  _renderGrid("acc-music", "music",  true);
  _renderGrid("acc-bg",    "bg",     true);
  _renderGrid("acc-pipes", "pipes",  true);

  const name   = localStorage.getItem("username") || "Игрок";
  const avatar = window.Telegram?.WebApp?.initDataUnsafe?.user?.photo_url || null;
  const best   = localStorage.getItem("best_score") || "0";
  const coins  = localStorage.getItem("balance") || "0";

  const nameEl  = document.getElementById("acc-name");
  const avaEl   = document.getElementById("acc-avatar");
  const bestEl  = document.getElementById("acc-best");
  const coinsEl = document.getElementById("acc-coins");

  if (nameEl)  nameEl.textContent  = name;
  if (bestEl)  bestEl.textContent  = best;
  if (coinsEl) coinsEl.textContent = coins;
  if (avaEl) {
    avaEl.innerHTML = avatar
      ? `<img src="${avatar}" alt="" onerror="this.parentElement.textContent='${name.charAt(0)}';">`
      : name.charAt(0).toUpperCase();
  }
}

// ── Buy ────────────────────────────────────────
function buyItem(cat, id, price, btn) {
  const balance = parseInt(localStorage.getItem("balance") || "0");
  if (balance < price) {
    const orig = btn.textContent;
    btn.className = "s-btn no-coins";
    btn.textContent = "Мало монет!";
    setTimeout(() => { btn.className = "s-btn buy"; btn.textContent = orig; }, 1400);
    return;
  }
  const newBal = balance - price;
  localStorage.setItem("balance", newBal);
  owned[cat].add(id);
  _saveState();
  // update all balance displays
  const mainBal = document.getElementById("balance");
  const shopBal = document.getElementById("shop-balance");
  if (mainBal) mainBal.textContent = newBal;
  if (shopBal) shopBal.textContent = newBal;
  renderShop();
}

// ── Equip ──────────────────────────────────────
function equipItem(cat, id) {
  const eqKey = cat === "skins" ? "skin" : cat;
  equipped[eqKey] = id;
  _saveState();
  renderShop();
  const accPanel = document.getElementById("ipanel-account");
  if (accPanel && !accPanel.classList.contains("panel-hidden")) renderAccount();
}

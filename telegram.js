// ── TELEGRAM.JS ───────────────────────────────
const tg = window.Telegram?.WebApp;

if (tg) {
  tg.ready();
  tg.expand();

  // Use Telegram theme colours if available
  const tc = tg.themeParams;
  if (tc?.bg_color) {
    document.documentElement.style.setProperty("--bg", tc.bg_color);
  }

  const user = tg.initDataUnsafe?.user;
  if (user) {
    localStorage.setItem("user_id",  String(user.id));
    localStorage.setItem("username", user.username || user.first_name || "player");
  }
}

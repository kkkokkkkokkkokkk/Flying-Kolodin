// ── TELEGRAM.JS ───────────────────────────────
const tg = window.Telegram?.WebApp;
 
if (tg) {
  tg.ready();
  tg.expand();
 
  const tc = tg.themeParams;
  if (tc?.bg_color) {
    document.documentElement.style.setProperty("--bg", tc.bg_color);
    document.body.style.overflow = "hidden";
  }
 
  const user = tg.initDataUnsafe?.user;
  if (user) {
    localStorage.setItem("user_id", String(user.id));
    localStorage.setItem("username",
      [user.first_name, user.last_name].filter(Boolean).join(" ") || "Игрок"
    );
  }
}
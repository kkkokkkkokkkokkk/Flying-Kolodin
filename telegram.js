const tg = window.Telegram.WebApp;

tg.expand();

const user = tg.initDataUnsafe?.user;

if (user) {
    localStorage.setItem("user_id", user.id);
    localStorage.setItem("username", user.username || "player");
}
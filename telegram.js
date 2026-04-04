const tg = window.Telegram.WebApp;

tg.expand(); // открыть на весь экран

// получаем данные пользователя
const user = tg.initDataUnsafe?.user;

if (user) {
    console.log("User ID:", user.id);
    console.log("Username:", user.username);

    localStorage.setItem("user_id", user.id);
    localStorage.setItem("username", user.username || "player");
}
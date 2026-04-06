import asyncio
from telegram import Bot
from telegram.error import TelegramError

TOKEN = '8632388056:AAFltKzfIfNA3YoGpF26Sf4PTAaH6EzmuRs'
USER_IDS = [
    5119205195,
    6751222086,
    6914797220,
    7258895996,
    7460546102,
    7725282403,
    7731489232,
    8204224274
] # Replace with your list of IDs
MESSAGE = ("🚀 *Большое обновление от Kolodin Game Corporation!* 🚀\n\n"
           "Друзья, наша игра прошла через долгий процесс разработки, и мы готовы представить свежий патч:\n\n"
           "🛒 *Внутриигровой магазин* — теперь вы можете просматривать доступные товары. Покупайте новинки за заработанные очки!\n"
           "📊 *Детальный профиль* — добавлена подробная статистика вашего аккаунта.\n"
           "⚙️ *Стабильность* — мы полностью перешли на работу с базой данных, всё летит!\n\n"
           "⚠️ *Важное уточнение:* витрины уже готовы, но сами предметы сейчас находятся в «цеху» на финальной полировке. Копите очки, они вам скоро очень пригодятся!\n\n"
           "Будьте на чеку и ждите финального обновления с контентом. Удачной игры! 🎮\n\n"
           "⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯\n"
           "©2026 *Kolodin Game Corporation*")

async def broadcast_message():
    bot = Bot(token=TOKEN)
    
    for user_id in USER_IDS:
        try:
            await bot.send_message(chat_id=user_id, text=MESSAGE)
            print(f"Successfully sent to {user_id}")
            
            # Flood control: Telegram limits broadcasts to ~30 messages per second
            await asyncio.sleep(0.05) 
            
        except TelegramError as e:
            print(f"Failed to send to {user_id}: {e}")

if __name__ == "__main__":
    asyncio.run(broadcast_message())
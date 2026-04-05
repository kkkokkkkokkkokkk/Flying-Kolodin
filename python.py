import asyncio
from telegram import Bot
from telegram.error import TelegramError

TOKEN = '8632388056:AAFltKzfIfNA3YoGpF26Sf4PTAaH6EzmuRs'
USER_IDS = [7460546102, 7258895996, 7731489232, 1237015816] # Replace with your list of IDs
MESSAGE = "И СНОВА РЕБЯТКИ НОВОЕ КРУПНОЕ ОБНОВЛЕНИЕ! ДОБАВЛЕН ЛИДЕРБОРД КОТОРЫЙ РАБОТАЕТ ТЕПЕРЬ ВО ИСТИНУ ИГРАЙТЕ, ПОБЕЖДАЙТЕ, И ВЫХОДИТЕ В ТОП!!! (Мы ценим анонимность по этому ваши юзернеймы скрыты <3)"

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
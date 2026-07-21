const TelegramBot = require("node-telegram-bot-api").default;
const cron = require("node-cron");

const TOKEN = process.env.BOT_TOKEN;
const bot = new TelegramBot(TOKEN, { polling: true });

const chatId = -1003980529867;


function scheduleRandomNotification() {

    const randomHour = Math.floor(Math.random() * 2) + 11;
    const randomMinute = Math.floor(Math.random() * 60);

    console.log(
        `Notifica programmata per oggi alle ${randomHour}:${String(randomMinute).padStart(2,'0')}`
    );

    cron.schedule(`${randomMinute} ${randomHour} * * *`, () => {

        bot.sendMessage(
            chatId,
            "📸 BeReal Time!\n\nAvete 2 minuti per mandare la foto!"
        );

        scheduleRandomNotification();

    });

}

scheduleRandomNotification();

console.log("Bot avviato.");

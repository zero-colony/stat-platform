import { Bot } from "grammy";
import "dotenv/config";
import fs from "fs";

export const bot = new Bot(process.env.BOT_TOKEN!);
const adminChatId = process.env.CHAT_ID!;

export const sendDailyTrades = () => {
  // read daily-trades.json
  const dailyTrades = JSON.parse(fs.readFileSync("daily-trades.json", "utf8"));
  // send message to admin chat
  bot.api.sendMessage(
    adminChatId,
    `Daily trades: ${JSON.stringify(dailyTrades)}`
  );
  // Reset daily trades
  fs.writeFileSync(
    "daily-trades.json",
    JSON.stringify({ buys: 0, sells: 0 }, null, 2)
  );
};

import "dotenv/config";
import { processTrades } from "./trades";
import cron from "node-cron";
import { sendDailyTrades } from "./bot";

import fs from "fs";

// Initialize daily trades file if not exists
if (!fs.existsSync("daily-trades.json")) {
  fs.writeFileSync("daily-trades.json", JSON.stringify({ buys: 0, sells: 0 }));
}

// Initialize last transaction file if not exists
if (!fs.existsSync("last-tx.txt")) {
  fs.writeFileSync("last-tx.txt", "");
}

// Run every 10 minutes
cron.schedule("*/10 * * * *", processTrades);

// Start initial processing
processTrades();

// Schedule daily report at midnight (00:00)
cron.schedule("0 0 * * *", sendDailyTrades, {
  timezone: "UTC",
});

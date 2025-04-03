import axios from "axios";
import fs from "fs";

interface Trade {
  type: string;
  attributes: {
    block_timestamp: string;
    kind: "buy" | "sell";
    volume_in_usd: string;
  };
}

interface DailyTrades {
  buys: number;
  sells: number;
}

const TRADES_API =
  "https://api.geckoterminal.com/api/v2/networks/zero-network/pools/0x6911d086ce4056f8811ace85075927a085289698/trades?token=quote";
const DAILY_TRADES_FILE = "daily-trades.json";
const LAST_TX_FILE = "last-tx.txt";

function isToday(timestamp: string): boolean {
  const txDate = new Date(timestamp);
  const now = new Date();

  return (
    txDate.getUTCFullYear() === now.getUTCFullYear() &&
    txDate.getUTCMonth() === now.getUTCMonth() &&
    txDate.getUTCDate() === now.getUTCDate()
  );
}

async function fetchTrades(): Promise<Trade[]> {
  try {
    const response = await axios.get(TRADES_API);
    const trades = response.data.data as Trade[];
    // Filter only today's trades
    return trades.filter((trade) => isToday(trade.attributes.block_timestamp));
  } catch (error) {
    console.error("Error fetching trades:", error);
    return [];
  }
}

function readLastProcessedTime(): string {
  try {
    const lastTime = fs.readFileSync(LAST_TX_FILE, "utf8").trim();
    // If last processed time is from a previous day, reset it
    if (!isToday(lastTime)) {
      const startOfToday = new Date();
      startOfToday.setUTCHours(0, 0, 0, 0);
      return startOfToday.toISOString();
    }
    return lastTime;
  } catch {
    const startOfToday = new Date();
    startOfToday.setUTCHours(0, 0, 0, 0);
    return startOfToday.toISOString();
  }
}

function readDailyTrades(): DailyTrades {
  try {
    return JSON.parse(fs.readFileSync(DAILY_TRADES_FILE, "utf8"));
  } catch {
    return { buys: 0, sells: 0 };
  }
}

function saveDailyTrades(trades: DailyTrades) {
  fs.writeFileSync(DAILY_TRADES_FILE, JSON.stringify(trades, null, 2));
}

function saveLastProcessedTime(time: string) {
  fs.writeFileSync(LAST_TX_FILE, time);
}

export async function processTrades() {
  console.log("Processing trades");
  const trades = await fetchTrades();

  console.log("Today's trades fetched:", trades.length);
  if (!trades.length) return;

  const lastProcessedTime = readLastProcessedTime();
  const dailyTrades = readDailyTrades();
  let newLastProcessedTime = lastProcessedTime;

  let i = 0;
  for (const trade of trades) {
    console.log(i++);
    const tradeTime = trade.attributes.block_timestamp;

    // Stop if we've reached already processed transactions
    if (tradeTime <= lastProcessedTime) {
      console.log("Reached already processed transactions");
      break;
    }

    // Update the most recent trade time
    if (tradeTime > newLastProcessedTime) {
      newLastProcessedTime = tradeTime;
    }

    // Update daily totals
    const volume = parseFloat(trade.attributes.volume_in_usd);
    if (trade.attributes.kind === "buy") {
      dailyTrades.buys += volume;
    } else if (trade.attributes.kind === "sell") {
      dailyTrades.sells += volume;
    }
  }

  // Save updated data
  saveDailyTrades(dailyTrades);
  saveLastProcessedTime(newLastProcessedTime);
}

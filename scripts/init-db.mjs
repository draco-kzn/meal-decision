import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

function loadDatabaseUrl() {
  const envPath = path.join(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) {
    return "file:./prisma/dev.db";
  }

  const contents = fs.readFileSync(envPath, "utf8");
  const line = contents
    .split(/\r?\n/)
    .find((entry) => entry.trim().startsWith("DATABASE_URL="));

  if (!line) {
    return "file:./prisma/dev.db";
  }

  return line.replace("DATABASE_URL=", "").trim().replace(/^"|"$/g, "");
}

function resolveDbPath(databaseUrl) {
  if (!databaseUrl.startsWith("file:")) {
    throw new Error(`Unsupported DATABASE_URL: ${databaseUrl}`);
  }

  const filePath = databaseUrl.replace("file:", "");
  if (path.isAbsolute(filePath)) {
    return filePath;
  }

  return path.resolve(process.cwd(), "prisma", filePath);
}

const databaseUrl = loadDatabaseUrl();
const dbPath = resolveDbPath(databaseUrl);

fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new DatabaseSync(dbPath);

db.exec(`
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nickname" TEXT NOT NULL,
    "heightCm" INTEGER NOT NULL,
    "weightKg" REAL NOT NULL,
    "targetWeightKg" REAL,
    "dietPreferences" TEXT NOT NULL,
    "restrictions" TEXT NOT NULL,
    "budgetLevel" TEXT NOT NULL,
    "toneStyle" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS "Goal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "goalType" TEXT NOT NULL,
    "targetDate" DATETIME NOT NULL,
    "intensity" TEXT NOT NULL,
    "notes" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Goal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  );

  CREATE TABLE IF NOT EXISTS "Location" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "addressText" TEXT NOT NULL,
    "sceneTags" TEXT NOT NULL,
    "appearanceWindows" TEXT NOT NULL,
    "walkRadiusM" INTEGER NOT NULL,
    "notes" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Location_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  );

  CREATE TABLE IF NOT EXISTS "Restaurant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "locationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cuisine" TEXT NOT NULL,
    "avgPrice" REAL NOT NULL,
    "openHours" TEXT NOT NULL,
    "walkMinutes" INTEGER NOT NULL,
    "healthyScore" INTEGER NOT NULL,
    "satietyScore" INTEGER NOT NULL,
    "riskTags" TEXT NOT NULL,
    "recommendedOrders" TEXT NOT NULL,
    "avoidOrders" TEXT NOT NULL,
    "notes" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Restaurant_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  );

  CREATE TABLE IF NOT EXISTS "DailyContext" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "mood" TEXT NOT NULL,
    "disciplineLevel" TEXT NOT NULL,
    "socialPlan" TEXT NOT NULL,
    "currentLocationId" TEXT,
    "weightToday" REAL,
    "stepsToday" INTEGER,
    "sleepHours" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DailyContext_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DailyContext_currentLocationId_fkey" FOREIGN KEY ("currentLocationId") REFERENCES "Location" ("id") ON DELETE SET NULL ON UPDATE CASCADE
  );

  CREATE TABLE IF NOT EXISTS "DailyRecommendation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "mealType" TEXT NOT NULL,
    "strategyType" TEXT NOT NULL,
    "restaurantId" TEXT,
    "recommendedOrder" TEXT NOT NULL,
    "fallbackOption" TEXT NOT NULL,
    "rationale" TEXT NOT NULL,
    "narrativeLine" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DailyRecommendation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DailyRecommendation_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant" ("id") ON DELETE SET NULL ON UPDATE CASCADE
  );

  CREATE TABLE IF NOT EXISTS "DailyFeedback" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "restaurantId" TEXT,
    "adherenceLevel" TEXT NOT NULL,
    "notes" TEXT NOT NULL,
    "imageUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DailyFeedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DailyFeedback_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant" ("id") ON DELETE SET NULL ON UPDATE CASCADE
  );

  CREATE INDEX IF NOT EXISTS "Goal_userId_idx" ON "Goal"("userId");
  CREATE INDEX IF NOT EXISTS "Location_userId_idx" ON "Location"("userId");
  CREATE INDEX IF NOT EXISTS "Restaurant_locationId_idx" ON "Restaurant"("locationId");
  CREATE INDEX IF NOT EXISTS "DailyFeedback_userId_idx" ON "DailyFeedback"("userId");
  CREATE UNIQUE INDEX IF NOT EXISTS "DailyContext_userId_date_key" ON "DailyContext"("userId", "date");
  CREATE UNIQUE INDEX IF NOT EXISTS "DailyRecommendation_userId_date_mealType_key" ON "DailyRecommendation"("userId", "date", "mealType");
`);

db.close();

console.log(`SQLite schema initialized at ${dbPath}`);

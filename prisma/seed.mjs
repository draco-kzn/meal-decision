import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.dailyFeedback.deleteMany();
  await prisma.dailyRecommendation.deleteMany();
  await prisma.dailyContext.deleteMany();
  await prisma.restaurant.deleteMany();
  await prisma.location.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.user.deleteMany();

  const user = await prisma.user.create({
    data: {
      nickname: "Zeyu",
      heightCm: 172,
      weightKg: 69.5,
      targetWeightKg: 65,
      dietPreferences: "高蛋白、工作日午餐清爽，周末允许一点奖励感",
      restrictions: "乳糖不耐受，尽量少冰饮",
      budgetLevel: "mid",
      toneStyle: "温柔型"
    }
  });

  const goal = await prisma.goal.create({
    data: {
      userId: user.id,
      title: "五一前减脂并稳定午餐节奏",
      goalType: "减脂",
      targetDate: new Date("2026-05-01"),
      intensity: "中等",
      notes: "优先规律吃饭，不走极端节食。"
    }
  });

  const office = await prisma.location.create({
    data: {
      userId: user.id,
      name: "公司",
      addressText: "静安区写字楼商圈",
      sceneTags: "工作日午餐,加班晚餐",
      appearanceWindows: "周一到周五 11:30-14:00 / 18:30-21:00",
      walkRadiusM: 800,
      notes: "中午不想排队太久，优先步行 10 分钟内。"
    }
  });

  const home = await prisma.location.create({
    data: {
      userId: user.id,
      name: "家",
      addressText: "徐汇区社区生活圈",
      sceneTags: "晚餐,周末,恢复日",
      appearanceWindows: "工作日晚 19:00 后 / 周末全天",
      walkRadiusM: 1200,
      notes: "晚餐更看重恢复和舒适度。"
    }
  });

  const restaurants = await prisma.$transaction([
    prisma.restaurant.create({
      data: {
        locationId: office.id,
        name: "谷仓能量碗",
        cuisine: "轻食",
        avgPrice: 32,
        openHours: "10:30-20:00",
        walkMinutes: 7,
        healthyScore: 88,
        satietyScore: 72,
        riskTags: "容易吃不饱,酱料热量",
        recommendedOrders: "鸡腿肉藜麦能量碗，酱料减半",
        avoidOrders: "双倍脆片和高糖饮料",
        notes: "适合工作日中午的稳妥方案。",
        source: "manual-seed"
      }
    }),
    prisma.restaurant.create({
      data: {
        locationId: office.id,
        name: "一碗乌冬",
        cuisine: "日式面食",
        avgPrice: 28,
        openHours: "11:00-21:30",
        walkMinutes: 5,
        healthyScore: 68,
        satietyScore: 84,
        riskTags: "汤底偏咸,加炸物容易超标",
        recommendedOrders: "番茄肥牛乌冬，少喝汤",
        avoidOrders: "炸鸡乌冬双拼",
        notes: "心情差时有安慰感，但还能控制住。",
        source: "manual-seed"
      }
    }),
    prisma.restaurant.create({
      data: {
        locationId: home.id,
        name: "山野粥铺",
        cuisine: "粥品",
        avgPrice: 22,
        openHours: "06:00-23:30",
        walkMinutes: 9,
        healthyScore: 79,
        satietyScore: 65,
        riskTags: "容易饿得快",
        recommendedOrders: "皮蛋瘦肉粥配清炒时蔬",
        avoidOrders: "油条双拼",
        notes: "恢复日和晚归时很稳。",
        source: "manual-seed"
      }
    }),
    prisma.restaurant.create({
      data: {
        locationId: home.id,
        name: "炉边烤物",
        cuisine: "韩式炸鸡",
        avgPrice: 58,
        openHours: "11:30-01:00",
        walkMinutes: 12,
        healthyScore: 35,
        satietyScore: 91,
        riskTags: "高油高盐,容易过量",
        recommendedOrders: "半份原味炸鸡配气泡水",
        avoidOrders: "双拼炸鸡加芝士年糕",
        notes: "只适合允许放松日。",
        source: "manual-seed"
      }
    })
  ]);

  await prisma.dailyContext.create({
    data: {
      userId: user.id,
      date: new Date("2026-03-17"),
      mood: "一般偏累",
      disciplineLevel: "中",
      socialPlan: "今晚无社交",
      currentLocationId: office.id,
      weightToday: 69.7,
      stepsToday: 2400,
      sleepHours: 6.2
    }
  });

  await prisma.dailyRecommendation.create({
    data: {
      userId: user.id,
      date: new Date("2026-03-17"),
      mealType: "lunch",
      strategyType: "BALANCED",
      restaurantId: restaurants[0].id,
      recommendedOrder: "鸡腿肉藜麦能量碗，酱料减半，补一份热汤",
      fallbackOption: "番茄肥牛乌冬，少喝汤不加炸物",
      rationale: "距离目标日还有一定空间，但今天睡眠一般、工作强度不低，午餐更适合稳定发挥而不是赌意志力。",
      narrativeLine: "今天别跟自己硬碰硬，吃得稳，下午状态会更值钱。"
    }
  });

  await prisma.dailyFeedback.create({
    data: {
      userId: user.id,
      date: new Date("2026-03-16"),
      restaurantId: restaurants[2].id,
      adherenceLevel: "高",
      notes: "晚饭吃得很稳，睡前没有明显负担感。",
      imageUrl: ""
    }
  });

  console.log(`Seeded user ${user.nickname}, goal ${goal.title}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

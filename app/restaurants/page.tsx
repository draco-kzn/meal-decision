import Link from "next/link";

import { PageIntro } from "@/components/page-intro";
import { deleteRestaurant, saveRestaurant } from "@/lib/actions";
import { getBootstrapData } from "@/lib/data";

type RestaurantsPageProps = {
  searchParams?: Promise<{ locationId?: string }>;
};

export default async function RestaurantsPage({ searchParams }: RestaurantsPageProps) {
  const params = (await searchParams) ?? {};
  const activeLocationId = params.locationId ?? "all";
  const { locations, restaurants } = await getBootstrapData();
  const filteredRestaurants =
    activeLocationId === "all"
      ? restaurants
      : restaurants.filter((restaurant) => restaurant.locationId === activeLocationId);

  return (
    <div className="space-y-4">
      <PageIntro
        eyebrow="Restaurant Library"
        title="按地点维护可执行的餐厅知识。"
        description="第一版不接地图 API，直接维护静态知识库。重点是每个餐厅都要有健康度、饱腹度、风险标签和推荐点法。"
      />

      <section className="glass-card rounded-[28px] p-5">
        <div className="flex flex-wrap gap-3">
          <Link href="/restaurants" className={activeLocationId === "all" ? "action-btn-primary" : "action-btn-secondary"}>
            全部地点
          </Link>
          {locations.map((location) => (
            <Link
              key={location.id}
              href={`/restaurants?locationId=${location.id}`}
              className={activeLocationId === location.id ? "action-btn-primary" : "action-btn-secondary"}
            >
              {location.name}
            </Link>
          ))}
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="grid gap-4">
          {filteredRestaurants.map((restaurant) => (
            <div key={restaurant.id} className="glass-card rounded-[28px] p-5">
              <form action={saveRestaurant} className="grid gap-4 lg:grid-cols-2">
                <input type="hidden" name="id" defaultValue={restaurant.id} />
                <label className="field">
                  <span className="field-label">餐厅名称</span>
                  <input className="field-input" name="name" defaultValue={restaurant.name} required />
                </label>
                <label className="field">
                  <span className="field-label">所属地点</span>
                  <select className="field-select" name="locationId" defaultValue={restaurant.locationId}>
                    {locations.map((location) => (
                      <option key={location.id} value={location.id}>
                        {location.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span className="field-label">菜系</span>
                  <input className="field-input" name="cuisine" defaultValue={restaurant.cuisine} required />
                </label>
                <label className="field">
                  <span className="field-label">人均价格</span>
                  <input className="field-input" type="number" step="0.1" name="avgPrice" defaultValue={restaurant.avgPrice} required />
                </label>
                <label className="field">
                  <span className="field-label">营业时间</span>
                  <input className="field-input" name="openHours" defaultValue={restaurant.openHours} required />
                </label>
                <label className="field">
                  <span className="field-label">步行分钟数</span>
                  <input className="field-input" type="number" name="walkMinutes" defaultValue={restaurant.walkMinutes} required />
                </label>
                <label className="field">
                  <span className="field-label">healthyScore</span>
                  <input className="field-input" type="number" name="healthyScore" defaultValue={restaurant.healthyScore} required />
                </label>
                <label className="field">
                  <span className="field-label">satietyScore</span>
                  <input className="field-input" type="number" name="satietyScore" defaultValue={restaurant.satietyScore} required />
                </label>
                <label className="field lg:col-span-2">
                  <span className="field-label">riskTags</span>
                  <input className="field-input" name="riskTags" defaultValue={restaurant.riskTags} />
                </label>
                <label className="field lg:col-span-2">
                  <span className="field-label">recommendedOrders</span>
                  <textarea className="field-textarea min-h-24" name="recommendedOrders" defaultValue={restaurant.recommendedOrders} />
                </label>
                <label className="field lg:col-span-2">
                  <span className="field-label">avoidOrders</span>
                  <textarea className="field-textarea min-h-24" name="avoidOrders" defaultValue={restaurant.avoidOrders} />
                </label>
                <label className="field">
                  <span className="field-label">notes</span>
                  <textarea className="field-textarea min-h-24" name="notes" defaultValue={restaurant.notes} />
                </label>
                <label className="field">
                  <span className="field-label">source</span>
                  <input className="field-input" name="source" defaultValue={restaurant.source} />
                </label>
                <div className="lg:col-span-2 flex justify-end">
                  <button className="action-btn-secondary" type="submit">
                    更新餐厅
                  </button>
                </div>
              </form>
              <form action={deleteRestaurant} className="mt-3 flex justify-end">
                <input type="hidden" name="id" value={restaurant.id} />
                <button className="action-btn-secondary border-red-200 text-red-700 hover:bg-red-50" type="submit">
                  删除
                </button>
              </form>
            </div>
          ))}
        </section>

        <form action={saveRestaurant} className="glass-card grid gap-4 rounded-[30px] p-6">
          <p className="eyebrow">New Restaurant</p>
          <h3 className="font-display text-3xl leading-none">新增餐厅</h3>
          <label className="field">
            <span className="field-label">所属地点</span>
            <select className="field-select" name="locationId" required defaultValue={locations[0]?.id}>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          </label>
          {[
            ["name", "餐厅名称"],
            ["cuisine", "菜系"],
            ["avgPrice", "人均价格"],
            ["openHours", "营业时间"],
            ["walkMinutes", "步行分钟数"],
            ["healthyScore", "healthyScore"],
            ["satietyScore", "satietyScore"],
            ["riskTags", "riskTags"],
            ["source", "source"]
          ].map(([name, label]) => (
            <label key={name} className="field">
              <span className="field-label">{label}</span>
              <input
                className="field-input"
                name={name}
                type={["avgPrice", "walkMinutes", "healthyScore", "satietyScore"].includes(name) ? "number" : "text"}
                required={name !== "riskTags" && name !== "source"}
              />
            </label>
          ))}
          <label className="field">
            <span className="field-label">recommendedOrders</span>
            <textarea className="field-textarea min-h-24" name="recommendedOrders" />
          </label>
          <label className="field">
            <span className="field-label">avoidOrders</span>
            <textarea className="field-textarea min-h-24" name="avoidOrders" />
          </label>
          <label className="field">
            <span className="field-label">notes</span>
            <textarea className="field-textarea min-h-24" name="notes" />
          </label>
          <button className="action-btn-primary" type="submit">
            创建餐厅
          </button>
        </form>
      </div>
    </div>
  );
}

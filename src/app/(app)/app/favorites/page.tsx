import type { Metadata } from "next";
import Link from "next/link";
import { Heart } from "lucide-react";
import { requireUser } from "@/lib/auth/guard";
import { listFavoritePractices } from "@/lib/data/favorites";
import { getSubscription } from "@/lib/data/subscriptions";
import { canAccessPlan } from "@/lib/access";
import { PracticeCard } from "@/components/cards/cards";
import { Eyebrow, EmptyState } from "@/components/ui/primitives";
import { buttonClass } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Избранное",
  robots: { index: false, follow: false },
};

export default async function FavoritesPage() {
  const user = await requireUser("/app/favorites");
  const subscription = getSubscription(user.id);
  const favorites = listFavoritePractices(user.id);

  return (
    <div>
      <header>
        <Eyebrow>Сохранённое</Eyebrow>
        <h1 className="display-2 mt-2 text-[clamp(1.9rem,1.5rem+1.6vw,2.6rem)]">Избранное</h1>
        <p className="mt-1.5 text-[13.5px] text-muted">
          {favorites.length > 0
            ? `${favorites.length} практик сохранено. Синхронизируется между устройствами.`
            : "Сохраняйте практики, чтобы вернуться к ним позже."}
        </p>
      </header>

      {favorites.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={<Heart className="h-5 w-5" />}
            title="В избранном пока пусто"
            description="Нажмите на сердечко в карточке практики — она появится здесь и будет доступна с любого устройства."
            action={
              <Link href="/app/practice" className={buttonClass("primary")}>
                Открыть библиотеку
              </Link>
            }
          />
        </div>
      ) : (
        <div className="mt-8 grid gap-x-5 gap-y-9 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {favorites.map((practice, index) => (
            <PracticeCard
              key={practice.id}
              practice={practice}
              index={index}
              locked={!canAccessPlan(subscription, practice.requiredPlan)}
              href={`/app/practice/${practice.id}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

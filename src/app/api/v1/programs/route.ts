import { ok } from "@/lib/api";
import { listPrograms } from "@/lib/data/programs";

export async function GET() {
  return ok({ programs: listPrograms({ limit: 50 }) });
}

export const dynamic = "force-dynamic";

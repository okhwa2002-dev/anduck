import { redirect } from "next/navigation";
import { FacilityKind } from "@anduck/types";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string }>;
}) {
  const { kind } = await searchParams;

  if (kind === FacilityKind.NEARBY) {
    redirect("/enjoy/tourism");
  }

  redirect("/enjoy/facilities");
}

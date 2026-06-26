import { ReservationEditPage } from "@/view/admin/reservations/EditPage";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ReservationEditPage id={id} />;
}

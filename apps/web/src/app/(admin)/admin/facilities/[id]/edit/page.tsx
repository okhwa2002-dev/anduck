import { FacilityFormPage } from "@/view/admin/facilities/FormPage";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <FacilityFormPage id={id} />;
}

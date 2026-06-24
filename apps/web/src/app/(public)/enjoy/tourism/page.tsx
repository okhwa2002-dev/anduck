import { FacilityKind } from "@anduck/types";
import { getFacilities } from "@/api/facilities";
import { getPublicMenus } from "@/api/menu";
import { FacilitiesPage } from "@/view/facilities/IndexPage";

export default async function Page() {
  const menus = await getPublicMenus();
  const data = await getFacilities(FacilityKind.NEARBY);

  return <FacilitiesPage data={data} kind={FacilityKind.NEARBY} menus={menus} />;
}

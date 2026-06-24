import { getPublicMenus } from "@/api/menu";
import { PublicHeaderClient } from "./PublicHeaderClient";

export async function Header() {
  const menus = await getPublicMenus();
  return <PublicHeaderClient menus={menus} />;
}

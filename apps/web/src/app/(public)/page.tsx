import { getHomeData } from "@/api/home";
import { IndexPage } from "@/view/home/IndexPage";

export default async function Page() {
  const data = await getHomeData();
  return <IndexPage data={data} />;
}

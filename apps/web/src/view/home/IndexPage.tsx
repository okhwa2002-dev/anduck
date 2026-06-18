import { BannerSection } from "@/components/public/home/BannerSection";
import { ProgramsSection } from "@/components/public/home/ProgramsSection";
import { AccommodationsSection } from "@/components/public/home/AccommodationsSection";
import { NoticesSection } from "@/components/public/home/NoticesSection";
import type { HomeData } from "@/api/home";

export function IndexPage({ data }: { data: HomeData }) {
  return (
    <>
      <BannerSection banners={data.banners} />
      <ProgramsSection programs={data.featuredPrograms} />
      <AccommodationsSection accommodations={data.featuredAccommodations} />
      <NoticesSection notices={data.latestNotices} />
    </>
  );
}

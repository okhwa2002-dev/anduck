import Link from "next/link";
import type { Notice } from "@anduck/types";

export function NoticesSection({ notices }: { notices: Notice[] }) {
  if (!notices.length) return null;

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <h2 className="mb-8 text-center text-2xl font-bold text-gray-800">
          공지사항
        </h2>
        <ul className="divide-y rounded-xl border bg-white">
          {notices.map((notice) => (
            <li key={notice.id}>
              <Link
                href={`/notices/${notice.id}`}
                className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-gray-50"
              >
                <span className="text-sm font-medium text-gray-800">
                  {notice.title}
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(notice.createdAt).toLocaleDateString("ko-KR")}
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-4 text-right">
          <Link href="/notices" className="text-sm text-green-700 hover:underline">
            전체 보기 →
          </Link>
        </div>
      </div>
    </section>
  );
}

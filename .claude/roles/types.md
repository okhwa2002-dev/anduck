# 타입 규칙 — @anduck/types

## 위치 및 빌드

- 소스: `packages/types/src/`
- 빌드 출력: `packages/types/dist/`
- API는 `dist/*.d.ts`를 참조하므로 **타입 수정 후 반드시 빌드 먼저 실행**

```bash
pnpm --filter @anduck/types build   # 빌드
pnpm --filter @anduck/api typecheck # 이후 타입체크
```

---

## 주요 공통 타입

```typescript
type YN = "Y" | "N"           // DB CHAR(1) Y/N 컬럼
type ISODate = string          // YYYY-MM-DD

interface Timestamps {
  createdAt: string;
  updatedAt: string;
}

interface Sortable {
  sortOrder: number;
}

interface Address {
  road: string;
  detail?: string;
  zipCode?: string;
}

interface GeoPoint {
  latitude: number;
  longitude: number;
}

interface ImageRef {
  id: string;
  url: string;
  // ...
}

interface ListQuery {
  useYn?: YN;
  q?: string;
  page?: number;
  limit?: number;
  all?: boolean;
  featuredYn?: YN;
}
```

---

## 파일 구조

```
packages/types/src/
  common.ts        — YN, ISODate, Timestamps, Sortable, Address, GeoPoint, ImageRef, ListQuery
  auth.ts          — User, PushToken, JwtPayload 관련
  accommodation.ts — Accommodation, Room, SeasonRate + Input 타입
  content.ts       — Notice, GalleryItem, Facility, Banner, VillageProfile + Input 타입
  menu.ts          — Menu, MenuGroup + Input 타입
  program.ts       — Program, ProgramSession + Input 타입
  reservation.ts   — Reservation, ReservationCancel + Input 타입
  index.ts         — 전체 re-export
```

---

## Y/N 플래그 컬럼별 타입 필드명

| 테이블 | DB 컬럼 | TypeScript 필드 |
|--------|---------|----------------|
| accommodation, banner, facility, gallery_item, menu, program, program_session, push_token, room | `active_yn` | `activeYn: YN` |
| code, code_group, menu_group, permission, season_rate, refund_policy | `use_yn` | `useYn: YN` |
| notice | `open_yn` | `openYn: YN` |

---

## 규칙

- 타입 파일에는 `interface` + `type` 선언만. 로직 없음.
- Input 타입의 Y/N 필드는 optional (`activeYn?: YN`). 서비스에서 기본값 처리.
- `UpdateXxxInput = Partial<CreateXxxInput>` 패턴.
- `id` 필드는 항상 `string` (DB BIGINT → `::text` 캐스트).
- 배열 필드는 선택적이더라도 응답 타입에서 `string[]` (빈 배열 허용), Input에서 `string[]?`.

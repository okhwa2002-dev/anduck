# 멀티 필터 시스템

## 개요

`FilterCondition[]` 구조를 이용해 여러 검색 조건을 하나의 파라미터로 전달하는 범용 필터 시스템.
HTTP 쿼리스트링에는 JSON 문자열로 직렬화해서 전달하고, API 서버에서 파싱 후 SQL로 변환한다.

---

## 타입 정의

`packages/types/src/common.ts`

```ts
export type FilterOp = "eq" | "neq" | "like" | "in";

export interface FilterCondition {
  field: string;       // 필터 대상 필드명 (camelCase)
  op?: FilterOp;       // 연산자 (기본값: "eq")
  value: string | string[];  // 단일값 또는 배열
}

export interface ListQuery extends PaginationQuery {
  q?: string;
  filters?: FilterCondition[] | string;  // 클라이언트: 배열, HTTP전송: JSON문자열
}
```

### FilterOp 종류

| op     | 설명             | SQL 변환 예시                          |
|--------|-----------------|---------------------------------------|
| `eq`   | 단일값 일치       | `col = #{value}`                      |
| `neq`  | 단일값 불일치     | `col != #{value}`                     |
| `like` | 부분 문자열 검색  | `col ILIKE '%' \|\| #{value} \|\| '%'` |
| `in`   | 복수값 중 일치    | `col = ANY(ARRAY['A','B']::text[])`   |

---

## 데이터 흐름

```
[Frontend]                    [HTTP]              [API Server]              [PostgreSQL]
FilterCondition[]  →  JSON.stringify()  →  filters=...  →  parseFilters()  →  SQL
```

### 1. 프론트엔드 → API 직렬화

`packages/api-client/src/endpoints.ts`

```ts
function serializeFilters<T extends { filters?: FilterCondition[] }>(query?: T) {
  if (!query) return undefined;
  const { filters, ...rest } = query;
  return { ...rest, ...(filters?.length ? { filters: JSON.stringify(filters) } : {}) };
}

// 사용 예
admin.facilities.list({ filters: [{ field: "kind", op: "in", value: ["VILLAGE", "NEARBY"] }] });
// → GET /admin/facilities?filters=[{"field":"kind","op":"in","value":["VILLAGE","NEARBY"]}]
```

### 2. API 서버 파싱

`apps/api/src/utils/index.ts`

```ts
// 단일값 추출 (첫 번째 값만)
filterVal(filters, "status")   // → string | null

// 복수값 추출 (배열)
filterVals(filters, "kind")    // → string[] | null
```

### 3. SQL 변환

```ts
// 복수값을 PostgreSQL 텍스트 배열 리터럴로 변환
pgTextArr(["VILLAGE", "NEARBY"])
// → ARRAY['VILLAGE','NEARBY']::text[]
```

---

## SQL 매퍼 패턴

`apps/api/src/mapper/facility.xml`

```xml
<where>
  <if test="activeYns != null">active_yn = ANY(${activeYns})</if>
  <if test="mainOpenYns != null">AND main_open_yn = ANY(${mainOpenYns})</if>
  <if test="kinds != null">AND kind::text = ANY(${kinds})</if>
  <if test="q != null">AND name ILIKE '%' || #{q} || '%'</if>
</where>
```

### 주의사항

- **`${param}`**: raw SQL 치환. `pgTextArr()` 결과처럼 신뢰된 내부 값에만 사용.
- **`#{param}`**: 파라미터 바인딩. 사용자 입력값(q 등)에 사용.
- **PostgreSQL enum 컬럼**: `text[]`와 비교 시 반드시 `::text` 캐스트 필요.
  ```sql
  -- ❌ 오류: operator does not exist: facility_kind = text
  kind = ANY(ARRAY['VILLAGE']::text[])
  
  -- ✅ 정상: enum을 text로 캐스트
  kind::text = ANY(ARRAY['VILLAGE']::text[])
  ```

---

## 서비스 레이어 구현 패턴

`apps/api/src/services/adminService.ts` — `listAdminFacilities`

```ts
const toArr = (field: string, fallback?: string | null) => {
  const vals = utils.filterVals(q.filters, field);
  if (vals) return utils.pgTextArr(vals);
  return fallback ? utils.pgTextArr([fallback]) : null;
};

const params = {
  activeYns:   toArr("activeYn", q.useYn),  // filters 없으면 useYn 폴백
  mainOpenYns: toArr("mainOpenYn"),
  kinds:       toArr("kind"),
  q:           q.q ?? null,
};
```

단일값이 충분한 경우(`listAdminReservations`):

```ts
const params = {
  status: utils.filterVal(q.filters, "status"),
  kind:   utils.filterVal(q.filters, "kind"),
  q:      q.q ?? null,
};
```

---

## 적용 현황

| 엔드포인트               | 지원 필터 필드                              | 다중값 |
|--------------------------|---------------------------------------------|--------|
| `GET /admin/facilities`  | `kind`, `mainOpenYn`, `activeYn`            | ✅     |
| `GET /admin/reservations`| `status`, `kind`                            | ❌ (단일값) |

---

## 프론트엔드 UI 패턴

`apps/web/src/view/admin/facilities/IndexPage.tsx`

```ts
// 필터 옵션 정의
const FILTER_OPTIONS: FilterOption[] = [
  { group: "구분",    field: "kind",       value: "VILLAGE", label: "마을시설" },
  { group: "구분",    field: "kind",       value: "NEARBY",  label: "주변관광지" },
  { group: "메인노출", field: "mainOpenYn", value: "Y",       label: "노출" },
  { group: "메인노출", field: "mainOpenYn", value: "N",       label: "미노출" },
  { group: "활성",    field: "activeYn",   value: "Y",       label: "활성" },
  { group: "활성",    field: "activeYn",   value: "N",       label: "비활성" },
];

// 활성 필터 상태 → FilterCondition[] 변환
type ActiveFilters = Partial<Record<"kind" | "mainOpenYn" | "activeYn", string[]>>;

function buildFilterConditions(f: ActiveFilters): FilterCondition[] | undefined {
  const result: FilterCondition[] = [];
  if (f.kind?.length)       result.push({ field: "kind",       op: "in", value: f.kind });
  if (f.mainOpenYn?.length) result.push({ field: "mainOpenYn", op: "in", value: f.mainOpenYn });
  if (f.activeYn?.length)   result.push({ field: "activeYn",  op: "in", value: f.activeYn });
  return result.length ? result : undefined;
}
```

UI는 `FacilityFilterSelect` 컴포넌트: 드롭다운 버튼 + 그룹별 체크박스 + 선택 건수 배지.

---

## 새 엔티티에 필터 추가하는 방법

1. **XML 매퍼** — 복수형 파라미터명으로 `<if>` 블록 추가
   ```xml
   <if test="statuses != null">AND status = ANY(${statuses})</if>
   ```

2. **서비스** — `filterVals` + `pgTextArr` 조합
   ```ts
   const params = { statuses: utils.filterVals(q.filters, "status") ? utils.pgTextArr(utils.filterVals(q.filters, "status")!) : null };
   ```

3. **API 클라이언트** — 해당 엔드포인트에 `WithFilters<ListQuery>` 타입 적용 + `serializeFilters()` 래핑

4. **프론트엔드** — `FILTER_OPTIONS` 배열에 옵션 추가, `ActiveFilters` 타입에 필드 추가, `buildFilterConditions`에 조건 추가

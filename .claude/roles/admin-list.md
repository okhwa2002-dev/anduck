# Admin List Common Patterns

관리자 업무 화면을 추가하거나 수정할 때 공통으로 적용할 규칙이다.

## 1. 공통코드

업무 화면에서 사용하는 구분값, 상태값, Y/N 값은 하드코딩하지 않고 공통코드에서 가져온다.

### 그룹코드 이름

- 일반 코드: `XX_XX_CD`
- 여부 코드: `XX_YN`
- 너무 긴 업무명은 짧은 약어를 사용한다.
  - 예: `RESERVATION_TYPE_CD` 대신 `RES_TYPE_CD`

현재 사용하는 주요 그룹코드:

- 예약 구분: `RES_TYPE_CD`
- 예약 상태: `RES_STATUS_CD`
- 시설 구분: `FAC_TYPE_CD`
- 노출 여부: `OPEN_YN`
- 활성 여부: `ACTIVE_YN`

### 코드값

- 코드값은 대문자를 사용한다.
- Y/N 값은 `Y`, `N`을 사용한다.

예:

```sql
('OPEN_YN', 'Y', '노출', 1)
('OPEN_YN', 'N', '미노출', 2)
('ACTIVE_YN', 'Y', '활성', 1)
('ACTIVE_YN', 'N', '비활성', 2)
```

### seed 작성

공통코드는 `seed.sql`의 `code_group`, `code`에 함께 추가한다.

```sql
INSERT INTO "code_group" (group_code, group_name, description, sort_order, updated_at) VALUES
  ('SAMPLE_CD', '샘플 구분', '샘플 구분 코드', 1, CURRENT_TIMESTAMP);

INSERT INTO "code" (group_id, code, name, sort_order, updated_at)
SELECT g.id, c.code, c.name, c.sort_order, CURRENT_TIMESTAMP
FROM "code_group" g,
  (VALUES
    ('SAMPLE_CD', 'A', 'A유형', 1),
    ('SAMPLE_CD', 'B', 'B유형', 2)
  ) AS c(group_code, code, name, sort_order)
WHERE g.group_code = c.group_code;
```

## 2. 프론트 공통코드 사용

공통코드는 화면마다 API를 직접 호출하지 않는다. `CommonCodeProvider`가 최초 1회 로드하고, 업무 화면에서는 `useCommonCode`로 꺼내 쓴다.

```ts
const SAMPLE_GROUP = "SAMPLE_CD";
const sampleCode = useCommonCode(SAMPLE_GROUP);
```

목록 컬럼 라벨은 `labelMap`을 사용한다.

```tsx
<Badge>{sampleCode.labelMap[value] ?? value}</Badge>
```

필터 옵션은 `options`를 그대로 전달한다.

```ts
const filterDefinitions = useMemo<FilterDefinition<FilterField>[]>(
  () => [
    {
      label: "구분",
      field: "kind",
      options: sampleCode.options,
    },
  ],
  [sampleCode.options],
);
```

예약관리처럼 업무 화면에서는 다음 형태를 기본으로 한다.

```ts
const RES_TYPE_GROUP = "RES_TYPE_CD";
const RES_STATUS_GROUP = "RES_STATUS_CD";

const resTypeCode = useCommonCode(RES_TYPE_GROUP);
const resStatusCode = useCommonCode(RES_STATUS_GROUP);
```

fallback 옵션과 fallback 라벨은 되도록 업무 화면에 두지 않는다. 코드 데이터가 필요하면 `seed.sql`과 실제 DB를 먼저 맞춘다.

## 3. 공통 필터

업무 화면은 필터 UI를 직접 만들지 않고 `AdminListGrid`에 `filters`만 전달한다.

필터는 기본적으로 체크박스 다중 선택이다. 한 컬럼에서도 여러 값을 동시에 선택할 수 있어야 하므로 `mode`를 생략하면 `multi`로 동작해야 한다. 단일 선택이 명확히 필요한 경우에만 `mode: "single"`을 지정한다.

```ts
type FilterField = "kind" | "status";

const filterDefinitions = useMemo<FilterDefinition<FilterField>[]>(
  () => [
    { label: "구분", field: "kind", options: kindCode.options },
    { label: "상태", field: "status", options: statusCode.options },
  ],
  [kindCode.options, statusCode.options],
);
```

API 요청에는 `buildFilterConditions(list.filters)`를 사용한다.

```ts
filters: buildFilterConditions(list.filters)
```

API 목록 구현에서는 한 컬럼 다중 선택을 처리해야 하므로 `filterVal`이 아니라 `filterVals`를 사용한다. SQL mapper에는 배열 파라미터를 넘기고 `= ANY(${...})`로 비교한다.

```ts
const values = utils.filterVals(q.filters, "status");
const params = {
  statuses: values ? utils.pgTextArr(values) : null,
};
```

```xml
<if test="statuses != null">status::text = ANY(${statuses})</if>
```

## 4. 공통 그리드

관리자 목록 화면은 `AdminListGrid`를 사용한다.

업무 화면에서 넘기는 값:

- `title`
- `result`
- `columns`
- `state`
- `isLoading`
- `error`
- `filters`
- `searchPlaceholder`
- `actions`
- `onRowClick`

`emptyMessage`는 기본값인 `데이터가 없습니다.`를 사용한다.

추가 버튼이나 다운로드 버튼은 업무 화면에서 `Button`, `Plus`, `Download`를 직접 조립하지 않고 `AdminListGrid`의 props로 처리한다.

```tsx
<AdminListGrid
  createPath="/admin/facilities/new"
  onDownload={handleDownload}
/>
```

```tsx
<AdminListGrid
  title="예약 관리"
  result={data}
  columns={columns}
  state={list}
  isLoading={isLoading}
  error={error}
  filters={filterDefinitions}
  searchPlaceholder="예약자명 검색"
  onRowClick={(row) => list.router.push(`/admin/reservations/${row.id}`)}
/>
```

## 5. 목록 상태

페이지, 페이지 크기, 검색어, 필터 상태는 업무 화면에서 직접 구현하지 않고 `useAdminListState`를 사용한다.

```ts
const list = useAdminListState<FilterField>({
  basePath: "/admin/reservations",
  pageSizeOptions: PAGE_SIZE_OPTIONS,
});
```

SWR key에는 목록 상태를 포함한다.

```ts
const { data, error, isLoading } = useSWR(
  ["admin-reservations", list.page, list.pageSize, list.q, list.filters],
  () => adminApi.reservations.list({
    page: list.page,
    pageSize: list.pageSize,
    q: list.q || undefined,
    filters: buildFilterConditions(list.filters),
  }),
);
```

## 6. 상태 배지 스타일

업무 화면에서는 `Badge`를 직접 사용하지 않고 전체 공통 `CodeBadge`를 사용한다. 코드명 표시는 공통코드의 `labelMap`을 넘긴다.

```tsx
<CodeBadge value={status} labels={statusCode.labelMap} />
```

Y/N처럼 반복되는 배지 CSS는 업무 화면에 Tailwind class를 직접 선언하지 않는다. `CodeBadge`의 preset으로 공통 처리한다.

```tsx
<CodeBadge value={openYn} labels={openYnCode.labelMap} preset="openYn" />
<CodeBadge value={activeYn} labels={activeYnCode.labelMap} preset="activeYn" />
```

업무 상태별 배지 스타일이 필요하면 공통코드의 `extra`에 넣고 `extraStringMap`으로 사용한다.

```sql
('RES_STATUS_CD', 'CONFIRMED', '확정', '{"badgeClass":"bg-green-100 text-green-800 hover:bg-green-100"}', 3)
```

```ts
const statusClass = statusCode.extraStringMap("badgeClass");
```

```tsx
<CodeBadge
  value={status}
  labels={statusCode.labelMap}
  classNameByValue={statusClass}
  fallbackVariant="default"
/>
```

## 7. 신규 관리자 목록 화면 체크리스트

- 필요한 코드 그룹을 `seed.sql`에 추가했다.
- 실제 개발 DB에도 같은 공통코드를 반영했다.
- 업무 화면에서 `useCommonCode`를 사용했다.
- 필터는 `FilterDefinition`만 정의했다.
- 목록 상태는 `useAdminListState`를 사용했다.
- 그리드는 `AdminListGrid`를 사용했다.
- 빈 데이터 문구는 기본값을 사용했다.
- `pnpm.cmd --filter @anduck/web typecheck`를 통과했다.

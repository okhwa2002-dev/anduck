# 엑셀 다운로드 시스템

## 엔드포인트 패턴

```
GET /admin/{resource}/export?q=...&filters=...
Authorization: Bearer {access_token}
```

- 조회 파라미터는 목록 API(`GET /admin/{resource}`)와 동일
- 페이징 없이 필터 조건에 맞는 전체 데이터 반환
- 응답: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` (바이너리)

---

## 파일명 규칙

```
{타이틀(공백제거)}_{YYYYMMDDHHmmss}.xlsx
예) 시설목록_20260623143022.xlsx
```

- `Content-Disposition: attachment; filename*=UTF-8''...` 헤더로 전달
- CORS `exposedHeaders`에 `Content-Disposition` 등록 필수 (`app.ts`)

---

## 공통 유틸 (`apps/api/src/utils/excel.ts`)

### `buildExcel(sheetName, columns, rows, options?)`

ExcelJS 기반 xlsx 버퍼 생성.

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| `sheetName` | `string` | 시트명 |
| `columns` | `ExcelColumn[]` | 헤더·키·너비·정렬 정의 |
| `rows` | `Record<string, unknown>[]` | 데이터 행 |
| `options.title` | `string?` | 1행 타이틀 (전체 열 병합) |
| `options.date` | `string?` | 2행 날짜 (전체 열 병합, 우측 정렬) |

**ExcelColumn 필드**

| 필드 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `header` | `string` | - | 컬럼 헤더명 |
| `key` | `string` | - | rows 객체의 키 |
| `width` | `number?` | 16 | 열 너비 |
| `align` | `"left" \| "center" \| "right"?` | `"center"` | 데이터 행 수평 정렬 |

**레이아웃 구조**

```
1행: [          타이틀 (전체 열 병합, bold 14pt, 중앙)         ]  ← 테두리 없음
2행: [                         작성일자 : 2026. 6. 23. (병합, 우측) ]  ← 테두리 없음
3행: [헤더1] [헤더2] ... (bold, 중앙, 회색 배경 #E9E9E9, 실선)
4행: [data]  [data]  ... (실선, align 적용)
```

- 실선 테두리는 헤더행과 데이터행에만 적용
- 데이터 정렬 기본값: 가운데 / 예외 컬럼은 `align: "left"` 지정

### `sendExcelReply(reply, buffer, title)`

컨트롤러에서 xlsx 바이너리 응답 전송.

```typescript
import { sendExcelReply } from "../utils/excel";

async exportXxx(req, reply) {
  const { buffer, title } = await adminService.exportAdminXxx(req.query);
  sendExcelReply(reply, buffer, title);
}
```

---

## 서비스 레이어 패턴

```typescript
async exportAdminXxx(q: types.ListQuery) {
  // 1. 필터 파라미터 구성 (listAdminXxx 와 동일)
  const params = { ... };

  // 2. 전체 조회 (페이징 없음)
  const rows = await db.query("xxx", "listXxx", {
    ...params,
    limitOffset: utils.limitOffsetSQL({ all: true }),  // "" 반환 → LIMIT/OFFSET 없음
  });

  // 3. 데이터 매핑 (표시용 문자열로 변환)
  const data = rows.map(r => ({ ... }));

  // 4. Excel 생성
  const title = "XXX 목록";
  const today = `작성일자 : ${new Date().toLocaleDateString("ko-KR")}`;
  const buffer = await buildExcel(title, [
    { header: "컬럼명", key: "key", width: 20 },
    { header: "내용",   key: "desc", width: 40, align: "left" },
  ], data, { title, date: today });

  return { buffer, title };  // title은 파일명 생성에 사용됨
}
```

**`title` 단일 관리 원칙**: `title` 변수 하나가 Excel 타이틀(1행)과 파일명 접두사를 동시에 결정.

---

## 라우트 등록 주의사항

`GET /admin/{resource}/export`는 반드시 `GET /admin/{resource}/:id` **앞에** 등록.

```typescript
// ✅ 올바른 순서
app.get("/admin/facilities/export", ..., adminController.exportFacilities);
app.get("/admin/facilities/:id",    ..., adminController.getFacility);
```

---

## 프론트엔드 패턴

### api-client (`packages/api-client/src/endpoints.ts`)

```typescript
export: (query?: WithFilters<ListQuery>) =>
  http
    .get<ArrayBuffer>("/admin/xxx/export", {
      params: serializeFilters(query),
      responseType: "arraybuffer",
    })
    .then((r) => {
      const disposition = r.headers["content-disposition"] as string | undefined;
      const match = disposition?.match(/filename\*=UTF-8''(.+)/);
      const filename = match ? decodeURIComponent(match[1]) : "download.xlsx";
      return { data: r.data, filename };
    }),
```

### IndexPage 다운로드 핸들러

```typescript
import { downloadExcel } from "@/lib/download";

async function handleDownload() {
  const { data, filename } = await adminApi.xxx.export({
    q: q || undefined,
    filters: buildFilterConditions(filters),
  });
  downloadExcel(data, filename);
}
```

`downloadExcel` (`apps/web/src/lib/download.ts`) — ArrayBuffer → Blob → 파일 저장 트리거.

---

## 새 엔티티에 엑셀 다운로드 추가하는 방법

1. **서비스**: `exportAdminXxx(q)` 메서드 추가 → `{ buffer, title }` 반환
2. **컨트롤러**: `exportXxx(req, reply)` 핸들러 추가 → `sendExcelReply(reply, buffer, title)`
3. **라우트**: `GET /admin/xxx/export` 등록 (`:id` 경로 **앞에**)
4. **api-client**: `admin.xxx.export()` 메서드 추가 (`responseType: "arraybuffer"`)
5. **IndexPage**: `handleDownload`에서 `downloadExcel(data, filename)` 호출

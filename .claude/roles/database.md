# DB 규칙 — PostgreSQL / mybatis-mapper

## SQL 매퍼 (XML)

### 파일 위치 및 호출

```
apps/api/src/mapper/<name>.xml  →  namespace = 파일명
```

```typescript
db.query("program", "listPrograms", params)   // 다건
db.queryOne("program", "getProgram", params)  // 단건
db.execute("program", "deleteProgram", params) // 반환 없음
```

### 파라미터 문법

| 문법 | 용도 | 예시 |
|------|------|------|
| `#{param}` | 안전한 값 치환 (자동 escape) | 문자열, 숫자, 날짜 |
| `${param}` | 원시 SQL 삽입 | `pgId()` 결과, `pgBigintArr()` 배열, NULL |

```xml
WHERE id = ${id}                   -- pgId() → 정수 또는 NULL (raw)
AND name = #{name}                 -- 자동 escape
AND ids = ANY(${imageIds})         -- pgBigintArr() → ARRAY[1,2,3]::bigint[]
```

### BIGINT → string 캐스트 필수

```sql
SELECT id::text AS id,
       user_id::text AS "userId",
       accommodation_id::text AS "accommodationId"
```

BIGINT 컬럼은 반드시 `::text` 캐스트. pg 드라이버가 큰 정수를 손실 없이 string으로 반환.

### camelCase 별칭 필수

```sql
active_yn       AS "activeYn",
created_at      AS "createdAt",
main_image_id   AS "mainImageId",
applicant_name  AS "applicantName"
```

snake_case 컬럼명은 항상 camelCase로 별칭 지정. 별칭 없으면 mappers에서 접근 불가.

### 동적 SQL

```xml
<where>
  <if test="activeYn != null">AND active_yn = #{activeYn}</if>
  <if test="q != null">AND name ILIKE '%' || #{q} || '%'</if>
</where>

<set>
  <if test="name != null">name = #{name},</if>
  <if test="activeYn != null">active_yn = #{activeYn},</if>
  updated_at = CURRENT_TIMESTAMP
</set>
```

---

## pg 타입 변환

| DB 타입 | pg 반환 | API 타입 | 변환 |
|---------|---------|---------|------|
| BIGINT / BIGSERIAL | string | string | `::text` 캐스트 |
| INTEGER / SMALLINT | number | number | 그대로 |
| DECIMAL / NUMERIC | string | number | `num(v)` |
| DATE | Date | string | `dateOnly(d)` → `YYYY-MM-DD` |
| TIMESTAMPTZ | Date | string | `ts(d)` → ISO string |
| CHAR(1) Y/N | string | `YN` | 그대로 |
| text[] | string[] | string[] | 그대로 |

`mappers.ts` 헬퍼:
- `num(v)` — DECIMAL/NUMERIC → number
- `ts(date)` — Date/string → ISO string
- `dateOnly(date)` — Date/string → `YYYY-MM-DD`

---

## pg 헬퍼 함수 (`utils/index.ts`)

```typescript
pgId(id?: string | null)       // 숫자 문자열 검증 → raw 정수, 없으면 "NULL"
pgBigintArr(ids: string[])     // ARRAY[1,2,3]::bigint[] 또는 ARRAY[]::bigint[]
pgTextArr(vals: string[])      // ARRAY['a','b']::text[] (single-quote escape 포함)
pgJsonb(obj: unknown)          // 인라인 JSON 문자열::jsonb, null이면 NULL
pgStr(v?: string | null)       // 'escaped string' 또는 NULL
pgNum(v?: number | null)       // 숫자 또는 NULL
```

XML `${param}` 자리에 이 함수들의 반환값을 그대로 넣는다.

```typescript
// 서비스에서
const params = {
  id: utils.pgId(id),                        // → "42" or "NULL"
  imageIds: utils.pgBigintArr(body.imageIds), // → "ARRAY[1,2]::bigint[]"
  amenities: utils.pgTextArr(body.amenities), // → "ARRAY['수영장']::text[]"
};
```

---

## 스키마 컨벤션

### Y/N 플래그 컬럼 명명 규칙

| 컬럼 | 의미 | 적용 테이블 |
|------|------|-------------|
| `active_yn` | 활성/노출 여부 | accommodation, banner, facility, gallery_item, menu, program, program_session, push_token, room |
| `use_yn` | 사용/적용 여부 | code, code_group, menu_group, permission, season_rate, refund_policy |
| `open_yn` | 공개 여부 | notice |
| `featured_yn` | 추천 여부 | accommodation, facility, program |
| `pinned_yn` | 상단 고정 | notice |

### 공통 타임스탬프

| 컬럼 | 타입 | 의미 |
|------|------|------|
| `created_at` | TIMESTAMPTZ | 생성 시각 |
| `updated_at` | TIMESTAMPTZ | 수정 시각 |
| `created_by` | BIGINT (soft ref) | 생성자 user.id |
| `updated_by` | BIGINT (soft ref) | 수정자 user.id |

### ListQuery `useYn` 매핑

`S_ListQuery`의 querystring 파라미터명은 항상 `useYn`. 서비스에서 테이블별 컬럼명으로 변환.

```typescript
// active_yn 테이블
const params = { activeYn: q.useYn ?? "Y", ... };

// open_yn 테이블 (notice)
const params = { openYn: q.useYn ?? null, ... };

// use_yn 테이블 (menu_group, season_rate 등)
const params = { useYn: q.useYn ?? null, ... };
```

### ID 컬럼

- DB: `BIGSERIAL` → FK 참조: `BIGINT`
- soft ref: `created_by`, `updated_by` 등 FK 제약 없는 참조 컬럼
- hard FK: `reservation.user_id`, `reservation.room_id` 등 `ON DELETE` 명시된 컬럼

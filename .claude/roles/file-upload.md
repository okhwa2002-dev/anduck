# 파일 업로드 시스템

## 엔드포인트

```
POST /files/images?source={menuCode}
Content-Type: multipart/form-data
Authorization: Bearer {access_token}
```

| 항목 | 값 |
|------|-----|
| 허용 MIME | `image/jpeg`, `image/png`, `image/gif`, `image/webp` |
| 최대 파일 크기 | 10 MB |
| Rate limit | 30회 / 1분 |
| 인증 | 필수 (어드민 토큰) |

**보안 검증**

- MIME 헤더만 믿지 않고 magic byte로 실제 이미지 형식을 검증한다.
- JPEG, PNG, GIF, WebP만 허용한다.
- MIME, 확장자, 실제 이미지 형식이 서로 맞지 않으면 업로드를 거부한다.
- 저장 파일명은 UUID 기반으로 생성하며 원본 파일명을 저장 경로에 사용하지 않는다.

**쿼리 파라미터**

| 파라미터 | 필수 | 설명 |
|----------|------|------|
| `source` | 선택 | 업로드 출처 메뉴 코드 (`Menu.menuCode`) |

**응답 (`201 Created`)**

```ts
interface UploadedFile {
  id: string;          // image 테이블 PK (bigint → string)
  url: string;         // 공개 접근 URL
  filename: string;    // 원본 파일명
  contentType: string;
  size: number;        // bytes
}
```

---

## 저장 방식

- 로컬 파일시스템 저장 (`UPLOAD_DIR` 환경변수)
- 기본 저장 경로: `D:\attach\anduck`
- 파일명: `{uuid}.{ext}` (원본 파일명 미사용 → 충돌/인젝션 방지)
- 공개 URL: `{PUBLIC_URL}/uploads/{uuid}.{ext}`
- 정적 파일 서빙: `@fastify/static` → `/uploads/*` 경로로 노출

**환경변수 (`.env`)**

```env
UPLOAD_DIR=D:\attach\anduck
PUBLIC_URL=http://localhost:4000
```

---

## DB 구조

`image` 테이블에 메타데이터 저장 (`apps/api/src/mapper/image.xml`)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | BIGSERIAL | PK |
| `url` | TEXT | 공개 접근 URL |
| `alt` | TEXT | 대체 텍스트 (파일명에서 확장자 제거한 값) |
| `filename` | TEXT | 원본 파일명 |
| `content_type` | TEXT | MIME 타입 |
| `size` | INTEGER | 파일 크기 (bytes) |
| `source_type` | VARCHAR(50) | 업로드 출처 메뉴 코드 |
| `created_by` | BIGINT | 업로드한 사용자 ID |

**마이그레이션 (기존 DB에 컬럼 추가 시)**

```sql
ALTER TABLE image ADD COLUMN IF NOT EXISTS source_type VARCHAR(50);
```

---

## 엔티티 연결 방식

각 콘텐츠 테이블(facility, program, accommodation, room 등)은 이미지를 소프트 참조로 관리한다.

```sql
main_image_id  BIGINT          -- 대표 이미지 ID (image.id 소프트 참조)
image_ids      BIGINT[]        -- 추가 이미지 ID 목록
```

- FK 제약 없음 — 애플리케이션 레이어에서 무결성 관리
- 저장 시 `mainImageId: string`, `imageIds: string[]` 를 body에 포함
- 조회 시 `imagesService.getImages(ids)` 로 일괄 fetch → `Map<id, ImageRef>` 반환

---

## 프론트엔드 사용 패턴

`apps/web/src/components/admin/ImageUploader.tsx`

```tsx
import { ImageUploader, type UploadedImage } from "@/components/admin/ImageUploader";
import { useMenuCode } from "@/hooks/useMenuCode";

const menuCode = useMenuCode();  // 현재 경로와 일치하는 Menu.menuCode 자동 조회
const [images, setImages] = useState<UploadedImage[]>([]);
const [mainImageId, setMainImageId] = useState<string | undefined>();

// 편집 화면: 기존 이미지 로드
setImages(facility.images.map(img => ({ id: img.id, url: img.url, filename: img.alt ?? "" })));
setMainImageId(facility.mainImage?.id);

// JSX — source에 menuCode 전달
<ImageUploader
  value={images}
  mainImageId={mainImageId}
  onChange={(next, nextMain) => { setImages(next); setMainImageId(nextMain); }}
  source={menuCode}
/>

// 저장 시 body에 포함
{ mainImageId, imageIds: images.map(img => img.id) }
```

**`useMenuCode` 훅** (`apps/web/src/hooks/useMenuCode.ts`)

- SWR로 `WEB_ADMIN` 그룹 메뉴 목록 fetch (캐시 공유)
- 현재 `pathname`과 `menu.path`를 `startsWith`로 매칭
- 일치하는 메뉴의 `menuCode` 반환 (없으면 `undefined`)

**ImageUploader 동작 규칙**

- 파일 선택 즉시 서버에 업로드 (저장 버튼 전에 업로드 완료)
- 업로드 시 `POST /files/images?source={menuCode}` 로 출처 전달
- 업로드 성공 후 썸네일 표시
- 첫 번째 업로드 이미지가 자동으로 대표 이미지로 설정됨
- 호버 시 ★(대표 설정) / ✕(제거) 버튼 노출
- 제거는 로컬 상태에서만 삭제 — DB의 `image` 레코드는 유지됨 (orphan 허용)
- `filesApi.uploadImage(FormData, source?)` 호출 (`apps/web/src/api/admin.ts`의 `filesApi`)

---

## filesService vs imagesService

| | `filesService` | `imagesService` |
|---|---|---|
| 역할 | 업로드 처리 | 이미지 조회 |
| 파일 접근 | 디스크에 저장 | 없음 |
| DB 조작 | `image` 테이블 INSERT | `image` 테이블 SELECT |
| 호출 위치 | `filesRoutes` (업로드 API) | 모든 콘텐츠 서비스 |
| 방향 | **쓰기 전용** | **읽기 전용** |

```
업로드 흐름:
  POST /files/images → filesService.uploadImage() → image 테이블 INSERT

조회 흐름:
  GET /admin/facilities → listAdminFacilities()
    → imagesService.getImages([id1, id2, ...])
    → Map<id, ImageRef> 반환
```

---

## 새 엔티티에 이미지 업로드 추가하는 방법

1. DB 테이블에 `main_image_id BIGINT`, `image_ids BIGINT[]` 컬럼 확인
2. 서비스에서 `imagesService.getImages(imageIds)` + `mappers.imageIdsFrom(rows)` 패턴 사용
3. FormPage에 `useMenuCode()`, `images`, `mainImageId` 상태 추가
4. `ImageUploader` 컴포넌트 배치 — `source={menuCode}` 전달
5. submit body에 `mainImageId`, `imageIds: images.map(img => img.id)` 포함

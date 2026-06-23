-- Anduck API database schema
-- Target: PostgreSQL
-- Source of truth: apps/api/prisma/schema.prisma
-- Naming convention: all identifiers (tables, enums, columns) = snake_case
-- Boolean columns: *_yn CHAR(1) DEFAULT 'Y'/'N', CHECK IN ('Y','N')

-- user_type: TEXT 컬럼으로 관리 (MEMBER·ADMIN·SUPER_ADMIN)

SET TIME ZONE 'Asia/Seoul';
ALTER DATABASE anduck SET timezone TO 'Asia/Seoul';

CREATE OR REPLACE FUNCTION current_kst_timestamp()
RETURNS TIMESTAMP(3)
LANGUAGE sql
STABLE
AS $$
  SELECT timezone('Asia/Seoul', now())::TIMESTAMP(3);
$$;

CREATE OR REPLACE FUNCTION set_updated_at_kst()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = current_kst_timestamp();
  RETURN NEW;
END;
$$;

CREATE TYPE accommodation_type AS ENUM (
  'HWANGTO',
  'PENSION'
);

CREATE TYPE reservation_status AS ENUM (
  'PENDING',
  'REVIEWING',
  'CONFIRMED',
  'CANCELLED',
  'COMPLETED'
);

CREATE TYPE reservation_kind AS ENUM (
  'ACCOMMODATION',
  'PROGRAM'
);

CREATE TYPE facility_kind AS ENUM (
  'VILLAGE',
  'NEARBY'
);

CREATE TYPE banner_link_type AS ENUM (
  'NONE',
  'PROGRAM',
  'ACCOMMODATION',
  'NOTICE',
  'FACILITY',
  'URL'
);

CREATE TYPE cancel_type AS ENUM (
  'MEMBER',
  'ADMIN'
);

CREATE TYPE refund_status AS ENUM (
  'PENDING',
  'COMPLETED',
  'SKIPPED'
);

-- ===========================================================================
-- user
-- ===========================================================================
CREATE TABLE "user" (
  "id"            BIGSERIAL PRIMARY KEY,
  "login_id"      TEXT NOT NULL UNIQUE,
  "email"         TEXT NOT NULL UNIQUE,
  "password_hash" TEXT NOT NULL,
  "name"          TEXT NOT NULL,
  "phone"         TEXT,
  "user_type"     TEXT NOT NULL DEFAULT 'MEMBER',
  "created_at"    TIMESTAMP(3) NOT NULL DEFAULT current_kst_timestamp(),
  "created_by"    BIGINT,
  "updated_at"    TIMESTAMP(3) NOT NULL DEFAULT current_kst_timestamp(),
  "updated_by"    BIGINT
);

COMMENT ON TABLE  "user"                 IS '사용자 (회원 및 관리자)';
COMMENT ON COLUMN "user"."id"            IS '사용자 고유 ID';
COMMENT ON COLUMN "user"."login_id"      IS '로그인 아이디 (유니크)';
COMMENT ON COLUMN "user"."email"         IS '이메일 (연락처, 유니크)';
COMMENT ON COLUMN "user"."password_hash" IS 'bcrypt 해시된 비밀번호';
COMMENT ON COLUMN "user"."name"          IS '이름';
COMMENT ON COLUMN "user"."phone"         IS '연락처';
COMMENT ON COLUMN "user"."user_type"     IS '사용자 유형 (MEMBER·ADMIN·SUPER_ADMIN)';
COMMENT ON COLUMN "user"."created_at"    IS '생성일시';
COMMENT ON COLUMN "user"."created_by"    IS '생성자 ID (user.id 소프트 참조)';
COMMENT ON COLUMN "user"."updated_at"    IS '수정일시';
COMMENT ON COLUMN "user"."updated_by"    IS '수정자 ID (user.id 소프트 참조)';

-- ===========================================================================
-- image
-- ===========================================================================
CREATE TABLE "image" (
  "id"           BIGSERIAL PRIMARY KEY,
  "url"          TEXT NOT NULL,
  "alt"          TEXT,
  "filename"     TEXT,
  "content_type" TEXT,
  "size"         INTEGER,
  "created_at"   TIMESTAMP(3) NOT NULL DEFAULT current_kst_timestamp(),
  "created_by"   BIGINT,
  "updated_at"   TIMESTAMP(3) NOT NULL DEFAULT current_kst_timestamp(),
  "updated_by"   BIGINT
);

COMMENT ON TABLE  "image"                IS '이미지 메타데이터 (실제 파일은 S3/R2)';
COMMENT ON COLUMN "image"."id"           IS '이미지 고유 ID';
COMMENT ON COLUMN "image"."url"          IS '이미지 접근 URL (S3/R2 공개 URL)';
COMMENT ON COLUMN "image"."alt"          IS '대체 텍스트 (접근성·SEO)';
COMMENT ON COLUMN "image"."filename"     IS '원본 파일명';
COMMENT ON COLUMN "image"."content_type" IS 'MIME 타입 (예: image/jpeg)';
COMMENT ON COLUMN "image"."size"         IS '파일 크기 (bytes)';
COMMENT ON COLUMN "image"."created_at"   IS '생성일시';
COMMENT ON COLUMN "image"."created_by"   IS '생성자 ID (user.id 소프트 참조)';
COMMENT ON COLUMN "image"."updated_at"   IS '수정일시';
COMMENT ON COLUMN "image"."updated_by"   IS '수정자 ID (user.id 소프트 참조)';

-- ===========================================================================
-- code_group (공통코드 그룹)
-- ===========================================================================
CREATE TABLE "code_group" (
  "id"          BIGSERIAL PRIMARY KEY,
  "group_code"  TEXT NOT NULL UNIQUE,
  "group_name"  TEXT NOT NULL,
  "description" TEXT,
  "use_yn"   CHAR(1) NOT NULL DEFAULT 'Y' CONSTRAINT "code_group_use_yn_chk" CHECK ("use_yn" IN ('Y','N')),
  "sort_order"  INTEGER NOT NULL DEFAULT 0,
  "created_at"  TIMESTAMP(3) NOT NULL DEFAULT current_kst_timestamp(),
  "created_by"  BIGINT,
  "updated_at"  TIMESTAMP(3) NOT NULL DEFAULT current_kst_timestamp(),
  "updated_by"  BIGINT
);

COMMENT ON TABLE  "code_group"               IS '공통코드 그룹';
COMMENT ON COLUMN "code_group"."id"          IS '코드 그룹 고유 ID';
COMMENT ON COLUMN "code_group"."group_code"  IS '그룹 코드 (예: PLATFORM, AMENITY, AVAILABLE_DAY)';
COMMENT ON COLUMN "code_group"."group_name"  IS '그룹명 (예: 플랫폼, 편의시설, 운영요일)';
COMMENT ON COLUMN "code_group"."description" IS '그룹 설명';
COMMENT ON COLUMN "code_group"."use_yn"   IS '사용 여부 (Y: 사용, N: 미사용)';
COMMENT ON COLUMN "code_group"."sort_order"  IS '정렬 순서 (오름차순)';
COMMENT ON COLUMN "code_group"."created_at"  IS '생성일시';
COMMENT ON COLUMN "code_group"."created_by"  IS '생성자 ID (user.id 소프트 참조)';
COMMENT ON COLUMN "code_group"."updated_at"  IS '수정일시';
COMMENT ON COLUMN "code_group"."updated_by"  IS '수정자 ID (user.id 소프트 참조)';

-- ===========================================================================
-- code (공통코드)
-- ===========================================================================
CREATE TABLE "code" (
  "id"          BIGSERIAL PRIMARY KEY,
  "group_id"    BIGINT NOT NULL,
  "code"        TEXT NOT NULL,
  "name"        TEXT NOT NULL,
  "description" TEXT,
  "extra"       JSONB,
  "use_yn"   CHAR(1) NOT NULL DEFAULT 'Y' CONSTRAINT "code_use_yn_chk" CHECK ("use_yn" IN ('Y','N')),
  "sort_order"  INTEGER NOT NULL DEFAULT 0,
  "created_at"  TIMESTAMP(3) NOT NULL DEFAULT current_kst_timestamp(),
  "created_by"  BIGINT,
  "updated_at"  TIMESTAMP(3) NOT NULL DEFAULT current_kst_timestamp(),
  "updated_by"  BIGINT,
  CONSTRAINT "code_group_id_fkey"
    FOREIGN KEY ("group_id") REFERENCES "code_group"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "code_group_id_code_uq"
    UNIQUE ("group_id", "code")
);

COMMENT ON TABLE  "code"               IS '공통코드 (code_group에 속하는 개별 코드)';
COMMENT ON COLUMN "code"."id"          IS '코드 고유 ID';
COMMENT ON COLUMN "code"."group_id"    IS '소속 코드 그룹 ID (code_group.id)';
COMMENT ON COLUMN "code"."code"        IS '코드값 (예: IOS, WIFI, MON, PERSONAL_SCHEDULE)';
COMMENT ON COLUMN "code"."name"        IS '코드명 (예: iOS, 와이파이, 월요일, 개인사정)';
COMMENT ON COLUMN "code"."description" IS '코드 설명';
COMMENT ON COLUMN "code"."extra"       IS '추가 속성 JSON (필요 시 확장, 예: {"color":"#fff"})';
COMMENT ON COLUMN "code"."use_yn"   IS '사용 여부 (Y: 사용, N: 미사용)';
COMMENT ON COLUMN "code"."sort_order"  IS '그룹 내 정렬 순서 (오름차순)';
COMMENT ON COLUMN "code"."created_at"  IS '생성일시';
COMMENT ON COLUMN "code"."created_by"  IS '생성자 ID (user.id 소프트 참조)';
COMMENT ON COLUMN "code"."updated_at"  IS '수정일시';
COMMENT ON COLUMN "code"."updated_by"  IS '수정자 ID (user.id 소프트 참조)';

CREATE INDEX "code_group_id_use_yn_idx" ON "code" ("group_id", "use_yn", "sort_order");

-- ===========================================================================
-- menu_group (메뉴 그룹)
-- ===========================================================================
CREATE TABLE "menu_group" (
  "id"          BIGSERIAL PRIMARY KEY,
  "group_code"  TEXT NOT NULL UNIQUE,
  "group_name"  TEXT NOT NULL,
  "description" TEXT,
  "use_yn"   CHAR(1) NOT NULL DEFAULT 'Y' CONSTRAINT "menu_group_use_yn_chk" CHECK ("use_yn" IN ('Y','N')),
  "sort_order"  INTEGER NOT NULL DEFAULT 0,
  "created_at"  TIMESTAMP(3) NOT NULL DEFAULT current_kst_timestamp(),
  "created_by"  BIGINT,
  "updated_at"  TIMESTAMP(3) NOT NULL DEFAULT current_kst_timestamp(),
  "updated_by"  BIGINT
);

COMMENT ON TABLE  "menu_group"               IS '메뉴 그룹 (웹·모바일·관리자 등 영역 단위 구분)';
COMMENT ON COLUMN "menu_group"."id"          IS '메뉴 그룹 고유 ID';
COMMENT ON COLUMN "menu_group"."group_code"  IS '그룹 코드 (예: WEB_PUBLIC, WEB_ADMIN, MOBILE)';
COMMENT ON COLUMN "menu_group"."group_name"  IS '그룹명 (예: 웹 공개 메뉴, 웹 관리자 메뉴, 모바일 메뉴)';
COMMENT ON COLUMN "menu_group"."description" IS '그룹 설명';
COMMENT ON COLUMN "menu_group"."use_yn"   IS '사용 여부 (Y: 사용, N: 미사용)';
COMMENT ON COLUMN "menu_group"."sort_order"  IS '정렬 순서 (오름차순)';
COMMENT ON COLUMN "menu_group"."created_at"  IS '생성일시';
COMMENT ON COLUMN "menu_group"."created_by"  IS '생성자 ID (user.id 소프트 참조)';
COMMENT ON COLUMN "menu_group"."updated_at"  IS '수정일시';
COMMENT ON COLUMN "menu_group"."updated_by"  IS '수정자 ID (user.id 소프트 참조)';

-- ===========================================================================
-- menu (메뉴)
-- ===========================================================================
CREATE TABLE "menu" (
  "id"          BIGSERIAL PRIMARY KEY,
  "group_id"    BIGINT NOT NULL,
  "parent_id"   BIGINT,
  "menu_code"   TEXT NOT NULL,
  "menu_name"   TEXT NOT NULL,
  "path"        TEXT,
  "icon"        TEXT,
  "target"      TEXT NOT NULL DEFAULT '_self',
  "active_yn"   CHAR(1) NOT NULL DEFAULT 'Y' CONSTRAINT "menu_active_yn_chk" CHECK ("active_yn" IN ('Y','N')),
  "sort_order"  INTEGER NOT NULL DEFAULT 0,
  "created_at"  TIMESTAMP(3) NOT NULL DEFAULT current_kst_timestamp(),
  "created_by"  BIGINT,
  "updated_at"  TIMESTAMP(3) NOT NULL DEFAULT current_kst_timestamp(),
  "updated_by"  BIGINT,
  CONSTRAINT "menu_group_id_fkey"
    FOREIGN KEY ("group_id") REFERENCES "menu_group"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "menu_parent_id_fkey"
    FOREIGN KEY ("parent_id") REFERENCES "menu"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "menu_group_id_menu_code_uq"
    UNIQUE ("group_id", "menu_code")
);

COMMENT ON TABLE  "menu"               IS '메뉴 (계층 구조 지원, permission_menu로 접근 제어)';
COMMENT ON COLUMN "menu"."id"          IS '메뉴 고유 ID';
COMMENT ON COLUMN "menu"."group_id"    IS '소속 메뉴 그룹 ID (menu_group.id)';
COMMENT ON COLUMN "menu"."parent_id"   IS '상위 메뉴 ID (null이면 최상위 메뉴)';
COMMENT ON COLUMN "menu"."menu_code"   IS '메뉴 코드 (예: ABOUT, PROGRAMS, ADMIN_ROOMS)';
COMMENT ON COLUMN "menu"."menu_name"   IS '메뉴명 (예: 마을소개, 체험프로그램, 숙소관리)';
COMMENT ON COLUMN "menu"."path"        IS '라우트 경로 (예: /about, /admin/rooms)';
COMMENT ON COLUMN "menu"."icon"        IS '아이콘명 (예: home, calendar, settings)';
COMMENT ON COLUMN "menu"."target"      IS '링크 타겟 (_self: 현재창, _blank: 새창)';
COMMENT ON COLUMN "menu"."active_yn"   IS '노출 여부 (Y: 노출, N: 숨김)';
COMMENT ON COLUMN "menu"."sort_order"  IS '같은 부모 내 정렬 순서 (오름차순)';
COMMENT ON COLUMN "menu"."created_at"  IS '생성일시';
COMMENT ON COLUMN "menu"."created_by"  IS '생성자 ID (user.id 소프트 참조)';
COMMENT ON COLUMN "menu"."updated_at"  IS '수정일시';
COMMENT ON COLUMN "menu"."updated_by"  IS '수정자 ID (user.id 소프트 참조)';

CREATE INDEX "menu_group_id_parent_id_idx"   ON "menu" ("group_id", "parent_id");
CREATE INDEX "menu_parent_id_idx"            ON "menu" ("parent_id");
CREATE INDEX "menu_active_yn_sort_order_idx" ON "menu" ("active_yn", "sort_order");

-- ===========================================================================
-- permission (권한 정의)
-- ===========================================================================
CREATE TABLE "permission" (
  "id"          BIGSERIAL PRIMARY KEY,
  "code"        TEXT NOT NULL UNIQUE,
  "name"        TEXT NOT NULL,
  "description" TEXT,
  "use_yn"      CHAR(1) NOT NULL DEFAULT 'Y' CONSTRAINT "permission_use_yn_chk" CHECK ("use_yn" IN ('Y','N')),
  "sort_order"  INTEGER NOT NULL DEFAULT 0,
  "created_at"  TIMESTAMP(3) NOT NULL DEFAULT current_kst_timestamp(),
  "created_by"  BIGINT,
  "updated_at"  TIMESTAMP(3) NOT NULL DEFAULT current_kst_timestamp(),
  "updated_by"  BIGINT
);

COMMENT ON TABLE  "permission"               IS '권한 정의 (리소스 단위 세분화된 접근 권한)';
COMMENT ON COLUMN "permission"."id"          IS '권한 고유 ID';
COMMENT ON COLUMN "permission"."code"        IS '권한 코드 (예: RESERVATION_READ, NOTICE_MANAGE, GALLERY_WRITE)';
COMMENT ON COLUMN "permission"."name"        IS '권한명 (예: 예약 조회, 공지 관리, 갤러리 등록)';
COMMENT ON COLUMN "permission"."description" IS '권한 설명';
COMMENT ON COLUMN "permission"."use_yn"      IS '사용 여부 (Y: 사용, N: 미사용)';
COMMENT ON COLUMN "permission"."sort_order"       IS '정렬 순서 (오름차순)';
COMMENT ON COLUMN "permission"."created_at"       IS '생성일시';
COMMENT ON COLUMN "permission"."created_by"       IS '생성자 ID (user.id 소프트 참조)';
COMMENT ON COLUMN "permission"."updated_at"       IS '수정일시';
COMMENT ON COLUMN "permission"."updated_by"       IS '수정자 ID (user.id 소프트 참조)';

-- ===========================================================================
-- user_permission (사용자별 실제 권한 — 개별 커스터마이징 가능)
-- ===========================================================================
CREATE TABLE "user_permission" (
  "id"             BIGSERIAL PRIMARY KEY,
  "user_id"        BIGINT NOT NULL,
  "permission_id"  BIGINT NOT NULL,
  "created_at"     TIMESTAMP(3) NOT NULL DEFAULT current_kst_timestamp(),
  "created_by"     BIGINT,
  CONSTRAINT "user_permission_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "user"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "user_permission_permission_id_fkey"
    FOREIGN KEY ("permission_id") REFERENCES "permission"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "user_permission_uq"
    UNIQUE ("user_id", "permission_id")
);

COMMENT ON TABLE  "user_permission"                  IS '사용자별 권한 (회원가입 시 기본 세트 복사, 이후 개별 추가·제거 가능)';
COMMENT ON COLUMN "user_permission"."id"             IS '매핑 고유 ID';
COMMENT ON COLUMN "user_permission"."user_id"        IS '사용자 ID (user.id)';
COMMENT ON COLUMN "user_permission"."permission_id"  IS '권한 ID (permission.id)';
COMMENT ON COLUMN "user_permission"."created_at"     IS '생성일시';
COMMENT ON COLUMN "user_permission"."created_by"     IS '생성자 ID (user.id 소프트 참조)';

CREATE INDEX "user_permission_user_id_idx"        ON "user_permission" ("user_id");
CREATE INDEX "user_permission_permission_id_idx"  ON "user_permission" ("permission_id");

-- ===========================================================================
-- permission_menu (권한-메뉴 매핑)
-- ===========================================================================
CREATE TABLE "permission_menu" (
  "id"             BIGSERIAL PRIMARY KEY,
  "permission_id"  BIGINT NOT NULL,
  "menu_id"        BIGINT NOT NULL,
  "created_at"     TIMESTAMP(3) NOT NULL DEFAULT current_kst_timestamp(),
  "created_by"     BIGINT,
  CONSTRAINT "permission_menu_permission_id_fkey"
    FOREIGN KEY ("permission_id") REFERENCES "permission"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "permission_menu_menu_id_fkey"
    FOREIGN KEY ("menu_id") REFERENCES "menu"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "permission_menu_permission_id_menu_id_uq"
    UNIQUE ("permission_id", "menu_id")
);

COMMENT ON TABLE  "permission_menu"                  IS '권한-메뉴 매핑 (Permission이 있으면 접근 가능한 Menu)';
COMMENT ON COLUMN "permission_menu"."id"             IS '매핑 고유 ID';
COMMENT ON COLUMN "permission_menu"."permission_id"  IS '권한 ID (permission.id)';
COMMENT ON COLUMN "permission_menu"."menu_id"        IS '접근 허용 메뉴 ID (menu.id)';
COMMENT ON COLUMN "permission_menu"."created_at"     IS '생성일시';
COMMENT ON COLUMN "permission_menu"."created_by"     IS '생성자 ID (user.id 소프트 참조)';

CREATE INDEX "permission_menu_permission_id_idx" ON "permission_menu" ("permission_id");
CREATE INDEX "permission_menu_menu_id_idx"       ON "permission_menu" ("menu_id");

-- ===========================================================================
-- program (체험 프로그램)
-- ===========================================================================
CREATE TABLE "program" (
  "id"                BIGSERIAL PRIMARY KEY,
  "name"              TEXT NOT NULL,
  "summary"           TEXT,
  "description"       TEXT NOT NULL,
  "duration_minutes"  INTEGER NOT NULL,
  "price_per_person"  INTEGER NOT NULL,
  "min_participants"  INTEGER,
  "max_participants"  INTEGER NOT NULL,
  "available_days"    TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "operating_hours"   TEXT,
  "preparation_notes" TEXT,
  "main_image_id"     BIGINT,
  "image_ids"         BIGINT[] NOT NULL DEFAULT ARRAY[]::BIGINT[],
  "main_open_yn"      CHAR(1) NOT NULL DEFAULT 'N' CONSTRAINT "program_main_open_yn_chk" CHECK ("main_open_yn" IN ('Y','N')),
  "active_yn"         CHAR(1) NOT NULL DEFAULT 'Y' CONSTRAINT "program_active_yn_chk"   CHECK ("active_yn"   IN ('Y','N')),
  "sort_order"        INTEGER NOT NULL DEFAULT 0,
  "created_at"        TIMESTAMP(3) NOT NULL DEFAULT current_kst_timestamp(),
  "created_by"        BIGINT,
  "updated_at"        TIMESTAMP(3) NOT NULL DEFAULT current_kst_timestamp(),
  "updated_by"        BIGINT
);

COMMENT ON TABLE  "program"                    IS '체험 프로그램';
COMMENT ON COLUMN "program"."id"               IS '프로그램 고유 ID';
COMMENT ON COLUMN "program"."name"             IS '프로그램명';
COMMENT ON COLUMN "program"."summary"          IS '한 줄 요약';
COMMENT ON COLUMN "program"."description"      IS '상세 설명';
COMMENT ON COLUMN "program"."duration_minutes" IS '소요 시간 (분)';
COMMENT ON COLUMN "program"."price_per_person" IS '1인 요금 (원)';
COMMENT ON COLUMN "program"."min_participants" IS '최소 참가 인원 (null이면 제한 없음)';
COMMENT ON COLUMN "program"."max_participants" IS '최대 참가 인원';
COMMENT ON COLUMN "program"."available_days"   IS '운영 요일 목록 (예: {MON,TUE,SAT})';
COMMENT ON COLUMN "program"."operating_hours"  IS '운영 시간 문자열 (예: 09:00~18:00)';
COMMENT ON COLUMN "program"."preparation_notes" IS '준비물 및 유의사항';
COMMENT ON COLUMN "program"."main_image_id"    IS '대표 이미지 ID (image.id 소프트 참조)';
COMMENT ON COLUMN "program"."image_ids"        IS '추가 이미지 ID 목록 (image.id 소프트 참조)';
COMMENT ON COLUMN "program"."main_open_yn"     IS '메인 페이지 노출 여부 (Y: 노출, N: 미노출)';
COMMENT ON COLUMN "program"."active_yn"        IS '활성화(공개) 여부 (Y: 공개, N: 비공개)';
COMMENT ON COLUMN "program"."sort_order"       IS '목록 정렬 순서 (오름차순)';
COMMENT ON COLUMN "program"."created_at"       IS '생성일시';
COMMENT ON COLUMN "program"."created_by"       IS '생성자 ID (user.id 소프트 참조)';
COMMENT ON COLUMN "program"."updated_at"       IS '수정일시';
COMMENT ON COLUMN "program"."updated_by"       IS '수정자 ID (user.id 소프트 참조)';

CREATE INDEX "program_active_yn_sort_order_idx" ON "program" ("active_yn", "sort_order");

-- ===========================================================================
-- program_session (체험 회차)
-- ===========================================================================
CREATE TABLE "program_session" (
  "id"           BIGSERIAL PRIMARY KEY,
  "program_id"   BIGINT NOT NULL,
  "session_date" DATE NOT NULL,
  "start_time"   TEXT NOT NULL,
  "capacity"     INTEGER,
  "active_yn"    CHAR(1) NOT NULL DEFAULT 'Y' CONSTRAINT "program_session_active_yn_chk" CHECK ("active_yn" IN ('Y','N')),
  "created_at"   TIMESTAMP(3) NOT NULL DEFAULT current_kst_timestamp(),
  "created_by"   BIGINT,
  "updated_at"   TIMESTAMP(3) NOT NULL DEFAULT current_kst_timestamp(),
  "updated_by"   BIGINT,
  CONSTRAINT "program_session_program_id_fkey"
    FOREIGN KEY ("program_id") REFERENCES "program"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

COMMENT ON TABLE  "program_session"                IS '체험 프로그램 회차 (날짜·시간·정원 단위 관리)';
COMMENT ON COLUMN "program_session"."id"           IS '회차 고유 ID';
COMMENT ON COLUMN "program_session"."program_id"   IS '소속 프로그램 ID (program.id)';
COMMENT ON COLUMN "program_session"."session_date" IS '회차 운영 날짜';
COMMENT ON COLUMN "program_session"."start_time"   IS '회차 시작 시간 (예: 09:00)';
COMMENT ON COLUMN "program_session"."capacity"     IS '회차별 최대 참가 인원 (null이면 program.max_participants 적용)';
COMMENT ON COLUMN "program_session"."active_yn"    IS '운영 여부 (Y: 운영, N: 취소·비활성)';
COMMENT ON COLUMN "program_session"."created_at"   IS '생성일시';
COMMENT ON COLUMN "program_session"."created_by"   IS '생성자 ID (user.id 소프트 참조)';
COMMENT ON COLUMN "program_session"."updated_at"   IS '수정일시';
COMMENT ON COLUMN "program_session"."updated_by"   IS '수정자 ID (user.id 소프트 참조)';

CREATE INDEX "program_session_program_id_idx"        ON "program_session" ("program_id");
CREATE INDEX "program_session_date_active_yn_idx"    ON "program_session" ("session_date", "active_yn");

-- ===========================================================================
-- accommodation (숙소 - 황토방 / 수펜션)
-- ===========================================================================
CREATE TABLE "accommodation" (
  "id"             BIGSERIAL PRIMARY KEY,
  "type"           accommodation_type NOT NULL,
  "name"           TEXT NOT NULL,
  "summary"        TEXT,
  "description"    TEXT NOT NULL,
  "main_image_id"  BIGINT,
  "image_ids"      BIGINT[] NOT NULL DEFAULT ARRAY[]::BIGINT[],
  "amenities"      TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "check_in_time"  TEXT,
  "check_out_time" TEXT,
  "featured_yn"    CHAR(1) NOT NULL DEFAULT 'N' CONSTRAINT "accommodation_featured_yn_chk" CHECK ("featured_yn" IN ('Y','N')),
  "active_yn"      CHAR(1) NOT NULL DEFAULT 'Y' CONSTRAINT "accommodation_active_yn_chk"   CHECK ("active_yn"   IN ('Y','N')),
  "sort_order"     INTEGER NOT NULL DEFAULT 0,
  "created_at"     TIMESTAMP(3) NOT NULL DEFAULT current_kst_timestamp(),
  "created_by"     BIGINT,
  "updated_at"     TIMESTAMP(3) NOT NULL DEFAULT current_kst_timestamp(),
  "updated_by"     BIGINT
);

COMMENT ON TABLE  "accommodation"                  IS '숙소 (황토방·수펜션 등 유형별 묶음)';
COMMENT ON COLUMN "accommodation"."id"             IS '숙소 고유 ID';
COMMENT ON COLUMN "accommodation"."type"           IS '숙소 유형 (HWANGTO: 황토방, PENSION: 수펜션)';
COMMENT ON COLUMN "accommodation"."name"           IS '숙소명';
COMMENT ON COLUMN "accommodation"."summary"        IS '한 줄 요약';
COMMENT ON COLUMN "accommodation"."description"    IS '상세 설명';
COMMENT ON COLUMN "accommodation"."main_image_id"  IS '대표 이미지 ID (image.id 소프트 참조)';
COMMENT ON COLUMN "accommodation"."image_ids"      IS '추가 이미지 ID 목록 (image.id 소프트 참조)';
COMMENT ON COLUMN "accommodation"."amenities"      IS '편의시설 목록 (예: {wifi,parking,bbq})';
COMMENT ON COLUMN "accommodation"."check_in_time"  IS '체크인 시간 (예: 15:00)';
COMMENT ON COLUMN "accommodation"."check_out_time" IS '체크아웃 시간 (예: 11:00)';
COMMENT ON COLUMN "accommodation"."featured_yn"    IS '메인 페이지 노출 여부 (Y: 노출, N: 미노출)';
COMMENT ON COLUMN "accommodation"."active_yn"      IS '활성화(공개) 여부 (Y: 공개, N: 비공개)';
COMMENT ON COLUMN "accommodation"."sort_order"     IS '목록 정렬 순서 (오름차순)';
COMMENT ON COLUMN "accommodation"."created_at"     IS '생성일시';
COMMENT ON COLUMN "accommodation"."created_by"     IS '생성자 ID (user.id 소프트 참조)';
COMMENT ON COLUMN "accommodation"."updated_at"     IS '수정일시';
COMMENT ON COLUMN "accommodation"."updated_by"     IS '수정자 ID (user.id 소프트 참조)';

CREATE INDEX "accommodation_active_yn_sort_order_idx" ON "accommodation" ("active_yn", "sort_order");

-- ===========================================================================
-- room (객실 - 실제 예약 단위)
-- ===========================================================================
CREATE TABLE "room" (
  "id"                BIGSERIAL PRIMARY KEY,
  "accommodation_id"  BIGINT NOT NULL,
  "name"              TEXT NOT NULL,
  "description"       TEXT,
  "base_guests"       INTEGER NOT NULL,
  "max_guests"        INTEGER NOT NULL,
  "weekday_price"     INTEGER NOT NULL,
  "weekend_price"     INTEGER,
  "peak_season_price" INTEGER,
  "main_image_id"     BIGINT,
  "image_ids"         BIGINT[] NOT NULL DEFAULT ARRAY[]::BIGINT[],
  "active_yn"         CHAR(1) NOT NULL DEFAULT 'Y' CONSTRAINT "room_active_yn_chk" CHECK ("active_yn" IN ('Y','N')),
  "sort_order"        INTEGER NOT NULL DEFAULT 0,
  "created_at"        TIMESTAMP(3) NOT NULL DEFAULT current_kst_timestamp(),
  "created_by"        BIGINT,
  "updated_at"        TIMESTAMP(3) NOT NULL DEFAULT current_kst_timestamp(),
  "updated_by"        BIGINT,
  CONSTRAINT "room_accommodation_id_fkey"
    FOREIGN KEY ("accommodation_id") REFERENCES "accommodation"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

COMMENT ON TABLE  "room"                      IS '객실 (예약 가능 단위, 숙소에 속함)';
COMMENT ON COLUMN "room"."id"                 IS '객실 고유 ID';
COMMENT ON COLUMN "room"."accommodation_id"   IS '소속 숙소 ID (accommodation.id)';
COMMENT ON COLUMN "room"."name"               IS '객실명 (예: 황토방 1호)';
COMMENT ON COLUMN "room"."description"        IS '객실 설명';
COMMENT ON COLUMN "room"."base_guests"        IS '기준 인원';
COMMENT ON COLUMN "room"."max_guests"         IS '최대 수용 인원';
COMMENT ON COLUMN "room"."weekday_price"      IS '평일 1박 요금 (원)';
COMMENT ON COLUMN "room"."weekend_price"      IS '주말 1박 요금 (원, null이면 평일 요금 적용)';
COMMENT ON COLUMN "room"."peak_season_price"  IS '성수기 1박 요금 (원, null이면 주말 요금 적용)';
COMMENT ON COLUMN "room"."main_image_id"      IS '대표 이미지 ID (image.id 소프트 참조)';
COMMENT ON COLUMN "room"."image_ids"          IS '추가 이미지 ID 목록 (image.id 소프트 참조)';
COMMENT ON COLUMN "room"."active_yn"          IS '활성화(예약 가능) 여부 (Y: 가능, N: 불가)';
COMMENT ON COLUMN "room"."sort_order"         IS '목록 정렬 순서 (오름차순)';
COMMENT ON COLUMN "room"."created_at"         IS '생성일시';
COMMENT ON COLUMN "room"."created_by"         IS '생성자 ID (user.id 소프트 참조)';
COMMENT ON COLUMN "room"."updated_at"         IS '수정일시';
COMMENT ON COLUMN "room"."updated_by"         IS '수정자 ID (user.id 소프트 참조)';

CREATE INDEX "room_accommodation_id_idx" ON "room" ("accommodation_id");

-- ===========================================================================
-- season_rate (성수기 요금 기간)
-- ===========================================================================
CREATE TABLE "season_rate" (
  "id"         BIGSERIAL PRIMARY KEY,
  "name"       TEXT NOT NULL,
  "start_date" DATE NOT NULL,
  "end_date"   DATE NOT NULL,
  "room_id"    BIGINT,
  "price"      INTEGER NOT NULL,
  "use_yn"  CHAR(1) NOT NULL DEFAULT 'Y' CONSTRAINT "season_rate_use_yn_chk" CHECK ("use_yn" IN ('Y','N')),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT current_kst_timestamp(),
  "created_by" BIGINT,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT current_kst_timestamp(),
  "updated_by" BIGINT,
  CONSTRAINT "season_rate_room_id_fkey"
    FOREIGN KEY ("room_id") REFERENCES "room"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "season_rate_date_range_chk"
    CHECK ("end_date" >= "start_date")
);

COMMENT ON TABLE  "season_rate"              IS '성수기 요금 기간 (room의 peak_season_price 대신 적용)';
COMMENT ON COLUMN "season_rate"."id"         IS '성수기 요금 고유 ID';
COMMENT ON COLUMN "season_rate"."name"       IS '기간명 (예: 2025년 여름 성수기)';
COMMENT ON COLUMN "season_rate"."start_date" IS '성수기 시작일 (포함)';
COMMENT ON COLUMN "season_rate"."end_date"   IS '성수기 종료일 (포함)';
COMMENT ON COLUMN "season_rate"."room_id"    IS '적용 객실 ID (null이면 전체 객실에 적용)';
COMMENT ON COLUMN "season_rate"."price"      IS '성수기 1박 요금 (원)';
COMMENT ON COLUMN "season_rate"."use_yn"  IS '적용 여부 (Y: 적용, N: 미적용)';
COMMENT ON COLUMN "season_rate"."created_at" IS '생성일시';
COMMENT ON COLUMN "season_rate"."created_by" IS '생성자 ID (user.id 소프트 참조)';
COMMENT ON COLUMN "season_rate"."updated_at" IS '수정일시';
COMMENT ON COLUMN "season_rate"."updated_by" IS '수정자 ID (user.id 소프트 참조)';

CREATE INDEX "season_rate_room_id_idx"    ON "season_rate" ("room_id");
CREATE INDEX "season_rate_date_range_idx" ON "season_rate" ("start_date", "end_date");

-- ===========================================================================
-- notice (공지사항)
-- ===========================================================================
CREATE TABLE "notice" (
  "id"         BIGSERIAL PRIMARY KEY,
  "title"      TEXT NOT NULL,
  "body"       TEXT NOT NULL,
  "pinned_yn"  CHAR(1) NOT NULL DEFAULT 'N' CONSTRAINT "notice_pinned_yn_chk" CHECK ("pinned_yn" IN ('Y','N')),
  "open_yn"  CHAR(1) NOT NULL DEFAULT 'Y' CONSTRAINT "notice_open_yn_chk"  CHECK ("open_yn"  IN ('Y','N')),
  "author_id"  BIGINT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT current_kst_timestamp(),
  "created_by" BIGINT,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT current_kst_timestamp(),
  "updated_by" BIGINT,
  CONSTRAINT "notice_author_id_fkey"
    FOREIGN KEY ("author_id") REFERENCES "user"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE
);

COMMENT ON TABLE  "notice"             IS '공지사항';
COMMENT ON COLUMN "notice"."id"        IS '공지사항 고유 ID';
COMMENT ON COLUMN "notice"."title"     IS '제목';
COMMENT ON COLUMN "notice"."body"      IS '본문 (HTML 또는 Markdown)';
COMMENT ON COLUMN "notice"."pinned_yn" IS '상단 고정 여부 (Y: 고정, N: 일반)';
COMMENT ON COLUMN "notice"."open_yn" IS '공개 여부 (Y: 공개, N: 비공개)';
COMMENT ON COLUMN "notice"."author_id" IS '작성자 ID (user.id, 삭제 불가)';
COMMENT ON COLUMN "notice"."created_at" IS '생성일시';
COMMENT ON COLUMN "notice"."created_by" IS '생성자 ID (user.id 소프트 참조)';
COMMENT ON COLUMN "notice"."updated_at" IS '수정일시';
COMMENT ON COLUMN "notice"."updated_by" IS '수정자 ID (user.id 소프트 참조)';

CREATE INDEX "notice_pinned_yn_created_at_idx" ON "notice" ("pinned_yn", "created_at");

-- ===========================================================================
-- gallery_item (포토갤러리)
-- ===========================================================================
CREATE TABLE "gallery_item" (
  "id"          BIGSERIAL PRIMARY KEY,
  "title"       TEXT,
  "description" TEXT,
  "image_id"    BIGINT NOT NULL,
  "active_yn"   CHAR(1) NOT NULL DEFAULT 'Y' CONSTRAINT "gallery_item_active_yn_chk" CHECK ("active_yn" IN ('Y','N')),
  "sort_order"  INTEGER NOT NULL DEFAULT 0,
  "created_at"  TIMESTAMP(3) NOT NULL DEFAULT current_kst_timestamp(),
  "created_by"  BIGINT,
  "updated_at"  TIMESTAMP(3) NOT NULL DEFAULT current_kst_timestamp(),
  "updated_by"  BIGINT
);

COMMENT ON TABLE  "gallery_item"               IS '포토갤러리 항목';
COMMENT ON COLUMN "gallery_item"."id"          IS '갤러리 항목 고유 ID';
COMMENT ON COLUMN "gallery_item"."title"       IS '사진 제목 (선택)';
COMMENT ON COLUMN "gallery_item"."description" IS '사진 설명 (선택)';
COMMENT ON COLUMN "gallery_item"."image_id"    IS '이미지 ID (image.id 소프트 참조)';
COMMENT ON COLUMN "gallery_item"."active_yn"   IS '노출 여부 (Y: 노출, N: 숨김)';
COMMENT ON COLUMN "gallery_item"."sort_order"  IS '갤러리 정렬 순서 (오름차순)';
COMMENT ON COLUMN "gallery_item"."created_at"  IS '생성일시';
COMMENT ON COLUMN "gallery_item"."created_by"  IS '생성자 ID (user.id 소프트 참조)';
COMMENT ON COLUMN "gallery_item"."updated_at"  IS '수정일시';
COMMENT ON COLUMN "gallery_item"."updated_by"  IS '수정자 ID (user.id 소프트 참조)';

CREATE INDEX "gallery_item_active_yn_sort_order_idx" ON "gallery_item" ("active_yn", "sort_order");

-- ===========================================================================
-- facility (마을시설 / 주변관광지)
-- ===========================================================================
CREATE TABLE "facility" (
  "id"            BIGSERIAL PRIMARY KEY,
  "kind"          facility_kind NOT NULL,
  "name"          TEXT NOT NULL,
  "summary"       TEXT,
  "description"   TEXT NOT NULL,
  "address"       JSONB,
  "latitude"      DOUBLE PRECISION,
  "longitude"     DOUBLE PRECISION,
  "main_image_id" BIGINT,
  "image_ids"     BIGINT[] NOT NULL DEFAULT ARRAY[]::BIGINT[],
  "main_open_yn"  CHAR(1) NOT NULL DEFAULT 'N' CONSTRAINT "facility_main_open_yn_chk" CHECK ("main_open_yn" IN ('Y','N')),
  "active_yn"     CHAR(1) NOT NULL DEFAULT 'Y' CONSTRAINT "facility_active_yn_chk"   CHECK ("active_yn"   IN ('Y','N')),
  "sort_order"    INTEGER NOT NULL DEFAULT 0,
  "created_at"    TIMESTAMP(3) NOT NULL DEFAULT current_kst_timestamp(),
  "created_by"    BIGINT,
  "updated_at"    TIMESTAMP(3) NOT NULL DEFAULT current_kst_timestamp(),
  "updated_by"    BIGINT
);

COMMENT ON TABLE  "facility"                IS '마을시설 및 주변관광지';
COMMENT ON COLUMN "facility"."id"           IS '시설 고유 ID';
COMMENT ON COLUMN "facility"."kind"         IS '구분 (VILLAGE: 마을시설, NEARBY: 주변관광지)';
COMMENT ON COLUMN "facility"."name"         IS '시설명';
COMMENT ON COLUMN "facility"."summary"      IS '한 줄 요약';
COMMENT ON COLUMN "facility"."description"  IS '상세 설명';
COMMENT ON COLUMN "facility"."address"      IS '주소 JSON ({road, detail, zip_code})';
COMMENT ON COLUMN "facility"."latitude"     IS '위도 (지도 마커)';
COMMENT ON COLUMN "facility"."longitude"    IS '경도 (지도 마커)';
COMMENT ON COLUMN "facility"."main_image_id" IS '대표 이미지 ID (image.id 소프트 참조)';
COMMENT ON COLUMN "facility"."image_ids"    IS '추가 이미지 ID 목록 (image.id 소프트 참조)';
COMMENT ON COLUMN "facility"."main_open_yn" IS '메인 페이지 노출 여부 (Y: 노출, N: 미노출)';
COMMENT ON COLUMN "facility"."active_yn"    IS '활성화(공개) 여부 (Y: 공개, N: 비공개)';
COMMENT ON COLUMN "facility"."sort_order"   IS '목록 정렬 순서 (오름차순)';
COMMENT ON COLUMN "facility"."created_at"   IS '생성일시';
COMMENT ON COLUMN "facility"."created_by"   IS '생성자 ID (user.id 소프트 참조)';
COMMENT ON COLUMN "facility"."updated_at"   IS '수정일시';
COMMENT ON COLUMN "facility"."updated_by"   IS '수정자 ID (user.id 소프트 참조)';

CREATE INDEX "facility_kind_active_yn_sort_order_idx" ON "facility" ("kind", "active_yn", "sort_order");

-- ===========================================================================
-- banner (메인 배너)
-- ===========================================================================
CREATE TABLE "banner" (
  "id"         BIGSERIAL PRIMARY KEY,
  "title"      TEXT NOT NULL,
  "subtitle"   TEXT,
  "image_id"   BIGINT NOT NULL,
  "link_type"  banner_link_type NOT NULL DEFAULT 'NONE',
  "link_value" TEXT,
  "active_yn"  CHAR(1) NOT NULL DEFAULT 'Y' CONSTRAINT "banner_active_yn_chk" CHECK ("active_yn" IN ('Y','N')),
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT current_kst_timestamp(),
  "created_by" BIGINT,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT current_kst_timestamp(),
  "updated_by" BIGINT
);

COMMENT ON TABLE  "banner"              IS '메인 페이지 배너';
COMMENT ON COLUMN "banner"."id"         IS '배너 고유 ID';
COMMENT ON COLUMN "banner"."title"      IS '배너 제목';
COMMENT ON COLUMN "banner"."subtitle"   IS '배너 부제목 (선택)';
COMMENT ON COLUMN "banner"."image_id"   IS '배너 이미지 ID (image.id 소프트 참조)';
COMMENT ON COLUMN "banner"."link_type"  IS '링크 유형 (NONE·PROGRAM·ACCOMMODATION·NOTICE·FACILITY·URL)';
COMMENT ON COLUMN "banner"."link_value" IS '링크 대상 ID 또는 외부 URL (link_type=NONE이면 null)';
COMMENT ON COLUMN "banner"."active_yn"  IS '노출 여부 (Y: 노출, N: 숨김)';
COMMENT ON COLUMN "banner"."sort_order" IS '배너 정렬 순서 (오름차순)';
COMMENT ON COLUMN "banner"."created_at" IS '생성일시';
COMMENT ON COLUMN "banner"."created_by" IS '생성자 ID (user.id 소프트 참조)';
COMMENT ON COLUMN "banner"."updated_at" IS '수정일시';
COMMENT ON COLUMN "banner"."updated_by" IS '수정자 ID (user.id 소프트 참조)';

CREATE INDEX "banner_active_yn_sort_order_idx" ON "banner" ("active_yn", "sort_order");

-- ===========================================================================
-- village_profile (마을소개 / 오시는 길)
-- ===========================================================================
CREATE TABLE "village_profile" (
  "id"          BIGSERIAL PRIMARY KEY,
  "name"        TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "address"     JSONB NOT NULL,
  "latitude"    DOUBLE PRECISION,
  "longitude"   DOUBLE PRECISION,
  "phone"       TEXT,
  "email"       TEXT,
  "image_ids"   BIGINT[] NOT NULL DEFAULT ARRAY[]::BIGINT[],
  "created_at"  TIMESTAMP(3) NOT NULL DEFAULT current_kst_timestamp(),
  "created_by"  BIGINT,
  "updated_at"  TIMESTAMP(3) NOT NULL DEFAULT current_kst_timestamp(),
  "updated_by"  BIGINT
);

COMMENT ON TABLE  "village_profile"               IS '마을 소개 및 오시는 길 (단일 행 운영 권장)';
COMMENT ON COLUMN "village_profile"."id"          IS '프로필 고유 ID';
COMMENT ON COLUMN "village_profile"."name"        IS '마을명';
COMMENT ON COLUMN "village_profile"."description" IS '마을 소개 본문';
COMMENT ON COLUMN "village_profile"."address"     IS '주소 JSON ({road, detail, zip_code})';
COMMENT ON COLUMN "village_profile"."latitude"    IS '위도 (지도 마커)';
COMMENT ON COLUMN "village_profile"."longitude"   IS '경도 (지도 마커)';
COMMENT ON COLUMN "village_profile"."phone"       IS '대표 전화번호';
COMMENT ON COLUMN "village_profile"."email"       IS '대표 이메일';
COMMENT ON COLUMN "village_profile"."image_ids"   IS '소개 이미지 ID 목록 (image.id 소프트 참조)';
COMMENT ON COLUMN "village_profile"."created_at"  IS '생성일시';
COMMENT ON COLUMN "village_profile"."created_by"  IS '생성자 ID (user.id 소프트 참조)';
COMMENT ON COLUMN "village_profile"."updated_at"  IS '수정일시';
COMMENT ON COLUMN "village_profile"."updated_by"  IS '수정자 ID (user.id 소프트 참조)';

-- ===========================================================================
-- refund_policy (환불 정책)
-- ===========================================================================
CREATE TABLE "refund_policy" (
  "id"          BIGSERIAL PRIMARY KEY,
  "name"        TEXT NOT NULL,
  "description" TEXT,
  "use_yn"   CHAR(1) NOT NULL DEFAULT 'Y' CONSTRAINT "refund_policy_use_yn_chk" CHECK ("use_yn" IN ('Y','N')),
  "created_at"  TIMESTAMP(3) NOT NULL DEFAULT current_kst_timestamp(),
  "created_by"  BIGINT,
  "updated_at"  TIMESTAMP(3) NOT NULL DEFAULT current_kst_timestamp(),
  "updated_by"  BIGINT
);

COMMENT ON TABLE  "refund_policy"              IS '환불 정책 (여러 정책 정의 가능, 예약 시 적용 정책 스냅샷)';
COMMENT ON COLUMN "refund_policy"."id"         IS '환불 정책 고유 ID';
COMMENT ON COLUMN "refund_policy"."name"       IS '정책명 (예: 기본 환불 정책)';
COMMENT ON COLUMN "refund_policy"."description" IS '정책 설명';
COMMENT ON COLUMN "refund_policy"."use_yn"  IS '사용 여부 (Y: 사용, N: 미사용)';
COMMENT ON COLUMN "refund_policy"."created_at" IS '생성일시';
COMMENT ON COLUMN "refund_policy"."created_by" IS '생성자 ID (user.id 소프트 참조)';
COMMENT ON COLUMN "refund_policy"."updated_at" IS '수정일시';
COMMENT ON COLUMN "refund_policy"."updated_by" IS '수정자 ID (user.id 소프트 참조)';

-- ===========================================================================
-- refund_policy_rule (환불 정책 규칙)
-- ===========================================================================
CREATE TABLE "refund_policy_rule" (
  "id"           BIGSERIAL PRIMARY KEY,
  "policy_id"    BIGINT NOT NULL,
  "days_before"  INTEGER NOT NULL,
  "refund_rate"  INTEGER NOT NULL,
  "description"  TEXT,
  "sort_order"   INTEGER NOT NULL DEFAULT 0,
  "created_at"   TIMESTAMP(3) NOT NULL DEFAULT current_kst_timestamp(),
  "created_by"   BIGINT,
  "updated_at"   TIMESTAMP(3) NOT NULL DEFAULT current_kst_timestamp(),
  "updated_by"   BIGINT,
  CONSTRAINT "refund_policy_rule_policy_id_fkey"
    FOREIGN KEY ("policy_id") REFERENCES "refund_policy"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "refund_policy_rule_rate_chk"
    CHECK ("refund_rate" BETWEEN 0 AND 100),
  CONSTRAINT "refund_policy_rule_days_chk"
    CHECK ("days_before" >= 0)
);

COMMENT ON TABLE  "refund_policy_rule"                IS '환불 정책 상세 규칙 (취소 시점별 환불율)';
COMMENT ON COLUMN "refund_policy_rule"."id"           IS '규칙 고유 ID';
COMMENT ON COLUMN "refund_policy_rule"."policy_id"    IS '소속 환불 정책 ID (refund_policy.id)';
COMMENT ON COLUMN "refund_policy_rule"."days_before"  IS '이용일 기준 취소 가능 일수 (예: 7 = 7일 전까지)';
COMMENT ON COLUMN "refund_policy_rule"."refund_rate"  IS '환불율 (0~100%, 예: 100 = 전액환불, 0 = 환불불가)';
COMMENT ON COLUMN "refund_policy_rule"."description"  IS '규칙 설명 (예: 7일 전 취소 시 100% 환불)';
COMMENT ON COLUMN "refund_policy_rule"."sort_order"   IS '규칙 정렬 순서 (days_before 내림차순 권장)';
COMMENT ON COLUMN "refund_policy_rule"."created_at"   IS '생성일시';
COMMENT ON COLUMN "refund_policy_rule"."created_by"   IS '생성자 ID (user.id 소프트 참조)';
COMMENT ON COLUMN "refund_policy_rule"."updated_at"   IS '수정일시';
COMMENT ON COLUMN "refund_policy_rule"."updated_by"   IS '수정자 ID (user.id 소프트 참조)';

CREATE INDEX "refund_policy_rule_policy_id_idx" ON "refund_policy_rule" ("policy_id");

-- ===========================================================================
-- reservation (숙박 + 체험 통합 예약 - 폴리모픽)
-- ===========================================================================
CREATE TABLE "reservation" (
  "id"              BIGSERIAL PRIMARY KEY,
  "kind"            reservation_kind NOT NULL,
  "status"          reservation_status NOT NULL DEFAULT 'PENDING',
  "applicant_name"  TEXT NOT NULL,
  "applicant_phone" TEXT NOT NULL,
  "applicant_email" TEXT,
  "user_id"         BIGINT,
  "target_id"       BIGINT NOT NULL,
  "target_name"     TEXT NOT NULL,
  "refund_policy_id" BIGINT,
  "session_id"      BIGINT,
  "room_id"         BIGINT,
  "room_name"       TEXT,
  "start_date"      TIMESTAMP(3) NOT NULL,
  "end_date"        TIMESTAMP(3),
  "guests"          INTEGER NOT NULL,
  "total_price"     INTEGER,
  "request_memo"    TEXT,
  "admin_memo"      TEXT,
  "created_at"      TIMESTAMP(3) NOT NULL DEFAULT current_kst_timestamp(),
  "created_by"      BIGINT,
  "updated_at"      TIMESTAMP(3) NOT NULL DEFAULT current_kst_timestamp(),
  "updated_by"      BIGINT,
  CONSTRAINT "reservation_refund_policy_id_fkey"
    FOREIGN KEY ("refund_policy_id") REFERENCES "refund_policy"("id")
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "reservation_session_id_fkey"
    FOREIGN KEY ("session_id") REFERENCES "program_session"("id")
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "reservation_room_id_fkey"
    FOREIGN KEY ("room_id") REFERENCES "room"("id")
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "reservation_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "user"("id")
    ON DELETE SET NULL ON UPDATE CASCADE
);

COMMENT ON TABLE  "reservation"                  IS '예약 (숙박·체험 통합, 폴리모픽 구조)';
COMMENT ON COLUMN "reservation"."id"             IS '예약 고유 ID';
COMMENT ON COLUMN "reservation"."kind"           IS '예약 유형 (ACCOMMODATION: 숙박, PROGRAM: 체험)';
COMMENT ON COLUMN "reservation"."status"         IS '예약 상태 (PENDING→REVIEWING→CONFIRMED→COMPLETED / CANCELLED)';
COMMENT ON COLUMN "reservation"."applicant_name"  IS '예약자 이름';
COMMENT ON COLUMN "reservation"."applicant_phone" IS '예약자 연락처';
COMMENT ON COLUMN "reservation"."applicant_email" IS '예약자 이메일 (선택)';
COMMENT ON COLUMN "reservation"."user_id"        IS '회원 ID (비회원·현장 예약 시 null)';
COMMENT ON COLUMN "reservation"."target_id"      IS '예약 대상 ID (accommodation.id 또는 program.id)';
COMMENT ON COLUMN "reservation"."target_name"    IS '예약 대상명 스냅샷 (변경 후에도 이력 보존)';
COMMENT ON COLUMN "reservation"."refund_policy_id" IS '예약 시점 적용 환불 정책 ID (refund_policy.id 소프트 참조)';
COMMENT ON COLUMN "reservation"."session_id"     IS '체험 회차 ID (체험 예약 시, program_session.id)';
COMMENT ON COLUMN "reservation"."room_id"        IS '객실 ID (숙박 예약 시, room.id)';
COMMENT ON COLUMN "reservation"."room_name"      IS '객실명 스냅샷 (변경 후에도 이력 보존)';
COMMENT ON COLUMN "reservation"."start_date"     IS '시작일 (숙박: 체크인일, 체험: 이용일)';
COMMENT ON COLUMN "reservation"."end_date"       IS '종료일 (숙박: 체크아웃일, 체험: null 가능)';
COMMENT ON COLUMN "reservation"."guests"         IS '인원 수';
COMMENT ON COLUMN "reservation"."total_price"    IS '총 요금 (원, 확정 전 null 가능)';
COMMENT ON COLUMN "reservation"."request_memo"   IS '예약자 요청사항';
COMMENT ON COLUMN "reservation"."admin_memo"     IS '관리자 메모 (내부용, 예약자에게 비공개)';
COMMENT ON COLUMN "reservation"."created_at"     IS '생성일시';
COMMENT ON COLUMN "reservation"."created_by"     IS '생성자 ID (user.id 소프트 참조)';
COMMENT ON COLUMN "reservation"."updated_at"     IS '수정일시';
COMMENT ON COLUMN "reservation"."updated_by"     IS '수정자 ID (user.id 소프트 참조)';

CREATE INDEX "reservation_kind_target_id_start_date_idx"
  ON "reservation" ("kind", "target_id", "start_date");
CREATE INDEX "reservation_applicant_name_phone_idx"
  ON "reservation" ("applicant_name", "applicant_phone");
CREATE INDEX "reservation_user_id_idx" ON "reservation" ("user_id");
CREATE INDEX "reservation_status_idx"  ON "reservation" ("status");

-- ===========================================================================
-- reservation_cancel (예약 취소 내역)
-- ===========================================================================
CREATE TABLE "reservation_cancel" (
  "id"              BIGSERIAL PRIMARY KEY,
  "reservation_id"  BIGINT NOT NULL,
  "cancel_type"     cancel_type NOT NULL,
  "cancel_reason"   TEXT,
  "original_price"  INTEGER,
  "refund_rate"     INTEGER,
  "refund_amount"   INTEGER,
  "refund_status"   refund_status NOT NULL DEFAULT 'PENDING',
  "policy_rule_id"  BIGINT,
  "refund_memo"     TEXT,
  "cancelled_at"    TIMESTAMP(3) NOT NULL DEFAULT current_kst_timestamp(),
  "created_at"      TIMESTAMP(3) NOT NULL DEFAULT current_kst_timestamp(),
  "created_by"      BIGINT,
  "updated_at"      TIMESTAMP(3) NOT NULL DEFAULT current_kst_timestamp(),
  "updated_by"      BIGINT,
  CONSTRAINT "reservation_cancel_reservation_id_fkey"
    FOREIGN KEY ("reservation_id") REFERENCES "reservation"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "reservation_cancel_refund_rate_chk"
    CHECK ("refund_rate" IS NULL OR "refund_rate" BETWEEN 0 AND 100)
);

COMMENT ON TABLE  "reservation_cancel"                    IS '예약 취소 내역 (취소 사유·환불 정보 기록)';
COMMENT ON COLUMN "reservation_cancel"."id"              IS '취소 내역 고유 ID';
COMMENT ON COLUMN "reservation_cancel"."reservation_id"  IS '취소 대상 예약 ID (reservation.id)';
COMMENT ON COLUMN "reservation_cancel"."cancel_type"     IS '취소 주체 (MEMBER: 회원 직접 취소, ADMIN: 관리자 취소)';
COMMENT ON COLUMN "reservation_cancel"."cancel_reason"   IS '취소 사유';
COMMENT ON COLUMN "reservation_cancel"."original_price"  IS '원래 결제 금액 (원, 취소 시점 스냅샷)';
COMMENT ON COLUMN "reservation_cancel"."refund_rate"     IS '적용된 환불율 (0~100%, null이면 현장결제 등 환불 해당없음)';
COMMENT ON COLUMN "reservation_cancel"."refund_amount"   IS '실제 환불 금액 (원)';
COMMENT ON COLUMN "reservation_cancel"."refund_status"   IS '환불 상태 (PENDING: 대기, COMPLETED: 완료, SKIPPED: 환불없음)';
COMMENT ON COLUMN "reservation_cancel"."policy_rule_id"  IS '적용된 환불 정책 규칙 ID (refund_policy_rule.id 소프트 참조)';
COMMENT ON COLUMN "reservation_cancel"."refund_memo"     IS '관리자 환불 처리 메모 (내부용)';
COMMENT ON COLUMN "reservation_cancel"."cancelled_at"    IS '취소 처리 일시';
COMMENT ON COLUMN "reservation_cancel"."created_at"      IS '생성일시';
COMMENT ON COLUMN "reservation_cancel"."created_by"      IS '생성자 ID (user.id 소프트 참조)';
COMMENT ON COLUMN "reservation_cancel"."updated_at"      IS '수정일시';
COMMENT ON COLUMN "reservation_cancel"."updated_by"      IS '수정자 ID (user.id 소프트 참조)';

CREATE INDEX "reservation_cancel_reservation_id_idx" ON "reservation_cancel" ("reservation_id");
CREATE INDEX "reservation_cancel_refund_status_idx"  ON "reservation_cancel" ("refund_status");

-- ===========================================================================
-- refresh_token (JWT 갱신 - 웹 + 모바일 세션)
-- ===========================================================================
CREATE TABLE "refresh_token" (
  "id"         BIGSERIAL PRIMARY KEY,
  "user_id"    BIGINT NOT NULL,
  "token_hash" TEXT NOT NULL UNIQUE,
  "user_agent" TEXT,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "revoked_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT current_kst_timestamp(),
  "created_by" BIGINT,
  CONSTRAINT "refresh_token_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "user"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

COMMENT ON TABLE  "refresh_token"               IS 'JWT Refresh Token (웹·모바일 세션 유지)';
COMMENT ON COLUMN "refresh_token"."id"          IS '토큰 고유 ID';
COMMENT ON COLUMN "refresh_token"."user_id"     IS '토큰 소유 사용자 ID (user.id)';
COMMENT ON COLUMN "refresh_token"."token_hash"  IS 'SHA-256 해시된 리프레시 토큰 값';
COMMENT ON COLUMN "refresh_token"."user_agent"  IS '발급 시 클라이언트 User-Agent';
COMMENT ON COLUMN "refresh_token"."expires_at"  IS '토큰 만료일시';
COMMENT ON COLUMN "refresh_token"."revoked_at"  IS '토큰 폐기일시 (로그아웃·재발급 시 기록)';
COMMENT ON COLUMN "refresh_token"."created_at"  IS '발급일시';
COMMENT ON COLUMN "refresh_token"."created_by"  IS '생성자 ID (user.id 소프트 참조)';

CREATE INDEX "refresh_token_user_id_idx" ON "refresh_token" ("user_id");

-- ===========================================================================
-- push_token (FCM 디바이스 토큰 - 예약확정 / 공지 푸시)
-- ===========================================================================
CREATE TABLE "push_token" (
  "id"         BIGSERIAL PRIMARY KEY,
  "user_id"    BIGINT,
  "token"      TEXT NOT NULL UNIQUE,
  "platform"   TEXT NOT NULL,
  "active_yn"  CHAR(1) NOT NULL DEFAULT 'Y' CONSTRAINT "push_token_active_yn_chk" CHECK ("active_yn" IN ('Y','N')),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT current_kst_timestamp(),
  "created_by" BIGINT,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT current_kst_timestamp(),
  "updated_by" BIGINT,
  CONSTRAINT "push_token_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "user"("id")
    ON DELETE SET NULL ON UPDATE CASCADE
);

COMMENT ON TABLE  "push_token"             IS 'FCM 디바이스 푸시 토큰 (모바일 앱)';
COMMENT ON COLUMN "push_token"."id"        IS '토큰 고유 ID';
COMMENT ON COLUMN "push_token"."user_id"   IS '토큰 소유 사용자 ID (비로그인 기기: null)';
COMMENT ON COLUMN "push_token"."token"     IS 'FCM 디바이스 토큰';
COMMENT ON COLUMN "push_token"."platform"  IS '플랫폼 (ios | android)';
COMMENT ON COLUMN "push_token"."active_yn" IS '활성 여부 (Y: 활성, N: 비활성 — 앱 삭제·로그아웃 시 N)';
COMMENT ON COLUMN "push_token"."created_at" IS '등록일시';
COMMENT ON COLUMN "push_token"."created_by" IS '생성자 ID (user.id 소프트 참조)';
COMMENT ON COLUMN "push_token"."updated_at" IS '수정일시';
COMMENT ON COLUMN "push_token"."updated_by" IS '수정자 ID (user.id 소프트 참조)';

CREATE INDEX "push_token_user_id_idx" ON "push_token" ("user_id");

-- ===========================================================================
-- updated_at auto refresh (DB-level audit timestamp)
-- ===========================================================================
DO $$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'user',
    'image',
    'code_group',
    'code',
    'menu_group',
    'menu',
    'permission',
    'program',
    'program_session',
    'accommodation',
    'room',
    'season_rate',
    'notice',
    'gallery_item',
    'facility',
    'banner',
    'village_profile',
    'refund_policy',
    'refund_policy_rule',
    'reservation',
    'reservation_cancel',
    'push_token'
  ] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I', table_name || '_set_updated_at_kst', table_name);
    EXECUTE format(
      'CREATE TRIGGER %I BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION set_updated_at_kst()',
      table_name || '_set_updated_at_kst',
      table_name
    );
  END LOOP;
END;
$$;

-- ===========================================================================
-- Double-booking guard
-- 같은 객실·겹치는 날짜에 CONFIRMED 예약 중복 차단 (DB 레벨 보장)
-- ===========================================================================
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "reservation"
  ADD CONSTRAINT "reservation_room_no_overlap"
  EXCLUDE USING gist (
    "room_id" WITH =,
    tsrange("start_date", "end_date") WITH &&
  )
  WHERE (
    "kind"     = 'ACCOMMODATION'
    AND "room_id"  IS NOT NULL
    AND "end_date" IS NOT NULL
    AND "status"   = 'CONFIRMED'
  );

-- ===========================================================================
-- Notes
-- ===========================================================================
-- 1. All identifiers (tables, enums, columns, constraints, indexes) = snake_case.
--    In Prisma: each model uses @@map("table_name"), each field uses @map("col_name").
-- 2. Boolean columns: *_yn CHAR(1), values Y/N only (enforced by CHECK constraint).
--    Naming: is_active → use_yn, is_featured → featured_yn, is_pinned → pinned_yn.
-- 3. created_by / updated_by: nullable BIGINT soft reference to user.id (no physical FK).
--    User deletion must not cascade-null audit columns; values are read-only history.
-- 4. created_at / updated_at are maintained by DB defaults and triggers in Asia/Seoul local time.
-- 5. reservation uses a polymorphic pattern (kind + target_id).
--    Only room_id and user_id carry physical FK constraints.
-- 6. main_image_id / image_ids are soft references (no FK) — referential
--    integrity enforced at the application layer.
-- 7. user_id on reservation is nullable to allow walk-in / admin bookings.
-- 8. The overlap EXCLUDE guard fires only on CONFIRMED accommodation rows,
--    so PENDING/REVIEWING requests do not block each other.

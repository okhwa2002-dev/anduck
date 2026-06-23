-- =============================================================================
-- anduck_seed.sql — 샘플 데이터 (개발·테스트용)
-- 모든 사용자 비밀번호: password  (bcrypt $2b$10$, rounds=10)
-- =============================================================================

BEGIN;

-- =============================================================================
-- 1. image  (soft-ref 이므로 먼저 삽입)
-- =============================================================================
INSERT INTO "image" (url, alt, filename, content_type, size, updated_at) VALUES
  ('https://placehold.co/1200x800/4a7c59/white?text=황토방',     '황토방 전경',       'hwangto_main.jpg',   'image/jpeg', 204800, CURRENT_TIMESTAMP),  -- id 1
  ('https://placehold.co/1200x800/2d6a8f/white?text=수펜션',     '수펜션 전경',       'pension_main.jpg',   'image/jpeg', 204800, CURRENT_TIMESTAMP),  -- id 2
  ('https://placehold.co/800x600/6b8f4e/white?text=체험',        '체험 프로그램',      'program_main.jpg',   'image/jpeg', 153600, CURRENT_TIMESTAMP),  -- id 3
  ('https://placehold.co/800x600/8f6b2d/white?text=객실',        '객실 내부',         'room_interior.jpg',  'image/jpeg', 153600, CURRENT_TIMESTAMP),  -- id 4
  ('https://placehold.co/1920x600/2c5f2e/white?text=배너1',      '메인 배너 1',       'banner1.jpg',        'image/jpeg', 512000, CURRENT_TIMESTAMP),  -- id 5
  ('https://placehold.co/1920x600/1a3c5e/white?text=배너2',      '메인 배너 2',       'banner2.jpg',        'image/jpeg', 512000, CURRENT_TIMESTAMP),  -- id 6
  ('https://placehold.co/800x800/5e8c3b/white?text=마을전경',    '마을 전경',         'gallery1.jpg',       'image/jpeg', 204800, CURRENT_TIMESTAMP),  -- id 7
  ('https://placehold.co/800x800/3b5e8c/white?text=체험활동',    '체험 활동',         'gallery2.jpg',       'image/jpeg', 204800, CURRENT_TIMESTAMP),  -- id 8
  ('https://placehold.co/800x800/8c5e3b/white?text=황토내부',    '황토방 내부',       'gallery3.jpg',       'image/jpeg', 204800, CURRENT_TIMESTAMP),  -- id 9
  ('https://placehold.co/800x600/4a6741/white?text=시설',        '마을 시설',         'facility1.jpg',      'image/jpeg', 153600, CURRENT_TIMESTAMP);  -- id 10

-- =============================================================================
-- 2. user  (비밀번호: password)
-- =============================================================================
INSERT INTO "user" (login_id, email, password_hash, name, phone, user_type, updated_at) VALUES
  ('superadmin', 'super@anduck.kr', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LmTT.2ndps/', '슈퍼관리자', '010-0000-0001', 'SUPER_ADMIN', CURRENT_TIMESTAMP),
  ('admin',      'admin@anduck.kr', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LmTT.2ndps/', '관리자',    '010-0000-0002', 'ADMIN',       CURRENT_TIMESTAMP),
  ('hong',       'hong@anduck.kr',  '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LmTT.2ndps/', '홍길동',    '010-1234-5678', 'MEMBER',      CURRENT_TIMESTAMP),
  ('kim',        'kim@anduck.kr',   '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LmTT.2ndps/', '김영희',    '010-9876-5432', 'MEMBER',      CURRENT_TIMESTAMP);

-- =============================================================================
-- 3. code_group / code
-- =============================================================================
INSERT INTO "code_group" (group_code, group_name, description, sort_order, updated_at) VALUES
  ('AMENITY',       '편의시설',   '숙소 편의시설 코드',          1, CURRENT_TIMESTAMP),
  ('AVAILABLE_DAY', '운영요일',   '체험 프로그램 운영 가능 요일', 2, CURRENT_TIMESTAMP),
  ('PLATFORM',      '플랫폼',     '모바일 앱 플랫폼',            3, CURRENT_TIMESTAMP),
  ('CANCEL_REASON', '취소사유',   '예약 취소 사유 코드',          4, CURRENT_TIMESTAMP);

INSERT INTO "code" (group_id, code, name, sort_order, updated_at)
SELECT g.id, c.code, c.name, c.sort_order, CURRENT_TIMESTAMP
FROM "code_group" g,
  (VALUES
    ('AMENITY', 'WIFI',     '무선인터넷', 1), ('AMENITY', 'PARKING',  '주차장',    2),
    ('AMENITY', 'BBQ',      '바베큐',    3), ('AMENITY', 'KITCHEN',  '취사시설',  4),
    ('AMENITY', 'TV',       'TV',       5), ('AMENITY', 'AC',       '에어컨',    6),
    ('AMENITY', 'HEATING',  '난방',     7), ('AMENITY', 'BATHROOM', '개인욕실',  8)
  ) AS c(group_code, code, name, sort_order)
WHERE g.group_code = c.group_code;

INSERT INTO "code" (group_id, code, name, sort_order, updated_at)
SELECT g.id, c.code, c.name, c.sort_order, CURRENT_TIMESTAMP
FROM "code_group" g,
  (VALUES
    ('AVAILABLE_DAY', 'MON', '월요일', 1), ('AVAILABLE_DAY', 'TUE', '화요일', 2),
    ('AVAILABLE_DAY', 'WED', '수요일', 3), ('AVAILABLE_DAY', 'THU', '목요일', 4),
    ('AVAILABLE_DAY', 'FRI', '금요일', 5), ('AVAILABLE_DAY', 'SAT', '토요일', 6),
    ('AVAILABLE_DAY', 'SUN', '일요일', 7)
  ) AS c(group_code, code, name, sort_order)
WHERE g.group_code = c.group_code;

INSERT INTO "code" (group_id, code, name, sort_order, updated_at)
SELECT g.id, c.code, c.name, c.sort_order, CURRENT_TIMESTAMP
FROM "code_group" g,
  (VALUES
    ('PLATFORM', 'IOS', 'iOS', 1), ('PLATFORM', 'ANDROID', 'Android', 2)
  ) AS c(group_code, code, name, sort_order)
WHERE g.group_code = c.group_code;

INSERT INTO "code" (group_id, code, name, sort_order, updated_at)
SELECT g.id, c.code, c.name, c.sort_order, CURRENT_TIMESTAMP
FROM "code_group" g,
  (VALUES
    ('CANCEL_REASON', 'PERSONAL_SCHEDULE', '개인 일정 변경', 1),
    ('CANCEL_REASON', 'WEATHER',           '기상 악화',     2),
    ('CANCEL_REASON', 'HEALTH',            '건강 문제',     3),
    ('CANCEL_REASON', 'OTHER',             '기타',         4)
  ) AS c(group_code, code, name, sort_order)
WHERE g.group_code = c.group_code;

-- =============================================================================
-- 4. menu_group / menu
-- =============================================================================
INSERT INTO "menu_group" (group_code, group_name, description, sort_order, updated_at) VALUES
  ('WEB_PUBLIC', '웹 공개 메뉴',   '웹사이트 일반 메뉴', 1, CURRENT_TIMESTAMP),
  ('WEB_ADMIN',  '웹 관리자 메뉴', '관리자 대시보드 메뉴', 2, CURRENT_TIMESTAMP);

-- WEB_PUBLIC 최상위 메뉴 (1depth)
INSERT INTO "menu" (group_id, menu_code, menu_name, path, sort_order, updated_at)
SELECT g.id, m.menu_code, m.menu_name, m.path::TEXT, m.sort_order, CURRENT_TIMESTAMP
FROM "menu_group" g,
  (VALUES
    ('HOME',        '홈',          '/',   1),
    ('ABOUT',       '안덕마을소개', NULL, 2),
    ('PROGRAMS',    '체험프로그램', NULL, 3),
    ('STAY',        '숙박안내',     NULL, 4),
    ('ENJOY',       '200%즐기기',   NULL, 5),
    ('COMMUNITY',   '나눔마당',     NULL, 6),
    ('RESERVATION', '숙박예약',     NULL, 7)
  ) AS m(menu_code, menu_name, path, sort_order)
WHERE g.group_code = 'WEB_PUBLIC';

-- WEB_PUBLIC 하위 메뉴 (2depth)
INSERT INTO "menu" (group_id, parent_id, menu_code, menu_name, path, sort_order, updated_at)
SELECT mg.id, p.id, m.menu_code, m.menu_name, m.path, m.sort_order, CURRENT_TIMESTAMP
FROM (VALUES
  ('ABOUT_VILLAGE',    'ABOUT',       '마을소개',   '/about/village',     1),
  ('ABOUT_DIRECTIONS', 'ABOUT',       '오시는길',   '/about/directions',  2),
  ('PROGRAMS_GUIDE',   'PROGRAMS',    '체험안내',   '/programs',          1),
  ('STAY_HWANGTO',     'STAY',        '황토방',     '/stay/hwangto',      1),
  ('STAY_PENSION',     'STAY',        '수펜션',     '/stay/pension',      2),
  ('ENJOY_FACILITIES', 'ENJOY',       '마을시설',   '/enjoy/facilities',  1),
  ('ENJOY_TOURISM',    'ENJOY',       '주변관광지', '/enjoy/tourism',     2),
  ('COMM_NOTICE',      'COMMUNITY',   '공지사항',   '/community/notice',  1),
  ('COMM_GALLERY',     'COMMUNITY',   '포토갤러리', '/community/gallery', 2),
  ('BOOK',             'RESERVATION', '예약',       '/reservation',       1)
) AS m(menu_code, parent_code, menu_name, path, sort_order)
JOIN "menu_group" mg ON mg.group_code = 'WEB_PUBLIC'
JOIN "menu" p ON p.menu_code = m.parent_code AND p.group_id = mg.id;

INSERT INTO "menu" (group_id, menu_code, menu_name, path, sort_order, updated_at)
SELECT g.id, m.menu_code, m.menu_name, m.path, m.sort_order, CURRENT_TIMESTAMP
FROM "menu_group" g,
  (VALUES
    ('ADMIN_DASHBOARD',     '대시보드',   '/admin',               1),
    ('ADMIN_RESERVATIONS',  '예약관리',   '/admin/reservations',  2),
    ('ADMIN_PROGRAMS',      '체험관리',   '/admin/programs',      3),
    ('ADMIN_ACCOMMODATION', '숙소관리',   '/admin/accommodation', 4),
    ('ADMIN_NOTICES',       '공지관리',   '/admin/notices',       5),
    ('ADMIN_GALLERY',       '갤러리관리', '/admin/gallery',       6),
    ('ADMIN_USERS',         '회원관리',      '/admin/users',      7),
    ('ADMIN_VILLAGE',       '마을소개관리',  '/admin/village',    8),
    ('ADMIN_FACILITIES',    '시설관리',      '/admin/facilities', 9)
  ) AS m(menu_code, menu_name, path, sort_order)
WHERE g.group_code = 'WEB_ADMIN';

-- =============================================================================
-- 5. permission
-- =============================================================================
INSERT INTO "permission" (code, name, description, sort_order, updated_at) VALUES
  ('SUPER_ADMIN', '슈퍼관리자', '전체 관리자 메뉴 접근 권한', 1, CURRENT_TIMESTAMP),
  ('ADMIN',       '관리자',     '관리자 메뉴 접근 권한',       2, CURRENT_TIMESTAMP),
  ('MEMBER',      '일반사용자', '공개 메뉴 접근 권한',         3, CURRENT_TIMESTAMP);

-- 5-1. user_permission (user_type별 1:1 매핑)
-- SUPER_ADMIN
INSERT INTO "user_permission" (user_id, permission_id)
SELECT u.id, p.id FROM "user" u, "permission" p
WHERE u.user_type = 'SUPER_ADMIN' AND p.code = 'SUPER_ADMIN';

-- ADMIN
INSERT INTO "user_permission" (user_id, permission_id)
SELECT u.id, p.id FROM "user" u, "permission" p
WHERE u.user_type = 'ADMIN' AND p.code = 'ADMIN';

-- MEMBER
INSERT INTO "user_permission" (user_id, permission_id)
SELECT u.id, p.id FROM "user" u, "permission" p
WHERE u.user_type = 'MEMBER' AND p.code = 'MEMBER';

-- 5-2. permission_menu (권한 → 메뉴 매핑)
-- 슈퍼관리자·관리자 → WEB_ADMIN 전체
INSERT INTO "permission_menu" (permission_id, menu_id)
SELECT p.id, m.id
FROM "permission" p, "menu" m
JOIN "menu_group" mg ON m.group_id = mg.id AND mg.group_code = 'WEB_ADMIN'
WHERE p.code IN ('SUPER_ADMIN', 'ADMIN');

-- 일반사용자 → WEB_PUBLIC 전체 (로그인 사용자가 listMenusByUser로 공개 메뉴 조회 시 필요)
INSERT INTO "permission_menu" (permission_id, menu_id)
SELECT p.id, m.id
FROM "permission" p, "menu" m
JOIN "menu_group" mg ON m.group_id = mg.id AND mg.group_code = 'WEB_PUBLIC'
WHERE p.code = 'MEMBER';

-- =============================================================================
-- 6. program / program_session
-- =============================================================================
INSERT INTO "program" (name, summary, description, duration_minutes, price_per_person,
  min_participants, max_participants, available_days, operating_hours, preparation_notes,
  main_image_id, featured_yn, sort_order, updated_at) VALUES
  (
    '황토염색 체험',
    '천연 황토로 직접 물드리는 전통 염색 체험',
    '황토는 예로부터 한국 전통 염색에 사용되어 온 천연 재료입니다. 직접 황토 물감을 만들고 천에 물을 들이는 전통 방식을 체험해 보세요. 완성된 작품은 가지고 돌아가실 수 있습니다.',
    120, 25000, 2, 20, ARRAY['TUE','THU','SAT','SUN']::TEXT[], '10:00~12:00',
    '편하게 입을 수 있는 옷 착용 (앞치마 제공)',
    3, 'Y', 1, CURRENT_TIMESTAMP
  ),
  (
    '전통 두부 만들기',
    '국산 콩으로 직접 만드는 손두부 체험',
    '직접 재배한 국산 콩을 갈아서 전통 방식으로 두부를 만들어 봅니다. 체험 후 직접 만든 두부로 된장찌개를 끓여 함께 식사를 즐깁니다.',
    150, 20000, 4, 16, ARRAY['SAT','SUN']::TEXT[], '09:00~11:30',
    '특별한 준비물 없음 (앞치마 제공)',
    3, 'Y', 2, CURRENT_TIMESTAMP
  ),
  (
    '자연 생태 트레킹',
    '마을 주변 산과 계곡을 걷는 자연 생태 탐방',
    '마을 전문 해설사와 함께 주변 산과 계곡을 걸으며 다양한 동식물을 관찰합니다. 봄 야생화, 여름 계곡, 가을 단풍을 계절마다 다르게 즐길 수 있습니다.',
    180, 15000, 2, 30, ARRAY['MON','WED','FRI','SAT','SUN']::TEXT[], '09:00~12:00',
    '운동화·긴 바지 착용 권장, 물 지참',
    3, 'N', 3, CURRENT_TIMESTAMP
  );

-- program_session (2026년 7월 회차)
INSERT INTO "program_session" (program_id, session_date, start_time, capacity, updated_at)
SELECT p.id, s.session_date::DATE, s.start_time, s.capacity, CURRENT_TIMESTAMP
FROM "program" p,
  (VALUES
    ('황토염색 체험',    '2026-07-05', '10:00', 15),
    ('황토염색 체험',    '2026-07-12', '10:00', 15),
    ('황토염색 체험',    '2026-07-19', '10:00', 15),
    ('황토염색 체험',    '2026-07-26', '10:00', 15),
    ('전통 두부 만들기', '2026-07-05', '09:00', 12),
    ('전통 두부 만들기', '2026-07-06', '09:00', 12),
    ('전통 두부 만들기', '2026-07-12', '09:00', 12),
    ('전통 두부 만들기', '2026-07-19', '09:00', 12),
    ('자연 생태 트레킹', '2026-07-06', '09:00', NULL),
    ('자연 생태 트레킹', '2026-07-13', '09:00', NULL),
    ('자연 생태 트레킹', '2026-07-20', '09:00', NULL)
  ) AS s(program_name, session_date, start_time, capacity)
WHERE p.name = s.program_name;

-- =============================================================================
-- 7. accommodation / room / season_rate
-- =============================================================================
INSERT INTO "accommodation" (type, name, summary, description, amenities,
  check_in_time, check_out_time, main_image_id, featured_yn, sort_order, updated_at) VALUES
  (
    'HWANGTO', '황토방 단지',
    '자연 황토로 지은 전통 황토방',
    '100% 천연 황토로 지어진 전통 황토방입니다. 황토의 원적외선 방사 효과로 숙면과 건강 회복에 탁월합니다. 넓은 마당과 바베큐 시설을 갖추고 있어 가족 단위 여행객에게 최적입니다.',
    ARRAY['BBQ','PARKING','KITCHEN','HEATING']::TEXT[], '15:00', '11:00', 1, 'Y', 1, CURRENT_TIMESTAMP
  ),
  (
    'PENSION', '안덕 수펜션',
    '계곡 바로 옆 힐링 수펜션',
    '맑은 계곡물이 흐르는 자연 속 수펜션입니다. 각 객실마다 개인 바베큐 시설과 야외 테라스가 있으며, 계곡에서 물놀이를 즐기실 수 있습니다.',
    ARRAY['BBQ','PARKING','AC','TV','BATHROOM','WIFI']::TEXT[], '14:00', '11:00', 2, 'Y', 2, CURRENT_TIMESTAMP
  );

-- rooms — 황토방 단지
INSERT INTO "room" (accommodation_id, name, description, base_guests, max_guests,
  weekday_price, weekend_price, main_image_id, sort_order, updated_at)
SELECT a.id, r.name, r.descr, r.base_guests, r.max_guests, r.weekday, r.weekend, 4, r.seq, CURRENT_TIMESTAMP
FROM "accommodation" a,
  (VALUES
    ('황토방 1호', '2인 기준 소규모 황토방. 아늑하고 포근한 분위기입니다.',          2, 4,  80000, 100000, 1),
    ('황토방 2호', '4인 기준 넓은 황토방. 가족 여행에 적합합니다.',                  4, 6, 120000, 150000, 2),
    ('황토방 3호', '6인 기준 대형 황토방. 단체·가족 모임에 최적입니다.',              6, 8, 160000, 200000, 3)
  ) AS r(name, descr, base_guests, max_guests, weekday, weekend, seq)
WHERE a.name = '황토방 단지';

-- rooms — 수펜션
INSERT INTO "room" (accommodation_id, name, description, base_guests, max_guests,
  weekday_price, weekend_price, main_image_id, sort_order, updated_at)
SELECT a.id, r.name, r.descr, r.base_guests, r.max_guests, r.weekday, r.weekend, 4, r.seq, CURRENT_TIMESTAMP
FROM "accommodation" a,
  (VALUES
    ('수펜션 A동', '계곡 전망 2인실. 커플·신혼여행 추천입니다.',                       2,  4, 100000, 130000, 1),
    ('수펜션 B동', '가족형 4인실. 테라스에서 계곡 소리를 들으며 쉬실 수 있습니다.',   4,  6, 140000, 180000, 2),
    ('수펜션 C동', '8인 대형 객실. 친구 모임·소규모 워크숍에 적합합니다.',            6, 10, 200000, 250000, 3)
  ) AS r(name, descr, base_guests, max_guests, weekday, weekend, seq)
WHERE a.name = '안덕 수펜션';

-- season_rate (2026 여름 성수기 — 전체 객실 적용)
INSERT INTO "season_rate" (name, start_date, end_date, room_id, price, updated_at) VALUES
  ('2026년 여름 성수기', '2026-07-25', '2026-08-17', NULL, 50000, CURRENT_TIMESTAMP);

-- =============================================================================
-- 8. notice
-- =============================================================================
INSERT INTO "notice" (title, body, pinned_yn, author_id, updated_at) VALUES
  (
    '안덕마을 체험·숙소 이용 안내',
    E'안덕마을에 오신 것을 환영합니다.\n\n체험 프로그램은 홈페이지를 통해 사전 예약 후 이용하실 수 있습니다.\n\n■ 체크인: 황토방 15:00 / 수펜션 14:00\n■ 체크아웃: 11:00\n■ 취사는 지정 구역에서만 가능합니다.\n■ 반려동물 동반은 불가합니다.\n\n문의: 061-000-0000',
    'Y',
    (SELECT id FROM "user" WHERE login_id = 'admin'),
    CURRENT_TIMESTAMP
  ),
  (
    '2026년 여름 성수기 예약 안내',
    E'2026년 여름 성수기(7/25 ~ 8/17) 예약이 시작되었습니다.\n성수기 기간에는 객실당 50,000원의 성수기 추가 요금이 발생합니다.\n\n조기 예약 시 우선 배정됩니다.',
    'N',
    (SELECT id FROM "user" WHERE login_id = 'admin'),
    CURRENT_TIMESTAMP
  ),
  (
    '홈페이지 오픈 안내',
    E'안덕마을 홈페이지가 새롭게 오픈하였습니다.\n예약·문의는 홈페이지를 이용해 주세요.',
    'N',
    (SELECT id FROM "user" WHERE login_id = 'admin'),
    CURRENT_TIMESTAMP
  );

-- =============================================================================
-- 9. gallery_item
-- =============================================================================
INSERT INTO "gallery_item" (title, description, image_id, sort_order, updated_at) VALUES
  ('마을 전경',     '안덕마을 전경',          7, 1, CURRENT_TIMESTAMP),
  ('황토염색 체험', '황토염색 체험 활동',     8, 2, CURRENT_TIMESTAMP),
  ('황토방 내부',   '아늑한 황토방 내부',     9, 3, CURRENT_TIMESTAMP),
  ('계곡 풍경',     '수펜션 앞 맑은 계곡',    7, 4, CURRENT_TIMESTAMP),
  ('두부 만들기',   '전통 손두부 만들기 체험', 8, 5, CURRENT_TIMESTAMP);

-- =============================================================================
-- 10. facility
-- =============================================================================
INSERT INTO "facility" (kind, name, summary, description, address, latitude, longitude,
  main_image_id, featured_yn, sort_order, updated_at) VALUES
  (
    'VILLAGE', '황토 공방',
    '황토 공예·염색 체험 시설',
    '전통 황토를 이용한 공예와 염색 체험 공방입니다. 전문 강사가 상주하여 초보자도 쉽게 참여할 수 있습니다.',
    '{"road":"전라남도 화순군 안덕길 1-1","zipCode":"58100"}'::jsonb,
    34.9847, 126.9846, 10, 'Y', 1, CURRENT_TIMESTAMP
  ),
  (
    'VILLAGE', '마을 공동 텃밭',
    '직접 가꾸고 수확하는 친환경 텃밭',
    '마을 공동으로 운영하는 친환경 텃밭입니다. 계절에 따라 다양한 채소를 재배하며 수확 체험이 가능합니다.',
    '{"road":"전라남도 화순군 안덕길 1-5","zipCode":"58100"}'::jsonb,
    34.9851, 126.9843, 10, 'N', 2, CURRENT_TIMESTAMP
  ),
  (
    'NEARBY', '화순 고인돌 유적지',
    '유네스코 세계문화유산 고인돌 유적',
    '화순 고인돌 유적은 유네스코 세계문화유산으로 지정된 선사시대 문화재입니다. 600여 기의 고인돌이 분포해 있으며 안덕마을에서 차로 15분 거리입니다.',
    '{"road":"전라남도 화순군 도곡면 효산리","zipCode":"58111"}'::jsonb,
    35.0107, 126.9371, 10, 'Y', 1, CURRENT_TIMESTAMP
  );

-- =============================================================================
-- 11. banner
-- =============================================================================
INSERT INTO "banner" (title, subtitle, image_id, link_type, link_value, sort_order, updated_at) VALUES
  ('안덕마을에 오신 것을 환영합니다', '자연과 함께하는 힐링 체험',        5, 'NONE',          NULL, 1, CURRENT_TIMESTAMP),
  ('여름 체험 프로그램 모집 중',      '황토염색·두부만들기·트레킹 체험',  6, 'PROGRAM',        NULL, 2, CURRENT_TIMESTAMP),
  ('수펜션 & 황토방 예약',           '깨끗한 자연 속 편안한 휴식',        5, 'ACCOMMODATION',  NULL, 3, CURRENT_TIMESTAMP);

-- =============================================================================
-- 12. village_profile
-- =============================================================================
INSERT INTO "village_profile" (name, description, address, latitude, longitude, phone, email, updated_at) VALUES
  (
    '안덕마을',
    '안덕마을은 전라남도 화순군에 위치한 친환경 농촌 체험 마을입니다. 청정 자연환경 속에서 전통 황토방 숙박, 다양한 농촌 체험, 자연 생태 탐방을 즐길 수 있습니다. 도시 일상에서 벗어나 자연과 함께하는 진정한 휴식을 경험해 보세요.',
    '{"road":"전라남도 화순군 안덕길 1","detail":"안덕마을 관리사무소","zipCode":"58100"}'::jsonb,
    34.9847, 126.9846, '061-000-0000', 'contact@anduck.kr', CURRENT_TIMESTAMP
  );

-- =============================================================================
-- 13. refund_policy / refund_policy_rule
-- =============================================================================
INSERT INTO "refund_policy" (name, description, updated_at) VALUES
  ('기본 환불 정책', '숙소 예약 취소 시 적용되는 기본 환불 규정',  CURRENT_TIMESTAMP),
  ('체험 환불 정책', '체험 프로그램 취소 시 적용되는 환불 규정', CURRENT_TIMESTAMP);

INSERT INTO "refund_policy_rule" (policy_id, days_before, refund_rate, description, sort_order, updated_at)
SELECT p.id, r.days_before, r.rate, r.descr, r.seq, CURRENT_TIMESTAMP
FROM "refund_policy" p,
  (VALUES
    (7, 100, '이용일 7일 전까지: 100% 환불', 1),
    (5, 80,  '이용일 5~6일 전: 80% 환불',   2),
    (3, 50,  '이용일 3~4일 전: 50% 환불',   3),
    (1, 20,  '이용일 1~2일 전: 20% 환불',   4),
    (0, 0,   '이용 당일: 환불 불가',         5)
  ) AS r(days_before, rate, descr, seq)
WHERE p.name = '기본 환불 정책';

INSERT INTO "refund_policy_rule" (policy_id, days_before, refund_rate, description, sort_order, updated_at)
SELECT p.id, r.days_before, r.rate, r.descr, r.seq, CURRENT_TIMESTAMP
FROM "refund_policy" p,
  (VALUES
    (3, 100, '체험일 3일 전까지: 100% 환불', 1),
    (1, 50,  '체험일 1~2일 전: 50% 환불',   2),
    (0, 0,   '체험 당일: 환불 불가',          3)
  ) AS r(days_before, rate, descr, seq)
WHERE p.name = '체험 환불 정책';

-- =============================================================================
-- 14. reservation
-- =============================================================================
-- 숙소 예약 — 홍길동, 황토방 1호, CONFIRMED
INSERT INTO "reservation" (
  kind, status, applicant_name, applicant_phone, applicant_email,
  user_id, target_id, target_name, refund_policy_id,
  room_id, room_name, start_date, end_date, guests, total_price, request_memo, updated_at
)
SELECT
  'ACCOMMODATION', 'CONFIRMED',
  '홍길동', '010-1234-5678', 'hong@anduck.kr',
  (SELECT id FROM "user" WHERE login_id = 'hong'),
  a.id, a.name,
  (SELECT id FROM "refund_policy" WHERE name = '기본 환불 정책'),
  r.id, r.name,
  '2026-07-10 15:00:00', '2026-07-12 11:00:00',
  2, 160000, '조용한 방으로 부탁드립니다', CURRENT_TIMESTAMP
FROM "accommodation" a
JOIN "room" r ON r.accommodation_id = a.id AND r.name = '황토방 1호'
WHERE a.name = '황토방 단지';

-- 체험 예약 — 김영희, 황토염색 체험, PENDING
INSERT INTO "reservation" (
  kind, status, applicant_name, applicant_phone,
  user_id, target_id, target_name, refund_policy_id,
  session_id, start_date, guests, updated_at
)
SELECT
  'PROGRAM', 'PENDING',
  '김영희', '010-9876-5432',
  (SELECT id FROM "user" WHERE login_id = 'kim'),
  p.id, p.name,
  (SELECT id FROM "refund_policy" WHERE name = '체험 환불 정책'),
  ps.id, ps.session_date::TIMESTAMP, 2, CURRENT_TIMESTAMP
FROM "program" p
JOIN "program_session" ps ON ps.program_id = p.id AND ps.session_date = '2026-07-05'
WHERE p.name = '황토염색 체험';

-- 비회원 숙소 예약 — PENDING
INSERT INTO "reservation" (
  kind, status, applicant_name, applicant_phone, applicant_email,
  target_id, target_name, refund_policy_id,
  room_id, room_name, start_date, end_date, guests, updated_at
)
SELECT
  'ACCOMMODATION', 'PENDING',
  '이민수', '010-5555-7777', 'lee@example.com',
  a.id, a.name,
  (SELECT id FROM "refund_policy" WHERE name = '기본 환불 정책'),
  r.id, r.name,
  '2026-07-18 14:00:00', '2026-07-20 11:00:00',
  4, CURRENT_TIMESTAMP
FROM "accommodation" a
JOIN "room" r ON r.accommodation_id = a.id AND r.name = '수펜션 A동'
WHERE a.name = '안덕 수펜션';

-- =============================================================================
-- 15. push_token
-- =============================================================================
INSERT INTO "push_token" (user_id, token, platform, updated_at) VALUES
  ((SELECT id FROM "user" WHERE login_id = 'hong'), 'fcm_sample_token_hong_ios_001',     'ios',     CURRENT_TIMESTAMP),
  ((SELECT id FROM "user" WHERE login_id = 'kim'),  'fcm_sample_token_kim_android_001',  'android', CURRENT_TIMESTAMP);

COMMIT;

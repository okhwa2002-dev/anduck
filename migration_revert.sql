-- accommodation, banner, facility, gallery_item, menu, program, program_session, push_token, room: use_yn → active_yn
ALTER TABLE accommodation RENAME COLUMN use_yn TO active_yn;
ALTER TABLE accommodation RENAME CONSTRAINT accommodation_use_yn_chk TO accommodation_active_yn_chk;
ALTER INDEX accommodation_use_yn_sort_order_idx RENAME TO accommodation_active_yn_sort_order_idx;

ALTER TABLE banner RENAME COLUMN use_yn TO active_yn;
ALTER TABLE banner RENAME CONSTRAINT banner_use_yn_chk TO banner_active_yn_chk;
ALTER INDEX banner_use_yn_sort_order_idx RENAME TO banner_active_yn_sort_order_idx;

ALTER TABLE facility RENAME COLUMN use_yn TO active_yn;
ALTER TABLE facility RENAME CONSTRAINT facility_use_yn_chk TO facility_active_yn_chk;
ALTER INDEX facility_kind_use_yn_sort_order_idx RENAME TO facility_kind_active_yn_sort_order_idx;

ALTER TABLE gallery_item RENAME COLUMN use_yn TO active_yn;
ALTER TABLE gallery_item RENAME CONSTRAINT gallery_item_use_yn_chk TO gallery_item_active_yn_chk;
ALTER INDEX gallery_item_use_yn_sort_order_idx RENAME TO gallery_item_active_yn_sort_order_idx;

ALTER TABLE menu RENAME COLUMN use_yn TO active_yn;
ALTER TABLE menu RENAME CONSTRAINT menu_use_yn_chk TO menu_active_yn_chk;
ALTER INDEX menu_use_yn_sort_order_idx RENAME TO menu_active_yn_sort_order_idx;

ALTER TABLE program RENAME COLUMN use_yn TO active_yn;
ALTER TABLE program RENAME CONSTRAINT program_use_yn_chk TO program_active_yn_chk;
ALTER INDEX program_use_yn_sort_order_idx RENAME TO program_active_yn_sort_order_idx;

ALTER TABLE program_session RENAME COLUMN use_yn TO active_yn;
ALTER TABLE program_session RENAME CONSTRAINT program_session_use_yn_chk TO program_session_active_yn_chk;
ALTER INDEX program_session_date_use_yn_idx RENAME TO program_session_date_active_yn_idx;

ALTER TABLE push_token RENAME COLUMN use_yn TO active_yn;
ALTER TABLE push_token RENAME CONSTRAINT push_token_use_yn_chk TO push_token_active_yn_chk;

ALTER TABLE room RENAME COLUMN use_yn TO active_yn;
ALTER TABLE room RENAME CONSTRAINT room_use_yn_chk TO room_active_yn_chk;

-- notice: use_yn → open_yn
ALTER TABLE notice RENAME COLUMN use_yn TO open_yn;
ALTER TABLE notice RENAME CONSTRAINT notice_use_yn_chk TO notice_open_yn_chk;

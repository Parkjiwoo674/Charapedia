-- Charapedia Phase 3~6 (좋아요 / 랭킹 / 리뷰 / 신고 / 관리자) 용 DB 점검 스크립트
-- 이미 만들어진 테이블은 건드리지 않으므로 여러 번 실행해도 안전합니다.
-- MySQL Workbench에서 전체 선택 후 실행(⚡)하세요.

USE charapedia_db;

-- 1) 이번 기능에 필요한 테이블 (이미 있으면 그냥 넘어감)
CREATE TABLE IF NOT EXISTS likes (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  character_id INT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_like (user_id, character_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS reviews (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  character_id INT UNSIGNED NOT NULL,
  content TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS reports (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  reporter_id INT UNSIGNED NOT NULL,
  character_id INT UNSIGNED NOT NULL,
  reason ENUM('spam', 'copyright', 'abuse', 'other') NOT NULL,
  detail TEXT,
  status ENUM('pending', 'resolved', 'dismissed') NOT NULL DEFAULT 'pending',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_report (reporter_id, character_id),
  FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
);

-- 2) 확인: 아래 3개가 모두 조회되면 DB 준비 끝
SHOW TABLES LIKE 'likes';
SHOW TABLES LIKE 'reviews';
SHOW TABLES LIKE 'reports';

-- 3) 관리자 계정 만들기
--    먼저 사이트에서 일반 회원가입을 한 뒤, 아래 '내아이디'를 본인 아이디로 바꿔서 실행하세요.
--    (admin은 회원가입으로는 만들 수 없게 막아뒀기 때문에 DB에서 직접 올려줘야 합니다)
-- UPDATE users SET role = 'admin' WHERE username = '내아이디';
--
--    ※ 실행 후 사이트에서 반드시 로그아웃 → 다시 로그인 하세요.
--      (권한이 로그인 토큰 안에 들어있어서, 다시 로그인해야 관리자로 인식됩니다)

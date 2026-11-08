CREATE TABLE profiles (
  user_id TEXT PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('elev', 'profesor', 'scoala', 'companie')),
  interests TEXT NOT NULL DEFAULT '',
  preferred_category TEXT NOT NULL DEFAULT '',
  preferred_audience TEXT NOT NULL DEFAULT '',
  teaching_context TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE moderators (
  seat INTEGER PRIMARY KEY CHECK (seat = 1),
  user_id TEXT UNIQUE NOT NULL,
  claimed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE posts (
  id TEXT PRIMARY KEY,
  author_id TEXT NOT NULL REFERENCES profiles(user_id),
  kind TEXT NOT NULL CHECK (kind IN ('anunt', 'cercetare', 'sprijin')),
  category TEXT NOT NULL,
  audience TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  source_url TEXT NOT NULL,
  context_id TEXT,
  organizer TEXT,
  deadline TEXT,
  event_date TEXT,
  method TEXT,
  limits TEXT,
  search_text TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'in_verificare'
    CHECK (status IN ('in_verificare', 'publicat', 'respins', 'retras')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  published_at TEXT,
  decision_at TEXT,
  decision_by TEXT,
  decision_reason TEXT
);
--> statement-breakpoint
CREATE INDEX posts_public ON posts(status, published_at DESC, id DESC);
--> statement-breakpoint
CREATE INDEX posts_author ON posts(author_id, created_at DESC);
--> statement-breakpoint
CREATE TABLE reports (
  post_id TEXT NOT NULL REFERENCES posts(id),
  reporter_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (post_id, reporter_id)
);
--> statement-breakpoint
CREATE TABLE decisions (
  id INTEGER PRIMARY KEY,
  post_id TEXT NOT NULL REFERENCES posts(id),
  previous_status TEXT NOT NULL,
  status TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TRIGGER record_decision AFTER UPDATE OF status ON posts
WHEN OLD.status <> NEW.status
BEGIN
  INSERT INTO decisions (post_id, previous_status, status, actor_id, reason)
  VALUES (NEW.id, OLD.status, NEW.status, NEW.decision_by, NEW.decision_reason);
END;

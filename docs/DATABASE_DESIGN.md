# Outtask Database Design - Outside Browser

Current extension uses chrome.storage.local + localStorage for speed, but proper DB is designed here.

## Goals
- Gregorian calendar primary, Jalali secondary
- Repeatable yearly events (birthdays)
- Tasks with folder + bulk delete
- High-performance timer

## Option A: IndexedDB (Local-first, recommended for extension v3)
No server, but more robust than localStorage.

```js
db.version(2).stores({
  tasks: 'id, folderId, completed, createdAt',
  folders: 'id, title',
  sessions: 'id, taskId, start, dateKey',
  occasions: 'id, date, repeat, type' // date is Gregorian YYYY-MM-DD
});
```

## Option B: PostgreSQL (Sync)

### users
```
id UUID PK
email VARCHAR UNIQUE
created_at TIMESTAMPTZ
```

### folders
```
id UUID PK
user_id UUID FK
title VARCHAR(120)
created_at TIMESTAMPTZ
```

### tasks
```
id UUID PK
user_id UUID FK
folder_id UUID FK NULLABLE
title TEXT
completed BOOLEAN DEFAULT false
color CHAR(7) -- #e4f222
time_spent_seconds INT DEFAULT 0
created_at TIMESTAMPTZ
```

Folder completion computed:
```sql
SELECT folder_id,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE completed) as done
FROM tasks GROUP BY folder_id;
```

Bulk delete (new requirement):
```sql
DELETE FROM tasks WHERE id = ANY($1) AND user_id = $2;
-- $1 = array of selected task IDs
```

### sessions
```
id UUID PK
user_id UUID FK
task_id UUID FK
start_time TIMESTAMPTZ
end_time TIMESTAMPTZ
duration_seconds INT GENERATED
date_key DATE GENERATED
```

24h clock query:
```sql
SELECT * FROM sessions WHERE user_id=$1 AND date_key=CURRENT_DATE;
```

### occasions - NEW DESIGN Gregorian + Repeat
```
id UUID PK
user_id UUID FK
g_date DATE NOT NULL -- Gregorian date, e.g., 2026-08-30
j_date CHAR(10) GENERATED -- computed Jalali for display, e.g., 1405-06-08
title VARCHAR(120)
color CHAR(7) DEFAULT '#e4f222'
repeat_type VARCHAR(10) DEFAULT 'none' -- 'none' or 'yearly'
type VARCHAR(20) DEFAULT 'custom'
created_at TIMESTAMPTZ

Indexes:
- (user_id, g_date)
- (user_id, EXTRACT(MONTH FROM g_date), EXTRACT(DAY FROM g_date)) WHERE repeat_type='yearly'

Query for a Gregorian day with repeat:
```sql
SELECT * FROM occasions
WHERE user_id=$1 AND (
  g_date = $2
  OR (repeat_type='yearly' AND EXTRACT(MONTH FROM g_date)=EXTRACT(MONTH FROM $2::date) AND EXTRACT(DAY FROM g_date)=EXTRACT(DAY FROM $2::date))
);
```

Example birthday: store original birth date 1990-05-15 with repeat yearly, will match every 05-15.

### Why outside browser?
- localStorage 5MB, sync blocking
- IndexedDB async, indexed, 100MB+
- Server DB allows backup, multi-device, sharing calendars

### Migration
Old occasions with Jalali year <1600 -> convert to Gregorian via reverse algorithm or prompt user to re-enter via new form (Gregorian picker + yearly checkbox).

### Fonts & Icons
- Fonts stored as static assets `/fonts/Morabba-*.ttf`, loaded via @font-face, not from CDN (CSP safe)
- Icon pack: Material Icons Rounded (Flutter style) - 16 SVGs in `/icons-pack/` with fill=currentColor, used via inline <svg> in HTML for tasks, calendar, timer, settings, folder, delete, add, etc.

### Diagram
```
User 1--* Folder 1--* Task 1--* Session
          |
          *-- Task (loose)
User 1--* Occasion (Gregorian + yearly repeat)
```

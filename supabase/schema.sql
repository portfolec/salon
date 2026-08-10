-- ============================================================
-- Стильный Акцент — schema v1
-- Запустить в Supabase SQL Editor
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------
-- SERVICES
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS services (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  name             TEXT NOT NULL,
  description      TEXT NOT NULL DEFAULT '',
  price_from       INTEGER NOT NULL DEFAULT 0,
  duration         TEXT NOT NULL DEFAULT '',
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  active           BOOLEAN NOT NULL DEFAULT true,
  sort_order       INTEGER NOT NULL DEFAULT 0
);

-- ----------------------------------------------------------
-- SERVICE VARIANTS (subcategories, e.g. "под машинку" / "ножницами")
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS service_variants (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_id        UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  price_from        INTEGER,
  duration_minutes  INTEGER,
  sort_order        INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_service_variants_service_id ON service_variants(service_id);

-- ----------------------------------------------------------
-- MASTERS
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS masters (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  name         TEXT NOT NULL,
  role         TEXT NOT NULL DEFAULT '',
  experience   TEXT NOT NULL DEFAULT '',
  bio          TEXT NOT NULL DEFAULT '',
  photo_url    TEXT NOT NULL DEFAULT '',
  active       BOOLEAN NOT NULL DEFAULT true,
  sort_order   INTEGER NOT NULL DEFAULT 0
);

-- ----------------------------------------------------------
-- MASTER <-> SERVICE (many-to-many)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS master_services (
  master_id  UUID REFERENCES masters(id)  ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  PRIMARY KEY (master_id, service_id)
);

-- ----------------------------------------------------------
-- MASTER WEEKLY SCHEDULE
-- day_of_week: 0=Пн, 1=Вт, 2=Ср, 3=Чт, 4=Пт, 5=Сб, 6=Вс
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS master_schedule (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  master_id    UUID NOT NULL REFERENCES masters(id) ON DELETE CASCADE,
  day_of_week  INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time   TIME NOT NULL DEFAULT '10:00',
  end_time     TIME NOT NULL DEFAULT '19:00',
  active       BOOLEAN NOT NULL DEFAULT true,
  UNIQUE (master_id, day_of_week)
);

-- ----------------------------------------------------------
-- MASTER SERVICE DAYS (какие услуги мастер делает в какой день)
-- Если строк нет для пары master+service → услуга доступна все рабочие дни
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS master_service_days (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  master_id  UUID NOT NULL REFERENCES masters(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  UNIQUE (master_id, service_id, day_of_week)
);

-- ----------------------------------------------------------
-- MASTER DAYS OFF (конкретные даты)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS master_days_off (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  master_id  UUID NOT NULL REFERENCES masters(id) ON DELETE CASCADE,
  date       DATE NOT NULL,
  reason     TEXT NOT NULL DEFAULT '',
  UNIQUE (master_id, date)
);

-- ----------------------------------------------------------
-- BOOKINGS
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS bookings (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  service_id       UUID REFERENCES services(id) ON DELETE SET NULL,
  service_name     TEXT NOT NULL DEFAULT '',
  variant_name     TEXT NOT NULL DEFAULT '',
  master_id        UUID REFERENCES masters(id)  ON DELETE SET NULL,
  master_name      TEXT NOT NULL DEFAULT '',
  date             DATE NOT NULL,
  time             TIME NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  client_name      TEXT NOT NULL,
  client_phone     TEXT NOT NULL,
  comment          TEXT NOT NULL DEFAULT '',
  status           TEXT NOT NULL DEFAULT 'new'
                     CHECK (status IN ('new','confirmed','done','cancelled')),
  source           TEXT NOT NULL DEFAULT 'website'
);

-- ----------------------------------------------------------
-- SITE CONTENT (key-value)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS site_content (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------
-- VACANCIES
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS vacancies (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  title        TEXT NOT NULL,
  description  TEXT NOT NULL DEFAULT '',
  requirements TEXT NOT NULL DEFAULT '',
  active       BOOLEAN NOT NULL DEFAULT true,
  sort_order   INTEGER NOT NULL DEFAULT 0
);

-- ----------------------------------------------------------
-- RLS — для простоты открываем anon-ключу всё
-- В продакшене лучше ограничить write через Supabase Auth
-- ----------------------------------------------------------
ALTER TABLE services         ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE masters         ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_days_off ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings        ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_content    ENABLE ROW LEVEL SECURITY;
ALTER TABLE vacancies       ENABLE ROW LEVEL SECURITY;

CREATE POLICY "open" ON services         FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open" ON service_variants FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open" ON masters         FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open" ON master_services FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open" ON master_schedule FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open" ON master_days_off FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open" ON bookings        FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open" ON site_content    FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open" ON vacancies       FOR ALL USING (true) WITH CHECK (true);

-- ----------------------------------------------------------
-- SEED: Services
-- ----------------------------------------------------------
INSERT INTO services (name, description, price_from, duration, duration_minutes, sort_order) VALUES
  ('Парикмахер',        'Стрижки, окрашивание, укладки от мастеров-стилистов',     2500, '60-120 мин', 90,  1),
  ('Маникюр',           'Классический, гелевый, аппаратный — любое покрытие',      1800, '60-90 мин',  75,  2),
  ('Педикюр',           'Обработка стоп и покрытие с уходом за кутикулой',         2200, '75-100 мин', 90,  3),
  ('Ресницы',           'Наращивание ресниц: классика, объём, голливуд',           3500, '120-180 мин',150, 4),
  ('Брови',             'Коррекция, архитектура и окрашивание бровей',             1200, '45-60 мин',  60,  5),
  ('Массаж',            'Расслабляющий, антицеллюлитный, лимфодренажный',          3000, '60-90 мин',  75,  6),
  ('Лазерная эпиляция', 'Диодный лазер для всех типов кожи и волос',               2000, '30-90 мин',  60,  7),
  ('Обычная эпиляция',  'Восковая и сахарная эпиляция любых зон',                  800,  '30-60 мин',  45,  8)
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------
-- SEED: Site content
-- ----------------------------------------------------------
INSERT INTO site_content (key, value) VALUES
  ('heroTitle',     'Красота в каждой детали'),
  ('heroSubtitle',  'Премиальный салон: парикмахер, маникюр, педикюр, ресницы, брови, массаж и эпиляция.'),
  ('address',       'Москва, ул. Профсоюзная, 56к2'),
  ('phone',         '+7 (495) 123-45-67'),
  ('hoursWeekday',  '10:00 - 20:00'),
  ('hoursSaturday', '10:00 - 19:00'),
  ('telegramUrl',   'https://t.me/stilnyaktsent'),
  ('instagramUrl',  'https://instagram.com/stilnyaktsent')
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------
-- SEED: Vacancies
-- ----------------------------------------------------------
INSERT INTO vacancies (title, description, requirements, sort_order) VALUES
  ('Мастер маникюра',       'Работа в уютном салоне с постоянным потоком клиентов и профессиональной косметикой.', 'Опыт от 1 года, аккуратность, умение работать с гель-лаком.', 1),
  ('Парикмахер-стилист',    'Стрижки, окрашивание и укладки. Дружная команда и гибкий график.',                    'Опыт от 2 лет, портфолио работ.', 2),
  ('Администратор салона',  'Встреча гостей, запись клиентов, поддержание сервиса на высоком уровне.',             'Коммуникабельность, опыт работы с людьми приветствуется.', 3)
ON CONFLICT DO NOTHING;

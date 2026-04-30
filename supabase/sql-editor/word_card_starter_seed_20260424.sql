-- Seed starter word card sets and items for SQL Editor.
-- Safe to run more than once. Does not delete admin-created sets.

create table if not exists public.word_card_sets (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  topic_slug text not null,
  topic_title text not null,
  cefr_level text not null check (cefr_level in ('A1', 'A2', 'B1', 'B2', 'C1')),
  sort_order integer not null default 0,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.word_card_items (
  id uuid primary key default gen_random_uuid(),
  set_id uuid not null references public.word_card_sets(id) on delete cascade,
  term text not null,
  translation text not null,
  example_sentence text not null,
  example_translation text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists word_card_sets_published_topic_level_idx
  on public.word_card_sets (is_published, topic_slug, cefr_level, sort_order, created_at desc);

create index if not exists word_card_items_set_order_idx
  on public.word_card_items (set_id, sort_order);

create or replace function public.touch_student_cabinet_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_word_card_sets_updated_at on public.word_card_sets;
create trigger trg_word_card_sets_updated_at
before update on public.word_card_sets
for each row execute function public.touch_student_cabinet_updated_at();

drop trigger if exists trg_word_card_items_updated_at on public.word_card_items;
create trigger trg_word_card_items_updated_at
before update on public.word_card_items
for each row execute function public.touch_student_cabinet_updated_at();

alter table public.word_card_sets enable row level security;
alter table public.word_card_items enable row level security;

drop policy if exists word_card_sets_select_published on public.word_card_sets;
create policy word_card_sets_select_published
on public.word_card_sets
for select
to authenticated
using (is_published = true);

drop policy if exists word_card_items_select_published_set on public.word_card_items;
create policy word_card_items_select_published_set
on public.word_card_items
for select
to authenticated
using (
  exists (
    select 1
    from public.word_card_sets s
    where s.id = word_card_items.set_id
      and s.is_published = true
  )
);

with seed_sets(slug, topic_slug, topic_title, title, description, cefr_level, sort_order) as (
  values
    ('food-cafe', 'food', 'Еда', 'Кафе и ресторан', 'Заказ, меню, счет и разговор с официантом.', 'A1', 0),
    ('food-cooking', 'food', 'Еда', 'Готовка и продукты', 'Ингредиенты, рецепты и домашняя кухня.', 'A1', 1),
    ('travel-airport', 'travel', 'Путешествия', 'Аэропорт', 'Регистрация, посадка, багаж и контроль.', 'A1', 2),
    ('travel-city', 'travel', 'Путешествия', 'Город и отель', 'Ориентация в городе, заселение и транспорт.', 'A1', 3),
    ('work-meetings', 'work', 'Работа', 'Встречи', 'Созвоны, сроки, задачи и договоренности.', 'A1', 4),
    ('work-office', 'work', 'Работа', 'Офисные процессы', 'Документы, обязанности и рабочие решения.', 'A1', 5),
    ('family-people', 'family', 'Семья', 'Родные люди', 'Родственники, отношения и поддержка.', 'A1', 6),
    ('family-home', 'family', 'Семья', 'Дом и быт', 'Домашние дела, привычки и семейные планы.', 'A1', 7),
    ('daily-small-talk', 'daily-phrases', 'Повседневные фразы', 'Small talk', 'Короткие фразы для повседневного общения.', 'A1', 8),
    ('daily-help', 'daily-phrases', 'Повседневные фразы', 'Просьбы и реакции', 'Как попросить, уточнить и ответить в быту.', 'A1', 9),
    ('business-calls', 'business-english', 'Business English', 'Созвоны', 'Фразы для встреч, follow-up и обсуждений.', 'A1', 10),
    ('business-deals', 'business-english', 'Business English', 'Сделки и решения', 'Переговоры, согласование и деловая переписка.', 'A1', 11)
), upserted_sets as (
  insert into public.word_card_sets (id, title, description, topic_slug, topic_title, cefr_level, sort_order, is_published)
  select
    (substr(md5('word-card-set:' || slug), 1, 8) || '-' || substr(md5('word-card-set:' || slug), 9, 4) || '-' || substr(md5('word-card-set:' || slug), 13, 4) || '-' || substr(md5('word-card-set:' || slug), 17, 4) || '-' || substr(md5('word-card-set:' || slug), 21, 12))::uuid,
    title,
    description,
    topic_slug,
    topic_title,
    cefr_level,
    sort_order,
    true
  from seed_sets
  on conflict (id) do update set
    title = excluded.title,
    description = excluded.description,
    topic_slug = excluded.topic_slug,
    topic_title = excluded.topic_title,
    cefr_level = excluded.cefr_level,
    sort_order = excluded.sort_order,
    is_published = excluded.is_published,
    updated_at = now()
  returning id, topic_slug
), seed_items(set_slug, term, translation, example_sentence, example_translation, sort_order) as (
  values
    ('food-cafe', 'menu', 'меню', 'Could we see the menu, please?', 'Можно нам посмотреть меню, пожалуйста?', 0),
    ('food-cafe', 'order', 'заказывать', 'I would like to order a salad.', 'Я хотел бы заказать салат.', 1),
    ('food-cafe', 'bill', 'счет', 'Can we have the bill, please?', 'Можно нам счет, пожалуйста?', 2),
    ('food-cafe', 'afford', 'позволить себе', 'I can''t afford dinner at that restaurant today.', 'Сегодня я не могу позволить себе ужин в том ресторане.', 3),
    ('food-cafe', 'portion', 'порция', 'The portions here are really large.', 'Порции здесь действительно большие.', 4),
    ('food-cooking', 'recipe', 'рецепт', 'Can you send me the recipe for this soup?', 'Можешь прислать мне рецепт этого супа?', 0),
    ('food-cooking', 'ingredient', 'ингредиент', 'Fresh tomatoes are the main ingredient.', 'Свежие помидоры - главный ингредиент.', 1),
    ('food-cooking', 'chop', 'нарезать', 'Chop the onion into small pieces.', 'Нарежьте лук маленькими кусочками.', 2),
    ('food-cooking', 'boil', 'кипятить, варить', 'Boil the pasta for ten minutes.', 'Варите пасту десять минут.', 3),
    ('food-cooking', 'spicy', 'острый', 'This sauce is too spicy for me.', 'Этот соус слишком острый для меня.', 4),
    ('travel-airport', 'customs', 'таможня', 'We waited at customs for twenty minutes.', 'Мы ждали на таможне двадцать минут.', 0),
    ('travel-airport', 'departure gate', 'выход на посадку', 'Our departure gate changed at the last minute.', 'Наш выход на посадку изменился в последний момент.', 1),
    ('travel-airport', 'boarding pass', 'посадочный талон', 'Please show your boarding pass at the gate.', 'Пожалуйста, покажите посадочный талон у выхода.', 2),
    ('travel-airport', 'luggage', 'багаж', 'My luggage arrived late.', 'Мой багаж прибыл поздно.', 3),
    ('travel-airport', 'delay', 'задержка', 'There is a delay because of the weather.', 'Из-за погоды есть задержка.', 4),
    ('travel-city', 'check in', 'заселиться', 'We can check in after two o''clock.', 'Мы можем заселиться после двух часов.', 0),
    ('travel-city', 'directions', 'указания, маршрут', 'Could you give me directions to the station?', 'Можете подсказать дорогу до станции?', 1),
    ('travel-city', 'booking', 'бронирование', 'I have a booking under the name Ivanov.', 'У меня бронирование на имя Иванов.', 2),
    ('travel-city', 'nearby', 'поблизости', 'Is there a pharmacy nearby?', 'Поблизости есть аптека?', 3),
    ('travel-city', 'subway', 'метро', 'The subway is faster than a taxi.', 'Метро быстрее такси.', 4),
    ('work-meetings', 'deadline', 'срок сдачи', 'The deadline for the report is Friday.', 'Срок сдачи отчета - пятница.', 0),
    ('work-meetings', 'schedule', 'назначать, расписание', 'Let''s schedule a meeting for tomorrow.', 'Давайте назначим встречу на завтра.', 1),
    ('work-meetings', 'task', 'задача', 'This task should take about an hour.', 'Эта задача займет около часа.', 2),
    ('work-meetings', 'agenda', 'повестка', 'The agenda has three main points.', 'В повестке три основных пункта.', 3),
    ('work-meetings', 'update', 'обновление, сообщить новости', 'Please update the team after the call.', 'Пожалуйста, сообщите команде новости после звонка.', 4),
    ('work-office', 'report', 'отчет', 'I need to finish the report today.', 'Мне нужно закончить отчет сегодня.', 0),
    ('work-office', 'approve', 'одобрить', 'The manager approved the new budget.', 'Менеджер одобрил новый бюджет.', 1),
    ('work-office', 'request', 'запрос', 'I sent a request to the finance team.', 'Я отправил запрос финансовой команде.', 2),
    ('work-office', 'responsible', 'ответственный', 'Who is responsible for this project?', 'Кто отвечает за этот проект?', 3),
    ('work-office', 'decision', 'решение', 'We need a decision by Monday.', 'Нам нужно решение к понедельнику.', 4),
    ('family-people', 'relative', 'родственник', 'Most of my relatives live in another city.', 'Большинство моих родственников живут в другом городе.', 0),
    ('family-people', 'support', 'поддерживать', 'My family always supports me.', 'Моя семья всегда поддерживает меня.', 1),
    ('family-people', 'childhood', 'детство', 'I spent my childhood near the sea.', 'Я провел детство у моря.', 2),
    ('family-people', 'sibling', 'брат или сестра', 'Do you have any siblings?', 'У тебя есть братья или сестры?', 3),
    ('family-people', 'care', 'заботиться', 'She takes care of her younger brother.', 'Она заботится о младшем брате.', 4),
    ('family-home', 'chore', 'домашняя обязанность', 'Washing dishes is my least favorite chore.', 'Мыть посуду - моя самая нелюбимая домашняя обязанность.', 0),
    ('family-home', 'share', 'делить, разделять', 'We share household tasks.', 'Мы делим домашние дела.', 1),
    ('family-home', 'routine', 'распорядок', 'Our morning routine is simple.', 'Наш утренний распорядок простой.', 2),
    ('family-home', 'move', 'переезжать', 'My parents want to move closer to us.', 'Мои родители хотят переехать ближе к нам.', 3),
    ('family-home', 'neighbor', 'сосед', 'Our neighbor helped us with the boxes.', 'Наш сосед помог нам с коробками.', 4),
    ('daily-small-talk', 'Do you mind?', 'Вы не против?', 'Do you mind if I open the window?', 'Вы не против, если я открою окно?', 0),
    ('daily-small-talk', 'Sounds good', 'Звучит хорошо', 'Lunch at one? Sounds good.', 'Обед в час? Звучит хорошо.', 1),
    ('daily-small-talk', 'catch up', 'наверстать, пообщаться', 'Let''s catch up after work.', 'Давай пообщаемся после работы.', 2),
    ('daily-small-talk', 'How is it going?', 'Как дела?', 'Hi, how is it going today?', 'Привет, как сегодня дела?', 3),
    ('daily-small-talk', 'by the way', 'кстати', 'By the way, I saw your message.', 'Кстати, я видел твое сообщение.', 4),
    ('daily-help', 'Could you...?', 'Не могли бы вы...?', 'Could you help me with this form?', 'Не могли бы вы помочь мне с этой формой?', 0),
    ('daily-help', 'No problem', 'без проблем', 'Can you call me later? No problem.', 'Можешь позвонить мне позже? Без проблем.', 1),
    ('daily-help', 'Let me check', 'дай мне проверить', 'Let me check my calendar.', 'Дай мне проверить календарь.', 2),
    ('daily-help', 'I''m not sure', 'я не уверен', 'I''m not sure this is the right address.', 'Я не уверен, что это правильный адрес.', 3),
    ('daily-help', 'Never mind', 'ничего, неважно', 'Never mind, I found the key.', 'Ничего, я нашел ключ.', 4),
    ('business-calls', 'follow up', 'уточнить, вернуться к вопросу', 'I''ll follow up with the client tomorrow.', 'Я вернусь к вопросу с клиентом завтра.', 0),
    ('business-calls', 'brief', 'кратко проинформировать', 'Can you brief me before the meeting?', 'Можешь кратко ввести меня в курс перед встречей?', 1),
    ('business-calls', 'clarify', 'уточнить', 'Could you clarify the next step?', 'Не могли бы вы уточнить следующий шаг?', 2),
    ('business-calls', 'action item', 'задача по итогам встречи', 'Let''s list the action items.', 'Давайте перечислим задачи по итогам встречи.', 3),
    ('business-calls', 'minutes', 'протокол встречи', 'I will send the meeting minutes today.', 'Я отправлю протокол встречи сегодня.', 4),
    ('business-deals', 'negotiate', 'вести переговоры', 'We need to negotiate the contract terms.', 'Нам нужно обсудить условия контракта.', 0),
    ('business-deals', 'contract', 'договор', 'The contract is ready for review.', 'Договор готов к проверке.', 1),
    ('business-deals', 'budget', 'бюджет', 'We have a limited budget this quarter.', 'В этом квартале у нас ограниченный бюджет.', 2),
    ('business-deals', 'agree', 'согласиться', 'They agreed to the new terms.', 'Они согласились на новые условия.', 3),
    ('business-deals', 'offer', 'предложение', 'The supplier made a better offer.', 'Поставщик сделал лучшее предложение.', 4)
)
insert into public.word_card_items (id, set_id, term, translation, example_sentence, example_translation, sort_order)
select
  (substr(md5('word-card-item:' || seed_items.set_slug || ':' || seed_items.term), 1, 8) || '-' || substr(md5('word-card-item:' || seed_items.set_slug || ':' || seed_items.term), 9, 4) || '-' || substr(md5('word-card-item:' || seed_items.set_slug || ':' || seed_items.term), 13, 4) || '-' || substr(md5('word-card-item:' || seed_items.set_slug || ':' || seed_items.term), 17, 4) || '-' || substr(md5('word-card-item:' || seed_items.set_slug || ':' || seed_items.term), 21, 12))::uuid,
  (substr(md5('word-card-set:' || seed_items.set_slug), 1, 8) || '-' || substr(md5('word-card-set:' || seed_items.set_slug), 9, 4) || '-' || substr(md5('word-card-set:' || seed_items.set_slug), 13, 4) || '-' || substr(md5('word-card-set:' || seed_items.set_slug), 17, 4) || '-' || substr(md5('word-card-set:' || seed_items.set_slug), 21, 12))::uuid,
  term,
  translation,
  example_sentence,
  example_translation,
  sort_order
from seed_items
on conflict (id) do update set
  set_id = excluded.set_id,
  term = excluded.term,
  translation = excluded.translation,
  example_sentence = excluded.example_sentence,
  example_translation = excluded.example_translation,
  sort_order = excluded.sort_order,
  updated_at = now();

import { Link } from '@/i18n/navigation';

/**
 * Страница политики конфиденциальности.
 *
 * ВАЖНО: текст ниже — это СТРУКТУРНЫЙ ШАБЛОН, а не готовый юридический
 * документ. Разделы, помеченные [ЗАПОЛНИТЬ], нужно согласовать с
 * юристом отеля/сети Profil Hotels — вероятно, у сети уже есть похожий
 * текст для других цифровых сервисов, который можно адаптировать,
 * а не писать с нуля. Технические факты (какие именно куки и данные
 * реально использует приложение) в шаблоне указаны точно, потому что
 * это просто честное описание кода, а не юридическая трактовка.
 *
 * Текст ниже — не переведён через общую систему i18n (messages/*.json)
 * специально: юридический текст обычно правится отдельно от текстов
 * интерфейса, и держать его в одном читаемом месте (по языкам ниже
 * в этом файле) проще, чем synchronизировать с UI-переводами.
 */

const CONTENT: Record<string, { title: string; body: string }> = {
  ru: {
    title: 'Политика конфиденциальности',
    body: `
**[ЗАПОЛНИТЬ] Кто мы**
Название отеля, юридический адрес, контакт для вопросов о персональных
данных (email/телефон).

**Какие данные мы собираем**
- Имя (из вашего Google-аккаунта или введённое при регистрации)
- Email (для входа в приложение)
- Номер комнаты и период проживания
- История заказов ланчбоксов (даты, тип питания)

**Зачем**
Чтобы организовать ваше проживание и питание во время пребывания в
отеле — назначить комнату, принимать и готовить заказы на еду.

**[ЗАПОЛНИТЬ] Правовое основание обработки**
Обычно — исполнение договора (бронирование/проживание) и законный
интерес отеля в организации сервиса.

**Кто имеет доступ к данным**
- Персонал отеля (администраторы приложения) — видит ваше имя, комнату
  и заказы, чтобы подготовить и выдать вам еду.
- Технические поставщики инфраструктуры: Supabase (хранение базы
  данных) и Vercel (хостинг самого приложения) — как обработчики
  данных по договору, не имеют самостоятельного доступа для иных целей.

**[ЗАПОЛНИТЬ] Сколько мы храним данные**
Например: данные о проживании и заказах хранятся N месяцев после
выезда, затем удаляются или обезличиваются.

**Ваши права**
Вы можете запросить доступ к своим данным, их исправление или
удаление, обратившись [ЗАПОЛНИТЬ: контакт].

**Какие куки и локальное хранилище использует приложение**
- Куки сессии входа (Supabase Auth) — технически необходимы для
  работы приложения, без них невозможно войти в аккаунт. Не требуют
  отдельного согласия по законодательству о куки, так как относятся к
  категории строго необходимых.
- localStorage браузера — хранит только выбранную тему оформления
  (светлая/тёмная), не является персональными данными и не
  передаётся на сервер.
- Приложение не использует куки аналитики, рекламы или трекинга.
`.trim(),
  },
  en: {
    title: 'Privacy Policy',
    body: `
**[TO BE COMPLETED] Who we are**
Hotel name, legal address, contact for data protection questions.

**What data we collect**
- Name (from your Google account or entered at sign-up)
- Email (used to sign in)
- Room number and stay period
- Lunchbox order history (dates, meal type)

**Why**
To organise your stay and meals during your time at the hotel —
assigning your room, preparing and handing out your food orders.

**[TO BE COMPLETED] Legal basis**
Typically: performance of a contract (booking/stay) and the hotel's
legitimate interest in running the service.

**Who has access**
- Hotel staff (app administrators) — see your name, room and orders
  to prepare and hand out your food.
- Infrastructure providers: Supabase (database) and Vercel (app
  hosting) — acting as data processors under contract, no independent
  access for other purposes.

**[TO BE COMPLETED] Retention period**
E.g.: stay and order data is kept for N months after checkout, then
deleted or anonymised.

**Your rights**
You may request access to, correction of, or deletion of your data by
contacting [TO BE COMPLETED: contact].

**Cookies and local storage used by this app**
- Login session cookies (Supabase Auth) — strictly necessary for the
  app to work; you cannot sign in without them. These don't require
  separate cookie consent under most cookie laws, as they fall under
  the "strictly necessary" exemption.
- Browser localStorage — stores only your chosen appearance (dark/
  light), not personal data, never sent to the server.
- This app does not use analytics, advertising, or tracking cookies.
`.trim(),
  },
  uk: {
    title: 'Політика конфіденційності',
    body: `
**[ЗАПОВНИТИ] Хто ми**
Назва готелю, юридична адреса, контакт з питань персональних даних.

**Які дані ми збираємо**
- Ім'я (з вашого Google-акаунту або введене під час реєстрації)
- Email (для входу в застосунок)
- Номер кімнати та період проживання
- Історія замовлень ланчбоксів (дати, тип харчування)

**Навіщо**
Щоб організувати ваше проживання та харчування під час перебування
в готелі — призначити кімнату, приймати й готувати замовлення їжі.

**[ЗАПОВНИТИ] Правова підстава обробки**
Зазвичай — виконання договору (бронювання/проживання) та законний
інтерес готелю в організації сервісу.

**Хто має доступ до даних**
- Персонал готелю (адміністратори застосунку) — бачить ваше ім'я,
  кімнату та замовлення, щоб підготувати й видати вам їжу.
- Технічні постачальники інфраструктури: Supabase (база даних) та
  Vercel (хостинг застосунку) — як обробники даних за договором.

**[ЗАПОВНИТИ] Скільки ми зберігаємо дані**
Наприклад: дані про проживання та замовлення зберігаються N місяців
після виїзду, потім видаляються або знеособлюються.

**Ваші права**
Ви можете запросити доступ до своїх даних, їх виправлення або
видалення, звернувшись [ЗАПОВНИТИ: контакт].

**Які кукі та локальне сховище використовує застосунок**
- Кукі сесії входу (Supabase Auth) — технічно необхідні для роботи
  застосунку, без них неможливо увійти в акаунт. Не потребують
  окремої згоди за законодавством про кукі, оскільки належать до
  категорії суворо необхідних.
- localStorage браузера — зберігає лише обрану тему оформлення,
  не є персональними даними і не передається на сервер.
- Застосунок не використовує кукі аналітики, реклами чи трекінгу.
`.trim(),
  },
  da: {
    title: 'Privatlivspolitik',
    body: `
**[UDFYLDES] Hvem er vi**
Hotellets navn, juridiske adresse, kontakt vedrørende databeskyttelse.

**Hvilke data indsamler vi**
- Navn (fra din Google-konto eller indtastet ved oprettelse)
- Email (bruges til login)
- Værelsesnummer og opholdsperiode
- Bestillingshistorik for madpakker (datoer, måltidstype)

**Hvorfor**
For at organisere dit ophold og dine måltider under dit ophold på
hotellet — tildele værelse, forberede og udlevere dine bestillinger.

**[UDFYLDES] Retsgrundlag**
Typisk: opfyldelse af en kontrakt (booking/ophold) samt hotellets
legitime interesse i at drive tjenesten.

**Hvem har adgang**
- Hotelpersonale (app-administratorer) — ser dit navn, værelse og
  bestillinger for at forberede og udlevere din mad.
- Infrastrukturudbydere: Supabase (database) og Vercel (hosting) —
  som databehandlere i henhold til kontrakt.

**[UDFYLDES] Opbevaringsperiode**
F.eks.: ophold- og bestillingsdata opbevares i N måneder efter
udtjekning, og slettes eller anonymiseres derefter.

**Dine rettigheder**
Du kan anmode om indsigt i, rettelse af eller sletning af dine data
ved at kontakte [UDFYLDES: kontakt].

**Cookies og lokal lagring i denne app**
- Login-sessionscookies (Supabase Auth) — teknisk nødvendige for at
  appen fungerer; du kan ikke logge ind uden dem. Kræver normalt ikke
  separat cookie-samtykke, da de er "strengt nødvendige".
- Browserens localStorage — gemmer kun dit valgte udseende (mørkt/
  lyst), ikke personoplysninger, sendes aldrig til serveren.
- Appen bruger ikke analyse-, reklame- eller sporingscookies.
`.trim(),
  },
};

function renderBody(body: string) {
  return body.split('\n\n').map((block, i) => {
    const headingMatch = block.match(/^\*\*(.+)\*\*\n?([\s\S]*)$/);
    if (headingMatch) {
      const [, heading, rest] = headingMatch;
      return (
        <div key={i} className="space-y-1.5">
          <h2 className="font-display text-base font-semibold text-ink">
            {heading}
          </h2>
          {rest && (
            <p className="text-sm text-ink-muted whitespace-pre-line">
              {rest.trim()}
            </p>
          )}
        </div>
      );
    }
    return (
      <p key={i} className="text-sm text-ink-muted whitespace-pre-line">
        {block}
      </p>
    );
  });
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const content = CONTENT[locale] ?? CONTENT.en;

  return (
    <main className="min-h-screen p-4 sm:p-6">
      <div className="mx-auto max-w-2xl space-y-4">
        <Link
          href="/profile"
          className="text-sm text-ink-muted hover:text-gold transition-colors"
        >
          ← Back
        </Link>

        <h1 className="font-display text-2xl text-ink">{content.title}</h1>

        <div className="rounded-card bg-surface border border-border p-6 space-y-5">
          {renderBody(content.body)}
        </div>
      </div>
    </main>
  );
}

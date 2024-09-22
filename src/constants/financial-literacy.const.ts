import { CompoundInterestData, IContext } from '../type/interface';
import { WizardContext } from 'telegraf/typings/scenes';

export const FINANCE_LITERACY_TEXT = {
  en: `<b>The Power of Compound Interest 💰</b>

Compound interest helps your money grow faster by earning interest on both your initial investment and the interest you've already earned. It's a simple concept, but it can make a huge difference in the long run. 📈

<b>How does it work?</b>
When you save or invest money, compound interest works by reinvesting the interest you earn back into the initial amount. For example, if you invest $1000 at a 5% annual rate, you’ll earn $50 in the first year. In the second year, you’ll earn interest on $1050 instead of $1000, meaning your money grows faster! 💡

<b>Why is it important?</b>

<i>Exponential Growth</i> ⏳ — The earlier you start, the more your wealth multiplies. Time is your greatest asset with compound interest.
<i>Effortless Growth</i> 🛋️ — Once you invest, your money works for you. It grows automatically without you needing to do anything extra!
<b>Tip:</b> Start early, and let compound interest turn small savings into significant wealth! 🌱

This button will help you calculate compound interest
🔽🔽🔽🔽`,
  ua: `<b>Сила Складного Відсотка 💰</b>

Складний відсоток допомагає вашим грошам зростати швидше, приносячи відсотки не тільки на початкову суму, а й на вже накопичені відсотки. Це проста концепція, яка може суттєво вплинути на ваші фінанси в довгостроковій перспективі. 📈

<b>Як це працює?</b>
Коли ви відкладаєте або інвестуєте гроші, складний відсоток діє, реінвестуючи зароблені відсотки. Наприклад, якщо ви вклали 1000 грн під 5% річних, то за перший рік ви заробите 50 грн. На другий рік ви отримаєте відсотки вже на 1050 грн, що дозволяє вашим грошам зростати швидше! 💡

<b>Чому це важливо?</b>

<i>Експоненціальне зростання</i> ⏳ — Чим раніше ви почнете, тим більше зростуть ваші гроші. Час працює на вас!
<i>Легке зростання</i> 🛋️ — Після того як ви зробили інвестицію, гроші працюють самі, без додаткових зусиль!
<b>Порада:</b> Почніть сьогодні, і дайте складному відсотку перетворити ваші заощадження в значний капітал! 🌱

Ця кнопка допоможе вам розрахувати складний відсоток
🔽🔽🔽🔽
`,
  pl: `<b>Siła Oprocentowania Składanego 💰</b>

Oprocentowanie składane sprawia, że twoje pieniądze rosną szybciej, przynosząc odsetki zarówno od początkowej kwoty, jak i od narosłych odsetek. To prosty mechanizm, który może zdziałać cuda w długim okresie. 📈

<b>Jak to działa?</b>
Kiedy oszczędzasz lub inwestujesz pieniądze, oprocentowanie składane działa, reinwestując zarobione odsetki. Na przykład, jeśli zainwestujesz 1000 zł przy stopie 5% rocznie, po pierwszym roku zarobisz 50 zł. W drugim roku naliczone odsetki będą od 1050 zł, co przyspiesza wzrost kapitału! 💡

<b>Dlaczego to ważne?</b>

<i>Wzrost wykładniczy</i> ⏳ — Im wcześniej zaczniesz, tym większy kapitał zbudujesz z czasem.
<i>Automatyczny wzrost</i> 🛋️ — Pieniądze rosną same z siebie, wystarczy raz zainwestować!
<b>Wskazówka:</b> Zacznij oszczędzać lub inwestować jak najwcześniej, aby oprocentowanie składane pomnożyło twoje oszczędności! 🌱

Ten przycisk pomoże Ci obliczyć odsetki składane
🔽🔽🔽🔽`,
};

export const FINANCE_LITERACY_BUTTON_TEXT = {
  en: 'Calculate Compound Interest',
  ua: 'Розрахувати Складний Відсоток',
  pl: 'Oblicz Oprocentowanie Składanego',
};

export const FINANCE_LITERACY_COMPOUND_INTEREST_TEX = {
  en: `<b>How to Calculate Compound Interest? 📊</b>

To calculate, enter the following values separated by commas:
1️⃣ The amount you’ll save each month.
2️⃣ The duration (number of years).
3️⃣ The annual interest rate.

<i>Example:</i>
<code>1000, 10, 15</code>
— this means you save $1000 per month for 10 years at an annual rate of 15%.`,
  ua: `<b>Як розрахувати складні відсотки? 📊</b>

Щоб зробити розрахунок, введіть через кому:
1️⃣ Суму, яку ви будете відкладати щомісяця.
2️⃣ Тривалість інвестиції (кількість років).
3️⃣ Відсоток річного доходу.

<i>Приклад:</i>
<code>1000, 10, 15</code>
— це означає, що ви відкладаєте 1000 грн на місяць на 10 років під 15% річних.`,
  pl: `<b>Jak obliczyć odsetki składane? 📊</b>

Aby obliczyć, wpisz wartości oddzielone przecinkami:
1️⃣ Kwota, którą będziesz odkładać co miesiąc.
2️⃣ Okres (liczba lat).
3️⃣ Roczna stopa procentowa.

<i>Przykład:</i>
<code>1000, 10, 15</code>
— to oznacza, że odkładasz 1000 zł miesięcznie przez 10 lat przy rocznej stopie 15%.`,
};

export const COMPOUND_INTEREST_RESULT = (
  data: CompoundInterestData,
  totalAmount: number | string,
  ctx: IContext & WizardContext,
) => {
  if (typeof totalAmount === 'string') {
    return totalAmount;
  } else {
    const messages = {
      en: `Your compound interest on an amount of <b>${data.amountPerMonth}</b> at a rate of <b>${data.rate}%</b> over a period of <b>${data.durationInYears}</b> years is <b>${totalAmount}</b> 💰.`,
      ua: `Ваш складний відсоток на суму <b>${data.amountPerMonth}</b> під ставку <b>${data.rate}%</b> на термін <b>${data.durationInYears}</b> років складає <b>${totalAmount}</b> грн 💵.`,
      pl: `Twój złożony procent od kwoty <b>${data.amountPerMonth}</b> przy stopie <b>${data.rate}%</b> na okres <b>${data.durationInYears}</b> lat wynosi <b>${totalAmount}</b> zł 🪙.`,
    };
    return messages[ctx.session.language];
  }
};

export const VALIDATION_MESSAGES = (language: string) => {
  const messages = {
    en: {
      amountNaN: 'Deposit amount must be a number and cannot be empty.',
      rateNaN: 'Interest rate must be a number and cannot be empty.',
      durationNaN: 'Duration must be a number and cannot be empty.',
      amountInvalid: 'Deposit amount must be greater than 0.',
      rateInvalid: 'Interest rate must be between 0 and 100.',
      durationInvalid: 'Duration must be greater than 0 years.',
    },
    ua: {
      amountNaN: 'Сума внеску повинна бути числом і не може бути порожньою.',
      rateNaN: 'Процентна ставка повинна бути числом і не може бути порожньою.',
      durationNaN: 'Тривалість повинна бути числом і не може бути порожньою.',
      amountInvalid: 'Сума внеску повинна бути більше 0.',
      rateInvalid: 'Процентна ставка повинна бути в межах від 0 до 100.',
      durationInvalid: 'Тривалість повинна бути більше 0 років.',
    },
    pl: {
      amountNaN: 'Kwota depozytu musi być liczbą i nie może być pusta.',
      rateNaN: 'Stawka procentowa musi być liczbą i nie może być pusta.',
      durationNaN: 'Czas trwania musi być liczbą i nie może być pusty.',
      amountInvalid: 'Kwota depozytu musi być większa niż 0.',
      rateInvalid: 'Stawka procentowa musi być w zakresie od 0 do 100.',
      durationInvalid: 'Czas trwania musi być większy niż 0 lat.',
    },
  };

  return messages[language];
};

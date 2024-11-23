export const MAIN_MENU = {
  en: '👋Welcome to the main menu, select the desired item⤵️',
  ua: '👋Вітаю вас у головному меню оберіть потрібний пункт⤵️',
  pl: '👋Witaj w menu głównym, wybierz żądany element⤵️',
};

export const ERROR_MESSAGE = {
  en: '⛔️ An error occurred while executing the command. Please try again later. ⛔️',
  ua: '⛔️ Сталася помилка під час виконання команди. Будь ласка, спробуйте ще раз пізніше. ⛔️',
  pl: '⛔️ Wystąpił błąd podczas wykonywania polecenia. Spróbuj ponownie później. ⛔️',
};

export const SELECT_TRANSACTION_MESSAGE = {
  en: 'Please select the transaction you need:🔽',
  ua: 'Оберіть, будь ласка, транзакцію яка вам потрібна:🔽',
  pl: 'Wybierz potrzebną transakcję:🔽',
};

export const ENTER_INCOME_MESSAGE = {
  en: `Enter the income name and amount separated by a space. \n<b><u>To enter multiple transactions, separate them with a comma.</u></b> \nNote: Use up to <b>three words for each transaction name, and emojis are allowed.</b>\n<u>Example: "<b>Salary 💼 100000</b>, <b>Bonus 🏆 5000"</b></u>`,
  ua: `Введіть найменування приходу та суму через пробіл. \n<b><u>Для введення кількох транзакцій, розділіть їх комою.</u></b> \nПримітка: Використовуйте до <b>трьох слів для назви кожної транзакції, дозволено використовувати емодзі.</b>\n<u>Приклад: "<b>Зарплата 💼 100000</b>, <b>Премія 🏆 5000"</b></u>`,
  pl: `Wprowadź nazwę i kwotę przychodu oddzieloną spacją. \n<b><u>Aby wprowadzić wiele transakcji, oddziel je przecinkiem.</u></b> \nUwaga: Użyj maksymalnie <b>trzech słów na nazwę każdej transakcji, dozwolone są emoji.</b>\n<u>Przykład: "<b>Wynagrodzenie 💼 100000</b>, <b>Premia 🏆 5000"</b></u>`,
};

export const ENTER_EXPENSE_MESSAGE = {
  en: `Enter the expense name and amount separated by a space. \n<b><u>To enter multiple transactions, separate them with a comma.</u></b> \nNote: Use up to <b>three words for each transaction name, and emojis are allowed.</b>\n<u>Example: "<b>Rent 🏠 2000</b>, <b>Groceries 🛒 500"</b></u>`,
  ua: `Введіть найменування витрати та суму через пробіл. \n<b><u>Для введення кількох транзакцій, розділіть їх комою.</u></b> \nПримітка: Використовуйте до <b>трьох слів для назви кожної транзакції, дозволено використовувати емодзі.</b>\n<u>Приклад: "<b>Оренда 🏠 2000</b>, <b>Продукти АТБ 🛒 500"</b></u>`,
  pl: `Wprowadź nazwę i kwotę wydatku oddzieloną spacją. \n<b><u>Aby wprowadzić wiele transakcji, oddziel je przecinkiem.</u></b> \nUwaga: Użyj maksymalnie <b>trzech słów na nazwę każdej transakcji, dozwolone są emoji.</b>\n<u>Przykład: "<b>Wynajem 🏠 2000</b>, <b>Artykuły spożywcze 🛒 500"</b></u>`,
};

export const TRANSACTION_DELETED_MESSAGE = {
  en: 'Transaction deleted🗑️',
  ua: 'Транзакцію видалено🗑️',
  pl: 'Transakcja usunięta🗑️',
};

export const SELECT_CATEGORY_MESSAGE = {
  en: 'Select the transaction category:',
  ua: 'Оберіть категорію транзакції:',
  pl: 'Wybierz kategorię transakcji:',
};

export const WANT_STATISTICS_MESSAGE = {
  en: 'Would you like to receive transaction statistics? Select a parameter:',
  ua: 'Бажаєте отримати статистику транзакцій? Виберіть параметр:',
  pl: 'Czy chcesz otrzymać statystyki transakcji? Wybierz parametr:',
};

export const INVALID_DATA_MESSAGE = {
  en: 'Please enter valid data.',
  ua: 'Будь ласка, введіть правильні дані.',
  pl: 'Proszę podać poprawne dane.',
};

export const INVALID_TRANSACTION_NAME_MESSAGE = {
  en: 'Please specify one or two words in the "Transaction Name" field.',
  ua: 'Будь ласка, вкажіть одне або два слова в полі "Найменування транзакції".',
  pl: 'Proszę podać jedno lub dwa słowa w polu "Nazwa transakcji".',
};

export const SELECT_MONTH_MESSAGE = {
  en: 'Select the month:',
  ua: 'Оберіть місяць:',
  pl: 'Wybierz miesiąc:',
};

export const SELECT_DAY_MESSAGE = {
  en: 'Select the day:',
  ua: 'Оберіть день:',
  pl: 'Wybierz dzień:',
};

export const BALANCE_MESSAGE = {
  en: 'Balance has been updated✅',
  ua: 'Баланс оновлено✅',
  pl: 'Saldo zostało zaktualizowane✅',
};

export const CREATE_TRANSACTION_MESSAGE = {
  en: `🔽Your statistics on these transactions🔽`,
  ua: `🔽Ваша статистика по цім транзакціям🔽`,
  pl: `🔽Twoje statystyki dotyczące tych transakcji🔽`,
};

export const getBalanceMessage = (balance: number, language: string = 'ua', currency: string = 'UAH') => {
  const setCurrency = CURRNCY[currency];
  const messages = {
    en: `<b>Your balance: ${balance}${setCurrency} </b>🗃️`,
    ua: `<b>Твій баланс: ${balance}${setCurrency} </b>🗃️`,
    pl: `<b>Twój stan konta: ${balance}${setCurrency} </b>🗃️`,
  };

  return messages[language];
};

export const DELETE_LAST_MESSAGE = {
  en: 'If you made a mistake or just want to delete a transaction, select the transactions to delete🗑️:',
  ua: 'Якщо ви зробили помилку або просто хочете видалити транзакцію, оберіть транзакції для видалення🗑️:',
  pl: 'Jeśli popełniłeś błąd lub chcesz po prostu usunąć transakcję, wybierz transakcje do usunięcia🗑️:',
};

export const DELETE_LAST_MESSAGE2 = {
  en: '⛔️There are no available transactions to delete.⛔️:',
  ua: '⛔️Немає доступних транзакцій для видалення.⛔️:',
  pl: '⛔️Brak dostępnych transakcji do usunięcia.⛔️:',
};

export const PERIOD_E = {
  en: '⛔️There are no transactions for this period⛔️',
  ua: '⛔️Немає транзакцій за цей період⛔️',
  pl: '⛔️Brak transakcji w tym okresie⛔️',
};
export const PERIOD_NULL = {
  en: 'Currently, you have no transactions',
  ua: 'Наразі у вас немає транзакцій',
  pl: 'Aktualnie nie masz żadnych transakcji',
};

export const TOTAL_MESSAGES = {
  TOTAL_AMOUNT: {
    en: '\n------------------------------------\n<b>Grand Total:</b>',
    ua: '\n------------------------------------\n<b>Загальний підсумок:</b>',
    pl: '\n------------------------------------\n<b>Suma całkowita:</b>',
  },
  POSITIVE_TRANSACTIONS: {
    en: '<b>📈Positive transactions⤵️:</b>\n',
    ua: '<b>📈Доля додатних транзакцій⤵️:</b>\n',
    pl: '<b>📈Transakcje dodatnie⤵️:</b>\n',
  },
  NEGATIVE_TRANSACTIONS: {
    en: '<b>📉Negative transactions⤵️:</b>\n',
    ua: "<b>📉Доля від'ємних транзакцій⤵️:</b>\n",
    pl: '<b>📉Transakcje ujemne⤵️:</b>\n',
  },
};
export const RESETS_ALL = {
  en: {
    CONFIRM_RESET: 'All your data will be permanently deleted. If you agree, enter `RESET`.',
    RESET_SUCCESSFUL: 'Deletion was successful.',
    RESET_CANCELED: 'Deletion of your data has been canceled.',
    ARE_YOU_SURE: 'Are you sure? All your data will be deleted.',
  },
  ua: {
    CONFIRM_RESET: 'Всі ваші дані будуть видалені назавжди. Якщо ви згодні, введіть `RESET`.',
    RESET_SUCCESSFUL: 'Видалення пройшло успішно.',
    RESET_CANCELED: 'Видалення ваших даних скасовано.',
    ARE_YOU_SURE: 'Ви впевнені? Всі ваші дані будуть видалені.',
  },
  pl: {
    CONFIRM_RESET: 'Wszystkie twoje dane zostaną trwale usunięte. Jeśli się zgadzasz, wpisz `RESET`.',
    RESET_SUCCESSFUL: 'Usunięcie powiodło się.',
    RESET_CANCELED: 'Usunięcie twoich danych zostało anulowane.',
    ARE_YOU_SURE: 'Jesteś pewny? Wszystkie twoje dane zostaną usunięte.',
  },
};

export const CURRNCY = {
  USD: '$',
  UAH: 'грн.',
  PLN: `zł.`,
};

export const INVITATION_ACCEPTED_MESSAGE = (inputId: number, language: string) => {
  const messages = {
    en: `You have accepted the invitation from user with ID ${inputId}`,
    ua: `Ви прийняли запрошення від користувача з ID ${inputId}`,
    pl: `Zaakceptowałeś zaproszenie od użytkownika z ID ${inputId}`,
  };

  return messages[language];
};

export const SELECT_YEAR_MESSAGE = {
  en: 'Select Year',
  ua: 'Оберіть рік',
  pl: 'Wybierz rok',
};

export const GROUP_INVITATION_MESSAGE = (userId: number, language: string) => {
  const messages = {
    en: `You have been invited to the group by user: ${userId}. Do you accept?`,
    ua: `Ви були запрошені в групу користувачем: ${userId}. Приймаєте?`,
    pl: `Zostałeś zaproszony do grupy przez użytkownika: ${userId}. Czy akceptujesz?`,
  };

  return messages[language];
};

export const SELECT_SETTING_MESSAGE = {
  en: 'Select the Settings:🔽',
  ua: 'Оберіть налаштування:🔽',
  pl: 'Wybierz ustawienia:🔽',
};

export const CURRENCY_MESSAGE = (currencyName: string, currencyBay: string, currencySell: string, language: string) => {
  const messages = {
    en: `Average rate of currency:
 <b>${currencyName}</b> in exchangers for today:
     <b>sell:</b> ${currencySell}UAH
     <b>buy:</b> ${currencyBay}UAH `,
    ua: `Середній курс валюти:
 <b>${currencyName}</b> в обмінниках на сьогодні: 
    <b>продаж:</b> ${currencySell}грн. 
    <b>купівля:</b> ${currencyBay}грн.`,
    pl: `Średni kurs waluty:
 <b>${currencyName}</b> w kantorach na dziś:
     <b>sprzedaż:</b> ${currencySell}UAH
     <b>kupno:</b> ${currencyBay}UAH `,
  };
  return messages[language];
};

export const CRYPTO_MESSAGE = (
  cryptoName: string,
  cryptoSymbol: string,
  cryptoPriceUsd: string,
  cryptoChangePercent24Hr: string,
  language: string,
) => {
  const messages = {
    en: `Coin rate: 🪙${cryptoSymbol} <b>${cryptoName}</b> in average for today:
    <b>Price:</b> ${parseFloat(cryptoPriceUsd).toFixed(3)}$.
    <b>Crypto change over the last 24 hours 📊:</b> ${parseFloat(cryptoChangePercent24Hr).toFixed(3)}%.`,
    ua: `Курс монеты: 
    ${cryptoSymbol} <b>${cryptoName}</b> в середньому на сьогодні: 
    <b>Ціна:</b> ${parseFloat(cryptoPriceUsd).toFixed(3)}$. 
    <b>Зміна ціни за останні 24 години 📊:</b> ${parseFloat(cryptoChangePercent24Hr).toFixed(3)}%.`,
    pl: `Kurs kryptowaluty: 🪙${cryptoSymbol} <b>${cryptoName}</b> średnio na dzisiaj:
    <b>Cena:</b> ${parseFloat(cryptoPriceUsd).toFixed(3)}$.
    <b>Zmiana w ciągu ostatnich 24 godzin 📊:</b> ${parseFloat(cryptoChangePercent24Hr).toFixed(3)}%.`,
  };
  return messages[language];
};
export const SELECT_CURRENCY_MESSAGE = {
  en: 'Choose the currency you need:🔽',
  ua: 'Оберіть потрібну вам валюту:🔽',
  pl: 'Wybierz potrzebną walutę:🔽',
};

export const DELETE_COMPARE_DATA = {
  ua: 'Днанні успішно видалено✅',
  en: 'Data deleted successfully✅.',
  pl: 'Dane zostały usunięte pomyślnie✅.',
};
export const DATA_FOR = {
  ua: 'Дані за',
  en: 'Data for',
  pl: 'Dane dla',
};
export const DATA_PERIOD = (startDate: string, endDate: string, language: string) => {
  const message = {
    ua: `Период с ${startDate} до ${endDate}\n`,
    en: `Period from ${startDate} to ${endDate}📆\n`,
    pl: `Okres od ${startDate} do ${endDate}📆\n`,
  };
  return message[language];
};

export const ADVANCE_STATISTICS = {
  ua: `Це меню просунутої статистики воно ще в розробці⚙️ сюди буде додаватися новий функціонал`,
  en: `This is the menu of advanced statistics, it is still under development⚙️, new functionality will be added here`,
  pl: `To jest menu zaawansowanych statystyk, jest wciąż w trakcie opracowywania⚙️, nowa funkcjonalność zostanie tutaj dodana`,
};

export const TOP10 = {
  ua: `Це графік 🔝топ10 ваших транзакцій за весь час`,
  en: `This is a graph of your 🔝top 10 transactions for all time`,
  pl: `To jest wykres twoich 🔝10 najważniejszych transakcji przez cały czas`,
};

export const SELECT_PERIOD = {
  ua: `Це ваша діаграма за обраний період`,
  en: `This is your chart for the selected period`,
  pl: `To jest wykres dla wybranego okresu`,
};

export const COUNT_WITH = {
  ua: `Перша транзакція:`,
  en: `First transaction:`,
  pl: `Pierwsza transakcja:`,
};
export const COUNT_BY = {
  ua: `Остання транзакція:`,
  en: `Last transaction:`,
  pl: `Ostatnia transakcja:`,
};

export const INFO_MESSAGE = {
  ua: `Це інформаційне меню тут буде з'являтися корисна інформація ℹ️`,
  en: `This information menu, useful information will appear here ℹ️`,
  pl: `To menu informacyjne, przydatne informacje pojawią się tutaj ℹ️`,
};

export const PLEASE_NUM = {
  ua: `Будь ласка, введіть ціле число ⛔️`,
  en: `Please enter a whole number. ⛔️`,
  pl: `Please enter a whole number. ⛔️`,
};
export const SET_BALANCE = {
  ua: `Баланс встановлено на:`,
  en: `The balance is set to:`,
  pl: `Saldo jest ustawione na:`,
};

export const SET_BALANCE_TEX = {
  ua: `Якщо вам потрібно змінити баланс на будь який вам потрібний то напишіть його нижче 
  (також можна додати знак ➖ і баланс буду від'ємний)🔽🔽🔽`,
  en: `If you need to change the balance to any you want, write it below 
  (you can also add a ➖ sign and the balance will be negative)🔽🔽🔽`,
  pl: `Jeśli chcesz zmienić saldo na takie jakie potrzebujesz napisz to poniżej
 (możesz też dodać znak ➖ i saldo będzie ujemne)🔽🔽🔽`,
};

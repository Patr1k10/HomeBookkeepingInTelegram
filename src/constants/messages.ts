export const MAIN_MENU = {
  en: '👋Welcome to the main menu, select the desired item⤵️',
  ua: '👋Вітаю вас у головному меню оберіть потрібний пункт⤵️',
};

export const ERROR_MESSAGE = {
  en: '⛔️ An error occurred while executing the command. Please try again later. ⛔️',
  ua: '⛔️ Сталася помилка під час виконання команди. Будь ласка, спробуйте ще раз пізніше. ⛔️',
};

export const SELECT_TRANSACTION_MESSAGE = {
  en: 'Please select the transaction you need:🔽',
  ua: 'Оберіть, будь ласка, транзакцію яка вам потрібна:🔽',
};

export const ENTER_INCOME_MESSAGE = {
  en: 'Enter the income name and amount separated by a space. \nTo enter multiple transactions, separate them with a comma. \nNote: Use up to <b>two words for each transaction name.</b>\n<u>Example: "<b>Salary 100000</b>, <b>Bonus 5000"</b></u>',
  ua: 'Введіть найменування приходу та суму через пробіл. \nДля введення кількох транзакцій, розділіть їх комою. \nПримітка: Використовуйте до <b>двох слів для назви кожної транзакції.</b>\n<u>Приклад: "<b>Зарплата 100000</b>, <b>Віддали борг 5000"</b></u>',
};

export const ENTER_EXPENSE_MESSAGE = {
  en: 'Enter the expense name and amount separated by a space. \nTo enter multiple transactions, separate them with a comma. \nNote: Use up to <b>two words for each transaction name.</b>\n<u>Example: "<b>Rent 2000</b>, <b>Groceries 500"</b></u>',
  ua: 'Введіть найменування витрати та суму через пробіл. \nДля введення кількох транзакцій, розділіть їх комою. \nПримітка: Використовуйте до <b>двох слів для назви кожної транзакції.</b>\n<u>Приклад: "<b>Оренда 2000</b>, <b>Продукти АТБ 500"</b></u>',
};

export const TRANSACTION_DELETED_MESSAGE = {
  en: 'Transaction deleted🗑️',
  ua: 'Транзакцію видалено🗑️',
};

export const SELECT_CATEGORY_MESSAGE = {
  en: 'Select the transaction category:',
  ua: 'Оберіть категорію транзакції:',
};

export const WANT_STATISTICS_MESSAGE = {
  en: 'Would you like to receive transaction statistics? Select a parameter:',
  ua: 'Бажаєте отримати статистику транзакцій? Виберіть параметр:',
};

export const INVALID_DATA_MESSAGE = {
  en: 'Please enter valid data.',
  ua: 'Будь ласка, введіть правильні дані.',
};

export const INVALID_TRANSACTION_NAME_MESSAGE = {
  en: 'Please specify one or two words in the "Transaction Name" field.',
  ua: 'Будь ласка, вкажіть одне або два слова в полі "Найменування транзакції".',
};

export const SELECT_MONTH_MESSAGE = {
  en: 'Select the month:',
  ua: 'Оберіть місяць:',
};

export const SELECT_DAY_MESSAGE = {
  en: 'Select the day:',
  ua: 'Оберіть день:',
};

export const BALANCE_MESSAGE = {
  en: 'Balance has been updated✅',
  ua: 'Баланс оновлено✅',
};

export const getBalanceMessage = (balance: number, language: string = 'ua', currency: string = 'UAH') => {
  const setCurrency = CURRNCY[currency];
  const messages = {
    en: `<b>Your balance: ${balance}${setCurrency} </b>🗃️`,
    ua: `<b>Твій баланс: ${balance}${setCurrency} </b>🗃️`,
  };

  return messages[language];
};

export const DELETE_LAST_MESSAGE = {
  en: 'If you made a mistake or just want to delete a transaction, select the transactions to delete🗑️:',
  ua: 'Якщо ви зробили помилку або просто хочете видалити транзакцію, оберіть транзакції для видалення🗑️:',
};

export const DELETE_LAST_MESSAGE2 = {
  en: '⛔️There are no available transactions to delete.⛔️:',
  ua: '⛔️Немає доступних транзакцій для видалення.⛔️:',
};

export const PERIOD_E = {
  en: '⛔️There are no transactions for this period⛔️',
  ua: '⛔️Немає транзакцій за цей період⛔️',
};
export const PERIOD_NULL = {
  en: 'Currently, you have no transactions',
  ua: 'Наразі у вас немає транзакцій',
};

export const TOTAL_MESSAGES = {
  TOTAL_AMOUNT: {
    en: '\n------------------------------------\n<b>Grand Total:</b>',
    ua: '\n------------------------------------\n<b>Загальний підсумок:</b>',
  },
  POSITIVE_TRANSACTIONS: {
    en: '<b>📈Positive transactions⤵️:</b>\n',
    ua: '<b>📈Доля додатних транзакцій⤵️:</b>\n',
  },
  NEGATIVE_TRANSACTIONS: {
    en: '<b>📉Negative transactions⤵️:</b>\n',
    ua: "<b>📉Доля від'ємних транзакцій⤵️:</b>\n",
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
};

export const CURRNCY = {
  USD: '$',
  UAH: 'грн.',
};

export const INVITATION_ACCEPTED_MESSAGE = (inputId: number, language: string) => {
  const messages = {
    en: `You have accepted the invitation from user with ID ${inputId}`,
    ua: `Ви прийняли запрошення від користувача з ID ${inputId}`,
  };

  return messages[language];
};

export const SELECT_YEAR_MESSAGE = {
  en: 'Select Year',
  ua: 'Оберіть рік',
};

export const GROUP_INVITATION_MESSAGE = (userId: number, language: string) => {
  const messages = {
    en: `You have been invited to the group by user: ${userId}. Do you accept?`,
    ua: `Ви були запрошені в групу користувачем: ${userId}. Приймаєте?`,
  };

  return messages[language];
};

export const SELECT_SETTING_MESSAGE = {
  en: 'Select the Settings:🔽',
  ua: 'Оберіть налаштування:🔽',
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
  };
  return messages[language];
};
export const SELECT_CURRENCY_MESSAGE = {
  en: 'Choose the currency you need:🔽',
  ua: 'Оберіть потрібну вам валюту:🔽',
};

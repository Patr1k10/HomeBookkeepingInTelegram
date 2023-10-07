// messages.ts

export const START_MESSAGE = {
  en: {
    WELCOME_MESSAGE: `<b>👋 Hello! Welcome to your financial assistant. 📘</b>

<i>This tool is designed for effective budget tracking.</i> With its help, you can easily monitor <b>Incomes 💰</b> and <b>Expenses 📉</b>, as well as get a summary of your current balance.

To get started, select "Transaction," and then decide on the type: "Income" or "Expense". 📊`,
  },
  ua: {
    WELCOME_MESSAGE: `<b>👋 Привіт! Ласкаво просимо до вашого фінансового помічника. 📘</b>

 <i>Цей інструмент створено для ефективного обліку вашого бюджету.</i> З його допомогою можна легко відслідковувати <b>Надходження 💰</b> та <b>Витрати 📉</b>, а також отримувати зведення за поточним балансом.

Для початку роботи виберіть "Транзакція", а потім визначтеся з типом: "Надходження" або "Витрати". 📊`,
  },
};

export const HELP_MESSAGE = {
  en: `<b>📘 Guide to using your financial bot. 📘</b>

<i>This bot is designed to effectively manage your finances.</i> It offers the following main commands:

- <b>/transactions 💸:</b> Allows you to view and manage your transactions.
- <b>/balance 💰:</b> Shows your current balance.
- <b>/statistics 📊:</b> Provides statistics of your financial activity.
- <b>/language 🌐:</b> To change the interface language.

👇 <i>Additional Options:</i>
- <b>Income:</b> To add an income.
- <b>Expense:</b> To add an expense.
- <b>Delete Last️:</b> To delete the last transactions.

🔧 <i>If you have any questions or suggestions, feel free to contact us.</i>

📩 <b>For additional help or questions, please email us at: <a href="mailto:help.tgbot@icloud.com">help.tgbot@icloud.com</a></b> 📩`,

  ua: `<b>📘 Інструкція з використання вашого фінансового бота. 📘</b>

<i>Цей бот створений для ефективного управління вашими фінансами.</i> Він пропонує наступні основні команди:

- <b>/transactions 💸:</b> Дозволяє переглядати та управляти вашими транзакціями.
- <b>/balance 💰:</b> Показує ваш поточний баланс.
- <b>/statistics 📊:</b> Видає статистику вашої фінансової активності.
- <b>/language 🌐:</b> Зміна мови інтерфейсу.

👇 <i>Додаткові опції:</i>
- <b>Приход:</b> Додавання доходу.
- <b>Расход:</b> Додавання витрат.
- <b>Удаление последних️:</b> Видалення останніх транзакцій.

🔧 <i>Якщо у вас є питання або пропозиції, не соромтесь звертатися.</i>

📩 <b>Для додаткової допомоги або питань, будь ласка, напишіть на нашу електронну пошту: <a href="mailto:help.tgbot@icloud.com">help.tgbot@icloud.com</a></b> 📩`,
};

export const ERROR_MESSAGE = {
  en: '⛔️ An error occurred while executing the command. Please try again later. ⛔️',
  ua: '⛔️ Сталася помилка під час виконання команди. Будь ласка, спробуйте ще раз пізніше. ⛔️',
};

export const SELECT_TRANSACTION_MESSAGE = {
  en: 'Select the transaction:🔽',
  ua: 'Оберіть транзакцію:🔽',
};

export const ENTER_INCOME_MESSAGE = {
  en: 'Enter the income name and amount separated by a space. To enter multiple transactions, separate them with a comma. \nExample: "Salary 100000, Bonus 5000"',
  ua: 'Введіть найменування приходу та суму через пробіл. Для введення кількох транзакцій, розділіть їх комою. \nПриклад: "Зарплата 100000, Бонус 5000"',
};

export const ENTER_EXPENSE_MESSAGE = {
  en: 'Enter the expense name and amount separated by a space. To enter multiple transactions, separate them with a comma. \nExample: "Rent 2000, Groceries 500"',
  ua: 'Введіть найменування витрати та суму через пробіл. Для введення кількох транзакцій, розділіть їх комою. \nПриклад: "Аренда 2000, Продукти 500"',
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

export const BALANCE_MESSAGE = {
  en: 'Your balance has been updated✅',
  ua: 'Ваш баланс оновлено✅',
};

export const getBalanceMessage = (balance: number, language: string) => {
  const messages = {
    en: `<b>Your balance: ${balance} </b>🗃️`,
    ua: `<b>Твій баланс: ${balance} </b>🗃️`,
  };

  return messages[language];
};

export const DELETE_LAST_MESSAGE = {
  en: 'Select the transactions to delete🗑️:',
  ua: 'Оберіть транзакції для видалення🗑️:',
};
export const DELETE_LAST_MESSAGE2 = {
  en: '⛔️There are no available transactions to delete.⛔️:',
  ua: '⛔️Немає доступних транзакцій для видалення.⛔️:',
};

export const PERIOD_E = {
  en: '⛔️There are no transactions for this period⛔️',
  ua: '⛔️Немає транзакцій за цей період⛔️',
};

export const TOTAL_MESSAGES = {
  TOTAL_AMOUNT: {
    en: '\n------------------------------------\n<b>Total:</b>',
    ua: '\n------------------------------------\n<b>Усього:</b>',
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

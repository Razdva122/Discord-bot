# Discord-bot для Among Us

## Общее

Бот предназначен для проведения рейтинговых игр через голосовые чаты в дискорд.

### Технологии
Язык: [TypeScript](https://www.typescriptlang.org/)
Сервер: [Node.ts](https://www.npmjs.com/package/ts-node)
База данных: [MongoDb](https://www.mongodb.com/)
Api Discord: [Discord.js](https://discord.js.org/#/)

### Начало работы

1. Склонируйте репозиторий

```bash
git clone https://github.com/Razdva122/Discord-bot.git
```

2. Установите зависимости

```bash
cd Discord-bot
npm install
```

3. Бота нужно создать и добавить в [панели приложений Discord](https://discord.com/developers/applications/), после этого нужно добавить его на свой сервер. Подробно этот пункт описан в гайде [Создание бота Discord Bot с помощью Node.js](https://www.digitalocean.com/community/tutorials/how-to-build-a-discord-bot-with-node-js-ru#%D1%88%D0%B0%D0%B3-1-%E2%80%94-%D0%BD%D0%B0%D1%81%D1%82%D1%80%D0%BE%D0%B9%D0%BA%D0%B0-%D0%B1%D0%BE%D1%82%D0%B0-discord) -  Шаг 1

4. Инициализация MongoDb Atlas (Бесплатной облачной версии)
[Гайд по созданию на английском языке](https://codeforgeek.com/mongodb-atlas-node-js/) или [Видео также на английском](https://www.youtube.com/watch?v=rPqRyYJmx2g). 
На выходе вы получите строку для соединения формата `mongodb+srv://<Юзернейм для mongodb>:<Пароль для mongodb>@<Путь к серверу>/<Название коллекции для mongodb>`
Эти поля потребуются для настройки бота.

5. Настройте бота
Приватные настройки должны быть в файле **src/consts/private.ts**. Он должен экспортировать обьект формата
```typescript
export const settings = {
    mongoUser: {
      user: 'Юзернейм для mongodb',
      password: 'Пароль для mongodb',
    },
    mongoPath: 'Путь к серверу',
    mongoDB: 'Название коллекции для mongodb',
    botSecretToken: 'Ключ для Discord Api',
}
```
Общие настройки хранятся в файле **src/consts/index.ts**. Подробнее в секции [Общие настройки](#общие-настройки). Для первоначального запуска бота достаточно поменять
```typescript
export const mainOwnerID = 'ID вашего пользователя из Discord';
```

6. Запуск бота

```bash
npm start
```

7. Инициализация на сервере

На сервере владелец бота должен его инициализировать написав команду.

```bash
!initServer [Роль админов] [Роль верифицированных пользователей]
```

Админы имеют максимальный доступ.

Верифицированные пользователи имеют права для создания и окончания игр.

## Кастомизация бота

### Общие настройки

Общие настройки хранятся в файле **src/consts/index.ts**.

| Перменная | Назначение | Тип
|----------------|---------|------|
| defaultRating | Начальный рейтинг игрока | `Number`
| usersInLeaderboard | Количестов игроков в лидерборде | `Number`
| maxNicknameForLeadeboardLength | Максимальная длина никнейма юзера для таблицы | `Number`
| additionalRoles | Дополнительные роли | `Object<(key: string): value: string>`
| ratingChange -> crewmate | Изменение рейтинга при игре за crewmate | `Object<(key: [win | lose]): value: number>`
| ratingChange -> impostor | Изменение рейтинга при игре за impostor | `Object<(key: [win | lose]): value: number>`
| accessLevel | Числовое значение уровня доступа от 0 до N. | `Object<(key: string): value: number>`
| helpLevel | Текстовое описания для уровня доступа | `Object<(key: number): value: string>`
| accessLevelToMethods | Уровень доступа к команде | `Object<(key: Имя команды): value: number>`
| helpText | Общее описание команд | `Object<(key: Имя команды): value: string>`
| commandHelp | Подсказка по команде, которая выводится при запросе ![Имя команды] help | `Object<(key: Имя команды): value: string>`
| amountOfResets | Количество сбросов рейтинга: default - для всех и количество для дополнительных ролей | `Object<(key: string): value: number>`
| mainOwnerID | ID владельца бота с максимальным уровнем доступа | `String`

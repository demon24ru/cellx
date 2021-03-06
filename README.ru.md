<p>
    <img src="https://raw.githubusercontent.com/Riim/cellx/master/docs/images/logo.png" width="237" height="129">
</p>

Сверхбыстрая реализация реактивности для javascript.

## Установка

```
npm install --save cellx
```

## Пример использования

```js
let user = {
    firstName: cellx('Матроскин'),
    lastName: cellx('Кот'),

    fullName: cellx(function() {
        return (user.firstName() + ' ' + user.lastName()).trim();
    })
};

user.fullName.subscribe(function() {
    console.log('fullName: ' + user.fullName());
});

console.log(user.fullName());
// => 'Матроскин Кот'

user.firstName('Шарик');
user.lastName('Пёс');
// => 'fullName: Шарик Пёс'
```

Несмотря на то, что изменились две зависимости ячейки `fullName`, обработчик её изменения сработал только один раз.
Важной особенностью cellx-а является то, что он старается максимально избавиться как от лишних вызовов
обработчиков изменений, так и от лишних вызовов расчётных формул зависимых ячеек. В сочетании с ещё некоторыми оптимизациями это приводит к идеальной скорости расчёта сложнейших сеток зависимостей.

## Тест производительности

В одном из тестов, который используется для замера производительности, генерируется сетка из множества "слоёв",
каждый из которых состоит из 4-x ячеек. Ячейки вычисляются из ячеек предыдущего слоя (кроме самого первого, он содержит
исходные значения) по формуле A2=B1, B2=A1-C1, C2=B1+D1, D2=C1. Далее запоминается начальное время, меняются значения
всех ячеек первого слоя и замеряется время, через которое все ячейки последнего слоя обновятся.
Результаты теста (в милисекундах) с разным числом слоёв (для Google Chrome 53.0.2785.116 (64-bit)):

| Library ↓ \ Number of computed layers →                 | 10      | 20                                | 30                                  | 50      | 100     | 1000    | 5000                                         |
|---------------------------------------------------------|---------|-----------------------------------|-------------------------------------|---------|---------|---------|----------------------------------------------|
| cellx                                                   |     <~1 |                               <~1 |                                 <~1 |     <~1 |     <~1 |       4 |                                           20 |
| VanillaJS (naive)                                       |     <~1 |                                15 |                                1750 | >300000 | >300000 | >300000 |                                      >300000 |
| [Knockout](http://knockoutjs.com/)                      |      10 | 750, increases in subsequent runs | 67250, increases in subsequent runs | >300000 | >300000 | >300000 |                                      >300000 |
| [$jin.atom](https://github.com/nin-jin/pms-jin/)        |       2 |                                 3 |                                   3 |       4 |       6 |      40 |                                          230 |
| [$mol_atom](https://github.com/nin-jin/mol)             |     <~1 |                               <~1 |                                 <~1 |       1 |       2 |      20 | RangeError: Maximum call stack size exceeded |
| [Reactor.js](https://github.com/fynyky/reactor.js)      |     <~1 |                               <~1 |                                   2 |       3 |       5 |      50 |                                          230 |
| [Reactive.js](https://github.com/mattbaker/Reactive.js) |     <~1 |                               <~1 |                                   2 |       3 |       5 |     140 | RangeError: Maximum call stack size exceeded |
| [Kefir.js](https://rpominov.github.io/kefir/)           |      25 |                              2500 |                             >300000 | >300000 | >300000 | >300000 |                                      >300000 |
| [MobX](https://mobxjs.github.io/mobx/)                  |     <~1 |                               <~1 |                                 <~1 |       2 |       3 |      40 | RangeError: Maximum call stack size exceeded |

Исходники теста можно найти в папке [perf](https://github.com/Riim/cellx/tree/master/perf).
Плотность связей в реальных приложениях обычно ниже чем в данном тесте, то есть если в тесте определённая задержка
появляется на 100 вычисляемых ячейках (25 слоёв), то в реальном приложении подобная задержка будет либо
на большем числе ячеек, либо в формулах ячеек будут какие-то сложные расчёты (например, вычисление одного массива
из другого).

## Использование

Ячейки можно сохранять в переменных:

```js
let num = cellx(1);
let plusOne = cellx(() => num() + 1);

console.log(plusOne());
// => 2
```

в вызываемых свойствах:

```js
function User(name) {
    this.name = cellx(name);
    this.nameInitial = cellx(() => this.name().charAt(0).toUpperCase());
}

let user = new User('Матроскин');

console.log(user.nameInitial());
// => 'М'
```

или в обычных свойствах:

```js
function User(name) {
    cellx.define(this, {
        name: name,
        nameInitial: function() { return this.name.charAt(0).toUpperCase(); }
    });
}

let user = new User('Матроскин');

console.log(user.nameInitial);
// => 'М'
```

### Использование с ES.Next

Используйте npm модуль [cellx-decorators](https://www.npmjs.com/package/cellx-decorators).

### Использование с React

Используйте npm модуль [cellx-react](https://www.npmjs.com/package/cellx-react).

### Другие модули для cellx

* [cellx-indexed-collections](https://www.npmjs.com/package/cellx-indexed-collections)
* [Rionite](https://www.npmjs.com/package/rionite)

### Опции

При создании ячейки можно передать некоторые опции:

#### get

Дополнительная обработка значения при чтении:

```js
// массив, который не получится случайно испортить, портиться будет копия
let arr = cellx([1, 2, 3], {
    get: arr => arr.slice()
});

console.log(arr()[0]);
// => 1

arr()[0] = 5;

console.log(arr()[0]);
// => 1
```

#### put

Используется для создания записываемых вычисляемых ячеек:

```js
function User() {
    this.firstName = cellx('');
    this.lastName = cellx('');

    this.fullName = cellx(
		() => (this.firstName() + ' ' + this.lastName()).trim(),
		{
			put: name => {
				name = name.split(' ');

				this.firstName(name[0]);
				this.lastName(name[1]);
			}
		}
	);
}

let user = new User();

user.fullName('Матроскин Кот');

console.log(user.firstName());
// => 'Матроскин'
console.log(user.lastName());
// => 'Кот'
```

#### validate

Валидирует значение при записи и вычислении.

Валидация при записи в ячейку:

```js
let num = cellx(5, {
    validate: value => {
        if (typeof value != 'number') {
            throw new TypeError('Oops!');
        }
    }
});

try {
    num('Йа строчка');
} catch (err) {
    console.log(err.message);
    // => 'Oops!'
}

console.log(num());
// => 5
```

Валидация при вычислении ячейки:

```js
let value = cellx(5);

let num = cellx(() => value(), {
    validate: value => {
        if (typeof value != 'number') {
            throw new TypeError('Oops!');
        }
    }
});

num.subscribe(err => {
    console.log(err.message);
});

value('Йа строчка');
// => 'Oops!'

console.log(value());
// => 'Йа строчка'

console.log(num());
// => 5
```

### Методы

#### onChange

Добавляет обработчик изменения:

```js
let num = cellx(5);

num.onChange(evt => {
    console.log(evt);
});

num(10);
// => { prevValue: 5, value: 10 }
```

#### offChange

Снимает ранее добавленный обработчик изменения.

#### onError

Добавляет обработчик ошибки:

```js
let value = cellx(1);

let num = cellx(() => value(), {
    validate: v => {
        if (v > 1) {
            throw new RangeError('Oops!');
        }
    }
});

num.onError(evt => {
    console.log(evt.error.message);
});

value(2);
// => 'Oops!'
```

#### offError

Снимает ранее добавленный обработчик ошибки.

#### subscribe

Подписывает на события `change` и `error`. В обработчик первым аргументом приходит объект ошибки, вторым — событие.

```js
user.fullName.subscribe((err, evt) => {
    if (err) {
        //
    } else {
        //
    }
});
```

#### unsubscribe

Отписывает от событий `change` и `error`.

#### Подписка на свойства созданные с помощью `cellx.define`

Подписаться на изменение свойства созданного с помощью `cellx.define` можно через `EventEmitter`:

```js
class User extends cellx.EventEmitter {
    constructor(name) {
        cellx.define(this, {
            name,
            nameInitial: function() { return this.name.charAt(0).toUpperCase(); }
        });
    }
}

let user = new User('Матроскин');

user.on('change:nameInitial', evt => {
    console.log('nameInitial: ' + evt.value);
});

console.log(user.nameInitial);
// => 'М'

user.name = 'Шарик';
// => 'nameInitial: Ш'
```

#### dispose

Во многих движках реактивного программирования вычисляемую ячейку (атом, observable-свойство) нужно воспринимать
как обычный обработчик изменения других ячеек, то есть, что бы "убить" ячейку, недостаточно просто снять с неё все
обработчики и потерять на неё ссылку, её саму тоже нужно отвязать от её зависимостей.
В cellx-е вычисляемые ячейки постоянно отслеживают наличие обработчиков на них самих и всех своих потомках,
и в случае их (обработчиков) отсутствия переходят в режим пассивного обновления, то есть сами отписываются от своих
зависимостей и вычисляются непосредственно при чтении. Таким образом, для "убийства" вычисляемой ячейки нужно просто
снять с неё все добавленные ранее обработчики и забыть ссылку на неё, о других ячейках, из которых она вычисляется
или вычисляемых из неё, думать не нужно. После этого сборщик мусора всё почистит.

На всякий случай можно вызвать `dispose`:

```js
user.name.dispose();
```

это снимет все обработчики не только с самой ячейки, но и со всех вычисляемых из неё ячеек,
при отсутствии ссылок "умрёт" вся ветка зависимостей.

## Динамическая актуализация зависимостей

Формула вычисляемой ячейки может быть написана так, что набор зависимостей может со временем меняться. Например:

```js
let user = {
    firstName: cellx(''),
    lastName: cellx(''),

    name: cellx(() => {
        return this.firstName() || this.lastName();
    })
};
```

Здесь пока `firstName` является пустой строкой, ячейка `name` подписана и на `firstName` и на `lastName`,
так как изменение любого из них приведёт к изменению её значения. Если же задать `firstName`-у какую-то не пустую
строку, то, при перевычислении значения `name`, до чтения `lastName` в формуле просто не дойдёт,
то есть значение ячейки `name` с этого момента уже никак не зависит от `lastName`.
В таких случаях ячейки автоматически отписываются от незначимых для них зависимостей и не перевычисляются
при их изменении. В дальнейшем, если `firstName` снова станет пустой строкой, ячейка `name` вновь подпишется
на `lastName`.

## Синхронизация значения с синхронным хранилищем

```js
let foo = cellx(() => localStorage.foo || 'foo', {
	put: function(cell, value) {
		localStorage.foo = value;
		cell.push(value);
	}
});

let foobar = cellx(() => foo() + 'bar');

console.log(foobar()); // => 'foobar'
console.log(localStorage.foo); // => undefined
foo('FOO');
console.log(foobar()); // => 'FOObar'
console.log(localStorage.foo); // => 'FOO'
```

## Синхронизация значения с асинхронным хранилищем

```js
let request = (() => {
	let value = 1;

	return {
		get: url => new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve({
                    ok: true,
                    value
                });
            }, 1000);
        }),

		put: (url, params) => new Promise((resolve, reject) => {
            setTimeout(() => {
                value = params.value;

                resolve({
                    ok: true
                });
            }, 1000);
        })
	};
})();

let foo = cellx(function(cell, next = 0) {
	request.get('http://...').then((res) => {
		if (res.ok) {
			cell.push(res.value);
		} else {
			cell.fail(res.error);
		}
	});

	return next;
}, {
	put: (value, cell, next) => {
		request.put('http://...', { value: value }).then(res => {
			if (res.ok) {
				cell.push(value);
			} else {
				cell.fail(res.error);
			}
		});
	}
});

foo.subscribe(() => {
	console.log('New foo value: ' + foo());
	foo(5);
});

console.log(foo());
// => 0

foo('then', () => {
    console.log(foo());
});
// => 'New foo value: 1'
// => 1
// => 'New foo value: 5'
```

## Использованные материалы

- [Пишем простое приложение на React с использованием библиотеки cellx](https://habrahabr.ru/post/313038/)
- [Атом — минимальный кирпичик FRP приложения](http://habrahabr.ru/post/235121/)
- [Knockout — Simplify dynamic JavaScript UIs with the Model-View-View Model (MVVM) pattern](http://knockoutjs.com/)

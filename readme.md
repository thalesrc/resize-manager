# @thalesrc/resize-manager
Rxjs Based Resize Events of Window & Dom Elements

[![npm](https://img.shields.io/npm/v/@thalesrc/resize-manager.svg)](https://www.npmjs.com/package/@thalesrc/resize-manager)
[![npm](https://img.shields.io/npm/dw/@thalesrc/resize-manager.svg)](https://www.npmjs.com/package/@thalesrc/resize-manager)
[![npm](https://img.shields.io/npm/l/@thalesrc/resize-manager.svg)](https://github.com/thalesrc/resize-manager/blob/master/LICENSE)
![ts](https://badgen.net/badge/built%20with/typescript/blue)
[![patreon](https://img.shields.io/badge/patreon-alisahin-orange.svg)](https://www.patreon.com/alisahin)

#### Installation
`npm install @thalesrc/resize-manager --save`

All Documentation => [thalesrc.github.io/resize-manager](https://thalesrc.github.io/resize-manager)

#### Basic Usage

```typescript
import { ResizeObserver } from '@thalesrc/resize-manager';

const element = document.querySelector('foo');

const observer = new ResizeObserver(element);

observer.resize.subscribe(({width, height}) => {
  console.log(width, height);
});
```

or

```typescript
import { ResizeManager } from '@thalesrc/resize-manager';

const element1 = document.querySelector('foo');
const element2 = document.querySelector('bar');

const manager = new ResizeManager();

manager.observe(element1).resize.subscribe(({width, height}) => {
  console.log(width, height);
});

manager.observe(element2).resize.subscribe(({width, height}) => {
  console.log(width, height);
});
```
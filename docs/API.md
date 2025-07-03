# `spine2json` API
The [`/scripts/`](../scripts/) directory includes a handful of APIs that can be used either directly via CLI as a standalone tool, or by importing `spine2json` as a package.

## CLI Commands
### [`patch-atlas-json.js`](../scripts/patch-atlas-json.js)
Parses the provided `.atlas` file, pushes `pma: true` into the atlas' attributes, and saves it as `.pma.atlas`
```bash
$ node scripts/patch-atlas-json.js assets/admiral/illust_admiral.atlas
```

### [`parse-spine-skel.js`](../scripts/parse-spine-skel.js)
Fixes scaling errors of provided `.skel` file, converts into json, and saves it as `.s2j.json`
```bash
$ node scripts/parse-spine-skel.js assets/admiral/illust_admiral.skel
```

## JS Modules
> [!TIP]
> The modules can be installed as a package via `npm`:
> ```shell
> npm install github:gt-wikia/spine2json
> ```

### [`spine-atlas.js`](../scripts/spine-atlas.js)
```js
// importing
import { atlas } from 'spine2json/spine-atlas.js';
```

```js
// method: atlas.parse()
// returns: Object representation of atlas text
// Object contents are mutable / re-writable
const atlasTxt = readFileSync('<atlasPath>.atlas', 'utf8');
const atlasJson = atlas.parse(atlasTxt);
console.log(atlasJson);
```

```js
// method: atlas.stringify()
// returns: String representation of Object parsed by atlas.parse()
// String's format is same as standard atlas text
const atlasString = atlas.stringify(atlasJson);
console.log(atlasString);
```

```js
// object structure of parsed atlas
[
  {
    texture: 'texture.png',
    size: [ width, height ],
    format: [ 'format' ],
    filter: [ 'filter', 'filter' ],
    repeat: [ 'repeat' ],
    regions: [
      {
        name: 'sprite',
        rotate: [ true|false | 90|180|270 ],
        xy: [ x_coord, y_coord ],
        size: [ width, height ],
        orig: [ padded_width, padded_height ],
        offset: [ left_pad, bottom_pad ],
        index: [ index ]
      },
      // { more regions },
    ]
  },
  // { more pages },
]
```

### [`spine-skel.js`](../scripts/spine-skel.js)
```js
// importing
import { skel2json } from 'spine2json/spine-skel.js';
```

```js
// constructor: SkeletonBinary
// parameters: (buffer, atlas, scale)
// returns: JSON built from the SkeletonBinary after fixing scalings
const skelBin = readFileSync('<skelPath>.skel');
const atlasTxt = readFileSync('<atlasPath>.atlas', 'utf8');
const atlasJson = atlas.parse(atlasTxt);

const skelJson = skel2json(skelBin, atlasJson, 1);
```

### [`spine-json.js`](../scripts/spine-json.js)
> [!NOTE]
> This is a legacy module with basic functionality, that was used to check the accuracy of the final parsed json when comparing it against the json exported from Spine. The module was later integrated into [`spine-skel.js`](#spine-skeljs).

```js
// importing
import { json2patch } from 'spine2json/spine-json.js';
```

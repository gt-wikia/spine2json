# `spine2json` API
The `/scripts/` directory includes a handful of APIs that can be used either directly in CLI, or by importing as modules.

## CLI Commands
### [`patch-atlas-json.mjs`](/scripts/patch-atlas-json.mjs)
Parses the provided `.atlas` file, pushes `pma: true` into the atlas' attributes, and saves it as `.pma.atlas`
```bash
$ node scripts/patch-atlas-json.mjs assets/admiral/illust_admiral.atlas
```

### [`parse-spine-skel.mjs`](/scripts/parse-spine-skel.mjs)
Fixes scaling errors of provided `.skel` file, converts into json, and saves it as `.s2j.json`
```bash
$ node scripts/parse-spine-skel.mjs assets/admiral/illust_admiral.skel
```

## JS Modules
### [`spine-atlas.mjs`](./spine-atlas.mjs)
```js
// importing
import { atlas } from './scripts/spine-atlas.mjs';
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

### [`spine-skel.mjs`](./spine-skel.mjs)
```js
// importing
import { skel2json } from './scripts/spine-skel.mjs';
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

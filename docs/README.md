# spine2json
`spine2json` (*often mispronounced as `spain2japan`*), is primarily a script that patches the wrong scaling of attachments when rendered using the [Spine application](https://esotericsoftware.com/).

`spine2json` provides API, parsers and batch scripts for manipulating skeleton data using NodeJS. The repository is based on [Spine 3.8 runtime](https://github.com/EsotericSoftware/spine-runtimes/tree/3.8), specifically the [TypeScript flavor](https://github.com/EsotericSoftware/spine-runtimes/blob/3.8/spine-ts/core/src/SkeletonBinary.ts).

## Requirements
* [Spine](https://esotericsoftware.com/) (`v3.8.x` — see note below)
* [AssetRipper](https://github.com/AssetRipper/AssetRipper/releases/tag/0.3.4.0) (`v0.3.4.0`)
* [Node.js](https://nodejs.org/en/download/prebuilt-installer)
* [NPM](https://github.com/npm/cli#installation) (comes bundled with Node.js)
* [FFmpeg](https://www.gyan.dev/ffmpeg/builds/#release-builds)
* [AviSynth+](https://avs-plus.net/get_started.html) (optional)

***Note:*** Spine `v3.8.87` or higher is recommended as it resolves most bugs and version incompatibilities.

## Contribution
To start developing on more up-to-date runtimes, you can [fork](/../../fork) this repository, or create a new branch for higher version via [pull request](/../../pulls).

## Quoting the Main Issue
There are certain discrepancies between the internals of [Spine program](https://esotericsoftware.com/) itself, and the [Spine-Unity plugin](https://en.esotericsoftware.com/spine-unity) that is integrated inside Unity-based games. The problem becomes apparent when some attachments are wrongly scaled upon importing `skel` data directly into the former.
1. ***Spine program*** (Java) and ***Spine-Unity plugin*** (C#) use comparatively different algorithm to read and render `skel` data.
2. `Nonessential data` (i.e. a skel export option) includes scaling for attachments that were resized in Spine program during development.
3. Nonessential data is read by Spine program when importing, to detect the size of rescaled attachments. However, this data isn't required in Spine-Unity plugin and other in-game runtimes. ![Verbatim: Nonessential data — Exports data not needed at runtime but required to use Import Data](/docs/nonessential_data.png)
4. Since this data takes up space, it's a general practice for devs to exclude such "non-essential" data for file-size and performance reasons.
5. The outcome is, Spine faces scaling errors, while Spine-Unity plugin renders the same data correctly.
6. Devs already use `.spine` project files for convenience and backwards-compatibility, so their side remains mostly unharmed.

In fact, this is a common occurrence in games using the Spine runtime. There is even a [discussion thread](https://en.esotericsoftware.com/forum/d/9066-workaround-for-missing-mesh-data/3) that is closely related to this issue.

## The Solution
`spine2json` provides an elegant solution to this issue by reading original attachment dimensions from the `atlas` file, and using it as a reference for making corrections to the skeleton data accordingly.

The algorithm is available in [/scripts/spine-json.mjs](/scripts/spine-json.mjs), and its pseudo-code goes like this:

```js
// adjust skeleton scaling,
// based on attachment-to-atlas ratio
scaleX = scaleX * (width  / atlas.sprite.width);
scaleY = scaleY * (height / atlas.sprite.height);
```

## API
Detailed documentation on `spine2json`'s API can be found inside [/docs/API.md](/docs/API.md).

## CLI
CLI scripts can automate the processing of a skeleton, all the way from a *Unity asset* into a *usable animation video* of the live illustration.

Currently, only batch scripts (`.bat`), i.e. primarily for *Windows*, is being maintained, and may exhibit certain quirks.

### Getting Started
Before running batch scripts, edit the `batconfigs.bat` file and ensure the paths and configurations match with your currently available setup.

### Syntax
***Note**: `asset` is the asset file name, and `model` is the name of the actual model inside the `asset`.*

The overall process is divided between 4 scripts:
1. [`skel-src.bat`](/skel-src.bat): Extract skeleton `.skel`, atlas `.atlas` and texture `.png` from the Unity asset
```cmd
> skel-src.bat [<asset>] [<model>]?
```
2. [`skel-parse.bat`](/skel-parse.bat): Fix scaling errors of the `.skel`, then save it as `.s2j.json`
```cmd
> skel-parse.bat [<dirname>|<model>]
```
3. [`skel-frames.bat`](/skel-frames.bat): Render the skeleton via Spine, then export animation frame sequence as `.png`
```cmd
> skel-frames.bat [<dirname>|<model>]
```
4. [`skel-anim.bat`](/skel-anim.bat): Encode the exported frames into a single compressed `.webm` video
```cmd
> skel-anim.bat [<dirname>|<model>]
```

### Examples
For simplicity, the examples use assets that are already available in the repository as demo.

#### Singular Unity Asset
For most skeletons, the `.skel` file is named after the asset name itself.
```cmd
skel-src.bat admiral
skel-parse.bat admiral
skel-frames.bat admiral
skel-anim.bat admiral
```

#### Compound Unity Asset
In some cases, multiple skeletons may come bundled up inside a single asset. To deal with such assets, [`skel-src.bat`](/skel-src.bat) accepts an extra argument as the `skel` name.
```cmd
skel-src.bat visual_novel novel_illust_kaden
skel-parse.bat novel_illust_kaden
skel-frames.bat novel_illust_kaden
skel-anim.bat novel_illust_kaden
```

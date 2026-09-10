# companion-module-audiotechnica-digitalmixer

A Bitfocus Companion module for Audio-Technica digital mixers: ATDM-0604, ATDM-0604a, ATDM-1012 and
ATDM-1012DAN.

See [HELP.md](companion/HELP.md) for what the module does and how to configure it, and LICENSE for terms.

## Development

Written in TypeScript, following the
[Bitfocus TypeScript module template](https://github.com/bitfocus/companion-module-template-ts).

Requires Node 22.20 or newer, which `@companion-module/base` 2.x sets as its minimum.

```
yarn install     # install dependencies
yarn build       # compile src/ to dist/
yarn dev         # compile on change
yarn test        # run the test suite
yarn lint        # eslint and prettier
yarn package     # build and produce a distributable package
```

`companion/manifest.json` points Companion at `dist/main.js`, so the module must be built before it will
load.

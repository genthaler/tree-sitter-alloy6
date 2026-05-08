# tree-sitter-alloy6

This fork exists to support the [genthaler/zed-alloy](https://github.com/genthaler/zed-alloy) Zed extension.

The grammar name is `alloy6`, so the generated parser exports `tree_sitter_alloy6`.

## Dependencies and SDLC

This repo uses the checked-in Nix flake as the normal development environment. After cloning, run:

```sh
direnv allow
```

The flake provides Node.js, GCC, and the Tree-sitter CLI. `package.json` keeps npm-based workflows available for contributors who are already working in the repo.

Useful commands:

```sh
tree-sitter generate
npm test
npm run test:examples
tree-sitter parse test.als
```

`npm test` runs the checked-in Tree-sitter corpus tests. `npm run test:examples` clones or updates the AlloyTools repository under the ignored `vendor/` directory, then parses the `.als` models under `org.alloytools.alloy.extra/extra/models`. Those upstream examples are used only as local verification fixtures and are not vendored into this repo.

When changing the grammar:

- update `grammar.js`
- regenerate `src/parser.c`, `src/grammar.json`, and `src/node-types.json`
- add or update focused corpus tests under `test/corpus/`
- run the verification commands above
- confirm `tree_sitter_alloy6` remains the generated export name
- work on a branch and merge through a PR into `main`

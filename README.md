# tree-sitter-kof

[Tree-sitter](https://tree-sitter.github.io/tree-sitter/) grammar and highlight queries for the **Kof** programming language.

## Example

```kof
package demo.hello

import kof.io.*

record Point(int x, int y)

int add(int a, int b) {
    return a + b;
}

main(string[] args) {
    val p = new Point(1, 2);
    println(add(p.x, p.y));
}
```

## Queries

The `queries/` directory ships:

| File              | Purpose                          |
| ----------------- | -------------------------------- |
| `highlights.scm`  | Syntax highlighting              |
| `locals.scm`      | Scopes, definitions, references  |
| `folds.scm`       | Code folding                     |
| `indents.scm`     | Auto-indentation                 |
| `injections.scm`  | Embedded language injections     |

## Neovim

If you are looking for Kof support in Neovim, ensure tree-sitter first in your path(can be found at pkg managers or below)
[nvim-treesitter](https://github.com/nvim-treesitter/nvim-treesitter):

then build and copy whith

```sh
tree-sitter generate  
tree-sitter build -o ~/.local/share/nvim/site/parser/kof.so 
cp queries/* ~/.local/share/nvim/lazy/nvim-treesitter/runtime/queries/kof/
ln -s ~/.local/share/nvim/lazy/nvim-treesitter/runtime/queries/kof ~/.local/share/nvim/site/queries/kof
```

#### if you not sure about how to configure nvim
look at my nvim repository, you will find some kof files, just add it, run restart command or reopen it
[etieppo/nvim](https://github.com/etieppo/nvim)


#### you can also

```lua
vim.filetype.add({ extension = { kof = "kof", kf = "kof" } })

local parser_config = require("nvim-treesitter.parsers").get_parser_configs()
parser_config.kof = {
  install_info = {
    url = "https://github.com/etieppo/tree-sitter-kof",
    files = { "src/parser.c", "src/scanner.c" },
    branch = "main",
  },
  filetype = "kof",
}
```

## Development

Requirements: Node.js and the [tree-sitter CLI](https://github.com/tree-sitter/tree-sitter/tree/master/cli) (installed as a dev dependency).

```sh
npm install

npx tree-sitter generate          # regenerate src/ from grammar.js
npx tree-sitter parse file.kof    # print the syntax tree for a file
npx tree-sitter highlight file.kof
npx tree-sitter test              # run corpus tests in test/corpus/ (none yet)
npm start                         # build WASM and open the web playground
```

The grammar lives in `grammar.js`; the external scanner is in `src/scanner.c`.

## Bindings

Bindings are generated for C, Go, Java, Node.js, Python, Rust, Swift and Zig (see `bindings/`).

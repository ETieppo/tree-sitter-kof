; Neovim: later patterns take priority, so general captures come first.

(identifier) @variable

; Types

(type_identifier) @type

(primitive_type) @type.builtin

(void_type) @type.builtin

((type_identifier) @type.builtin
  (#any-of? @type.builtin
    "String" "Int" "Long" "Float" "Double" "Bool" "Boolean" "Byte" "Short"
    "Char" "Object" "List" "Map" "Set" "ArrayList" "HashMap" "HashSet"
    "Channel" "Handle"))

(class_declaration
  name: (identifier) @type)

(interface_declaration
  name: (identifier) @type)

(record_declaration
  name: (identifier) @type)

(enum_declaration
  name: (identifier) @type)

(entity_declaration
  name: (identifier) @type)

(type_parameter
  name: (type_identifier) @type)

(enum_constant) @constant

((field_access
  object: (identifier) @type)
  (#match? @type "^[A-Z]"))

; Functions

(field_access
  field: (identifier) @variable.member)

(function_declaration
  name: (identifier) @function)

(method_declaration
  name: (identifier) @function.method)

(main_declaration
  name: (identifier) @function)

(extern_declaration
  name: (identifier) @function)

(call_expression
  function: (identifier) @function.call)

; Constructor-style calls: User(...), Point(...)
((call_expression
  function: (identifier) @constructor)
  (#match? @constructor "^[A-Z]"))

(call_expression
  function: (field_access
    field: (identifier) @function.method.call))

((identifier) @function.builtin
  (#any-of? @function.builtin
    "println" "print" "listOf" "mapOf" "setOf" "channel" "awaitTimeout" "json"))

; Parameters

(parameter
  name: (identifier) @variable.parameter)

(lambda_parameter
  name: (identifier) @variable.parameter)

; Members

(field_declaration
  name: (identifier) @variable.member)

(entity_field
  name: (identifier) @variable.member)

(element_value_pair
  key: (identifier) @variable.parameter)

; Annotations

(annotation
  "@" @attribute
  name: (identifier) @attribute)

(annotation
  "@" @attribute
  name: (scoped_identifier
    (identifier) @attribute))

; Modules

(package_declaration
  name: (identifier) @module)

(package_declaration
  name: (scoped_identifier
    (identifier) @module))

(import_declaration
  path: (identifier) @module)

(import_declaration
  path: (scoped_identifier
    (identifier) @module))

(import_declaration
  path: (scoped_identifier
    (scoped_identifier
      (identifier) @module)))

; Special declarations (contextual identifiers)

(test_declaration
  keyword: (identifier) @keyword)

(application_declaration
  keyword: (identifier) @keyword)

(lifecycle_block
  name: (identifier) @keyword)

; Builtins

[
  (this)
  (super)
] @variable.builtin

; Literals

(string_literal) @string

(escape_sequence) @string.escape

(character_literal) @character

[
  (integer_literal)
  (float_literal)
] @number

(boolean_literal) @boolean

(null_literal) @constant.builtin

; Comments

[
  (line_comment)
  (block_comment)
] @comment @spell

; Keywords

[
  "class"
  "interface"
  "record"
  "enum"
  "entity"
  "extern"
  (sealed)
] @keyword.type

[
  "public"
  "private"
  "protected"
  "static"
  "final"
  "abstract"
  "transient"
  "volatile"
  "synchronized"
  "native"
  "default"
  "override"
  "generated"
  "unique"
] @keyword.modifier

[
  "extends"
  "implements"
  "var"
  "val"
  "constructor"
] @keyword

[
  "package"
  "import"
] @keyword.import

[
  "if"
  "else"
  "switch"
  "case"
] @keyword.conditional

[
  "for"
  "while"
  "do"
  "break"
  "continue"
  "in"
] @keyword.repeat

"return" @keyword.return

[
  "throw"
  "try"
  "catch"
  "finally"
  "assert"
] @keyword.exception

[
  "new"
  "instanceof"
  "as"
] @keyword.operator

[
  "spawn"
  "await"
] @keyword.coroutine

; Operators and punctuation

[
  ">>>="
  ">>>"
  "<<="
  ">>="
  "=="
  "!="
  "<="
  ">="
  "&&"
  "||"
  "<<"
  ">>"
  "++"
  "--"
  "+="
  "-="
  "*="
  "/="
  "%="
  "&="
  "|="
  "^="
  "+"
  "-"
  "*"
  "/"
  "%"
  "<"
  ">"
  "!"
  "&"
  "|"
  "^"
  "="
  "->"
] @operator

(nullable_type
  "?" @operator)

[
  "("
  ")"
  "{"
  "}"
  "["
  "]"
] @punctuation.bracket

[
  ";"
  ","
  "."
  ":"
] @punctuation.delimiter

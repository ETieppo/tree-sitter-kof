/**
 * @file Kof tree-sitter parser
 * @author Emerson A. Tieppo Jr. <tieppo.emerson.a.jr@gmail.com>
 * @license MIT
 *
 * docs/language-reference/grammar.md and lexical-structure.md)
 * at parser reference (kof-compiler/.../parser/*.java).
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

const PRECEDENCE = {
  lambda: -1,
  assign: 0,
  or: 1,
  and: 2,
  bit_or: 3,
  bit_and: 4,
  rel: 5,
  shift: 6,
  add: 7,
  mult: 8,
  unary: 9,
  postfix: 10,
  call: 11,
};

const PRIMITIVE_TYPES = [
  'bool',
  'byte',
  'short',
  'int',
  'long',
  'float',
  'double',
  'char',
  'string',
];

const MODIFIERS = [
  'public',
  'private',
  'protected',
  'static',
  'final',
  'abstract',
  'transient',
  'volatile',
  'synchronized',
  'native',
  'default',
  'override',
];

const RESERVED = [
  'class',
  'interface',
  'record',
  'enum',
  'entity',
  'generated',
  'unique',
  'extends',
  'implements',
  'package',
  'import',
  'void',
  'new',
  'this',
  'super',
  'return',
  'throw',
  'if',
  'else',
  'for',
  'while',
  'do',
  'switch',
  'case',
  'break',
  'continue',
  'try',
  'catch',
  'finally',
  'spawn',
  'await',
  'assert',
  'instanceof',
  'var',
  'val',
  'as',
  'true',
  'false',
  'null',
  ...PRIMITIVE_TYPES,
  ...MODIFIERS,
];

const ASSIGNMENT_OPERATORS = [
  '=',
  '+=',
  '-=',
  '*=',
  '/=',
  '%=',
  '&=',
  '|=',
  '^=',
  '<<=',
  '>>=',
  '>>>=',
];

/**
 * @param {RuleOrLiteral} rule
 * @returns {ChoiceRule}
 */
function commaSep(rule) {
  return optional(commaSep1(rule));
}

/**
 * @param {RuleOrLiteral} rule
 * @returns {SeqRule}
 */
function commaSep1(rule) {
  return seq(rule, repeat(seq(',', rule)));
}

export default grammar({
  name: 'kof',

  word: ($) => $.identifier,
  extras: ($) => [/\s/, $.line_comment, $.block_comment],
  externals: ($) => [$._return_value_start, $._error_sentinel],

  reserved: {
    global: (_) => RESERVED,
  },

  conflicts: ($) => [
    [$.type_parameter, $._non_function_type],
    [$._primary_expression, $.call_expression],
    [$._simple_primary, $.scoped_type_identifier],
    [$._simple_primary, $.generic_type],
    [$._simple_primary, $._non_function_type],
    [$._simple_primary, $.lambda_parameter],
    [$._non_function_type, $.generic_type],
    [$._simple_primary, $.record_pattern],
  ],

  rules: {
    source_file: ($) => repeat($._top_level_item),

    _top_level_item: ($) =>
      choice(
        $.package_declaration,
        $.import_declaration,
        $.function_declaration,
        $.main_declaration,
        $.class_declaration,
        $.interface_declaration,
        $.record_declaration,
        $.enum_declaration,
        $.entity_declaration,
        $.extern_declaration,
        $.test_declaration,
        $.application_declaration,
        ';',
      ),

    package_declaration: ($) =>
      prec.right(seq('package', field('name', $._name), optional(';'))),

    import_declaration: ($) =>
      prec.right(
        seq(
          'import',
          choice(
            $.wildcard,
            seq(field('path', $._name), optional(seq('.', $.wildcard))),
          ),
          optional(';'),
        ),
      ),

    wildcard: (_) => '*',

    _name: ($) => choice($.identifier, $.scoped_identifier),

    scoped_identifier: ($) =>
      seq(field('scope', $._name), '.', field('name', $.identifier)),

    modifiers: ($) => repeat1(choice($.annotation, ...MODIFIERS)),

    // Contextual modifier (X5.1): only before class/record/interface.
    sealed: (_) => 'sealed',

    annotation: ($) =>
      prec.right(
        seq(
          '@',
          field('name', $._name),
          optional(field('arguments', $.annotation_argument_list)),
        ),
      ),

    annotation_argument_list: ($) =>
      seq('(', commaSep(choice($.element_value_pair, $._element_value)), ')'),

    element_value_pair: ($) =>
      prec(
        1,
        seq(field('key', $.identifier), '=', field('value', $._element_value)),
      ),

    _element_value: ($) =>
      choice(prec(1, $._expression), $.element_value_array),

    element_value_array: ($) =>
      prec(2, seq('{', commaSep($._element_value), optional(','), '}')),

    class_declaration: ($) =>
      prec.right(
        seq(
          optional($.modifiers),
          optional($.sealed),
          'class',
          field('name', $.identifier),
          optional(field('type_parameters', $.type_parameters)),
          optional(field('parameters', $.formal_parameters)),
          optional(field('superclass', $.superclass)),
          optional(field('interfaces', $.super_interfaces)),
          optional(field('body', $.class_body)),
        ),
      ),

    interface_declaration: ($) =>
      prec.right(
        seq(
          optional($.modifiers),
          optional($.sealed),
          'interface',
          field('name', $.identifier),
          optional(field('type_parameters', $.type_parameters)),
          optional(field('interfaces', $.extends_interfaces)),
          optional(field('body', $.class_body)),
        ),
      ),

    record_declaration: ($) =>
      prec.right(
        seq(
          optional($.modifiers),
          optional($.sealed),
          'record',
          field('name', $.identifier),
          optional(field('type_parameters', $.type_parameters)),
          optional(field('superclass', $.superclass)),
          field('parameters', $.formal_parameters),
          optional(field('interfaces', $.super_interfaces)),
          optional(field('body', $.class_body)),
        ),
      ),

    enum_declaration: ($) =>
      seq(
        optional($.modifiers),
        'enum',
        field('name', $.identifier),
        field('body', $.enum_body),
      ),

    enum_body: ($) =>
      seq(
        '{',
        repeat(seq(alias($.identifier, $.enum_constant), optional(','))),
        '}',
      ),

    entity_declaration: ($) =>
      seq(
        optional($.modifiers),
        'entity',
        field('name', $.identifier),
        field('body', $.entity_body),
      ),
    entity_body: ($) => seq('{', repeat($.entity_field), '}'),
    entity_field: ($) =>
      prec.right(
        seq(
          field('name', $.identifier),
          ':',
          field('type', $._type),
          repeat(choice('generated', 'unique')),
          optional(choice(';', ',')),
        ),
      ),

    superclass: ($) => seq('extends', $._type),
    super_interfaces: ($) => seq('implements', commaSep1($._type)),
    extends_interfaces: ($) => seq('extends', commaSep1($._type)),
    class_body: ($) => seq('{', repeat($._class_member), '}'),
    _class_member: ($) =>
      choice(
        $.field_declaration,
        $.method_declaration,
        $.constructor_declaration,
        $.class_declaration,
        $.interface_declaration,
        $.record_declaration,
        $.enum_declaration,
        $.entity_declaration,
        ';',
      ),
    field_declaration: ($) =>
      prec.right(
        seq(
          optional($.modifiers),
          field('type', $._type),
          field('name', $.identifier),
          optional(seq('=', field('value', $._expression))),
          optional(';'),
        ),
      ),
    method_declaration: ($) =>
      prec.right(
        seq(
          optional($.modifiers),
          optional(field('type', $._type)),
          field('name', $.identifier),
          optional(field('type_parameters', $.type_parameters)),
          field('parameters', $.formal_parameters),
          optional(seq(':', field('return_type', $._type))),
          optional($.throws),
          optional($._function_body),
        ),
      ),
    constructor_declaration: ($) =>
      prec.right(
        seq(
          optional($.modifiers),
          'constructor',
          field('parameters', $.formal_parameters),
          optional($.throws),
          optional(field('body', $.block)),
        ),
      ),

    main_declaration: ($) =>
      prec.right(
        2,
        seq(
          optional($.modifiers),
          field('name', alias('main', $.identifier)),
          field('parameters', $.formal_parameters),
          optional(seq(':', field('return_type', $._type))),
          optional($._function_body),
        ),
      ),
    function_declaration: ($) =>
      prec.right(
        seq(
          optional($.modifiers),
          optional(field('type', $._type)),
          field('name', $.identifier),
          optional(field('type_parameters', $.type_parameters)),
          field('parameters', $.formal_parameters),
          optional(seq(':', field('return_type', $._type))),
          optional($.throws),
          optional($._function_body),
        ),
      ),
    _local_function_declaration: ($) =>
      prec.dynamic(
        1,
        prec(
          1,
          seq(
            field('type', $._non_function_type),
            field('name', $.identifier),
            optional(field('type_parameters', $.type_parameters)),
            field('parameters', $.formal_parameters),
            optional(seq(':', field('return_type', $._type))),
            field('body', $.block),
          ),
        ),
      ),
    _function_body: ($) =>
      choice(
        field('body', $.block),
        prec.right(seq('=', field('body', $._expression), optional(';'))),
        ';',
      ),

    extern_declaration: ($) =>
      prec.right(
        seq(
          'extern',
          optional(field('abi', $.string_literal)),
          field('name', $.identifier),
          optional(field('type_parameters', $.type_parameters)),
          field('parameters', $.formal_parameters),
          optional(seq(':', field('return_type', $._type))),
          optional(';'),
        ),
      ),

    formal_parameters: ($) => seq('(', commaSep($.parameter), ')'),
    parameter: ($) =>
      seq(
        optional($.modifiers),
        choice(
          seq(field('type', $._type), field('name', $.identifier)),
          seq(field('name', $.identifier), ':', field('type', $._type)),
        ),
        optional(seq('=', field('default', $._expression))),
      ),

    type_parameters: ($) => seq('<', commaSep1($.type_parameter), '>'),
    type_parameter: ($) =>
      seq(
        field('name', alias($.identifier, $.type_identifier)),
        optional(seq(':', field('bound', $._type))),
      ),

    test_declaration: ($) =>
      seq(
        field('keyword', $.identifier),
        field('name', $.string_literal),
        field('body', $.block),
      ),

    application_declaration: ($) =>
      seq(field('keyword', $.identifier), field('body', $.application_body)),
    application_body: ($) => seq('{', repeat($.lifecycle_block), '}'),

    lifecycle_block: ($) =>
      seq(field('name', $.identifier), field('body', $.block)),
    block: ($) => prec(1, seq('{', repeat($._statement), '}')),

    _statement: ($) =>
      choice(
        $.block,
        $.variable_declaration,
        alias($._local_function_declaration, $.function_declaration),
        $.expression_statement,
        $.if_statement,
        $.while_statement,
        $.do_statement,
        $.for_statement,
        $.for_in_statement,
        $.return_statement,
        $.throw_statement,
        $.assert_statement,
        $.try_statement,
        $.switch_statement,
        $.break_statement,
        $.continue_statement,
        ';',
      ),

    variable_declaration: ($) =>
      prec.right(seq($._variable_declarator, optional(';'))),

    _variable_declarator: ($) =>
      seq(
        choice(
          seq(
            field('kind', choice('var', 'val')),
            field('name', $.identifier),
            optional(seq(':', field('type', $._type))),
          ),
          seq(field('type', $._non_function_type), field('name', $.identifier)),
        ),
        optional(seq('=', field('value', $._expression))),
      ),

    expression_statement: ($) => prec.right(seq($._expression, optional(';'))),

    if_statement: ($) =>
      prec.right(
        seq(
          'if',
          field('condition', $.parenthesized_expression),
          field('consequence', $._statement),
          optional(seq('else', field('alternative', $._statement))),
        ),
      ),

    while_statement: ($) =>
      seq(
        'while',
        field('condition', $.parenthesized_expression),
        field('body', $._statement),
      ),

    do_statement: ($) =>
      prec.right(
        seq(
          'do',
          field('body', $._statement),
          'while',
          field('condition', $.parenthesized_expression),
          optional(';'),
        ),
      ),

    for_statement: ($) =>
      seq(
        'for',
        '(',
        optional(
          field(
            'init',
            choice(
              alias($._variable_declarator, $.variable_declaration),
              $._expression,
            ),
          ),
        ),
        ';',
        optional(field('condition', $._expression)),
        ';',
        optional(field('update', $._expression)),
        ')',
        field('body', $._statement),
      ),

    for_in_statement: ($) =>
      seq(
        'for',
        '(',
        field('kind', choice('var', 'val')),
        field('name', $.identifier),
        optional(seq(':', field('type', $._type))),
        'in',
        field('value', $._expression),
        ')',
        field('body', $._statement),
      ),

    break_statement: (_) => prec.right(seq('break', optional(';'))),
    continue_statement: (_) => prec.right(seq('continue', optional(';'))),

    return_statement: ($) =>
      prec.right(
        seq(
          'return',
          optional(seq($._return_value_start, $._expression)),
          optional(';'),
        ),
      ),

    throws: ($) => seq('throw', commaSep1($._type)),
    throw_statement: ($) =>
      prec.right(seq('throw', $._expression, optional(';'))),

    assert_statement: ($) =>
      prec.right(
        seq(
          'assert',
          '(',
          field('condition', $._expression),
          optional(seq(',', field('message', $._expression))),
          ')',
          optional(';'),
        ),
      ),

    try_statement: ($) =>
      seq(
        'try',
        field('body', $.block),
        repeat($.catch_clause),
        optional($.finally_clause),
      ),
    catch_clause: ($) =>
      seq(
        'catch',
        '(',
        field('type', $._type),
        field('name', $.identifier),
        ')',
        field('body', $.block),
      ),
    finally_clause: ($) => seq('finally', field('body', $.block)),

    switch_statement: ($) =>
      seq(
        'switch',
        field('value', $.parenthesized_expression),
        field('body', $.switch_block),
      ),
    switch_block: ($) =>
      prec(1, seq('{', repeat(choice($.switch_case, $.switch_default)), '}')),
    switch_case: ($) =>
      seq(
        'case',
        field('label', $._case_label),
        optional(field('guard', $.guard)),
        ':',
        repeat($._statement),
      ),
    switch_default: ($) => seq('default', ':', repeat($._statement)),
    _case_label: ($) => choice($.type_pattern, $.record_pattern, $._expression),

    type_pattern: ($) =>
      seq(
        field('type', alias($.identifier, $.type_identifier)),
        field('name', $.identifier),
      ),
    record_pattern: ($) =>
      prec.dynamic(
        1,
        seq(
          field('type', alias($.identifier, $.type_identifier)),
          '(',
          commaSep($.pattern_binding),
          ')',
        ),
      ),
    pattern_binding: ($) =>
      seq(
        optional(field('kind', choice('var', 'val'))),
        field('name', $.identifier),
      ),

    guard: ($) => seq('if', $._expression),

    _expression: ($) =>
      choice(
        $.assignment_expression,
        $.binary_expression,
        $.instanceof_expression,
        $.cast_expression,
        $.unary_expression,
        $.update_expression,
        $.spawn_expression,
        $.await_expression,
        $.lambda_expression,
        $.if_expression,
        $.switch_expression,
        $._primary_expression,
      ),
    _primary_expression: ($) => choice($._literal, $._simple_primary),
    _simple_primary: ($) =>
      choice(
        $.identifier,
        $.this,
        $.super,
        $.parenthesized_expression,
        $.field_access,
        $.call_expression,
        $.array_access,
        $.object_creation_expression,
        $.array_creation_expression,
        $.class_literal,
      ),

    assignment_expression: ($) =>
      prec.right(
        PRECEDENCE.assign,
        seq(
          field('left', $._expression),
          field('operator', choice(...ASSIGNMENT_OPERATORS)),
          field('right', $._expression),
        ),
      ),

    binary_expression: ($) =>
      choice(
        ...[
          ['||', PRECEDENCE.or],
          ['&&', PRECEDENCE.and],
          ['|', PRECEDENCE.bit_or],
          ['^', PRECEDENCE.bit_or],
          ['&', PRECEDENCE.bit_and],
          ['==', PRECEDENCE.rel],
          ['!=', PRECEDENCE.rel],
          ['<', PRECEDENCE.rel],
          ['<=', PRECEDENCE.rel],
          ['>', PRECEDENCE.rel],
          ['>=', PRECEDENCE.rel],
          ['<<', PRECEDENCE.shift],
          ['>>', PRECEDENCE.shift],
          ['>>>', PRECEDENCE.shift],
          ['+', PRECEDENCE.add],
          ['-', PRECEDENCE.add],
          ['*', PRECEDENCE.mult],
          ['/', PRECEDENCE.mult],
          ['%', PRECEDENCE.mult],
        ].map(([operator, precedence]) =>
          prec.left(
            /** @type {number} */ (precedence),
            seq(
              field('left', $._expression),
              // @ts-ignore
              field('operator', operator),
              field('right', $._expression),
            ),
          ),
        ),
      ),

    instanceof_expression: ($) =>
      prec.left(
        PRECEDENCE.rel,
        seq(
          field('left', $._expression),
          'instanceof',
          field('right', $._type),
        ),
      ),

    cast_expression: ($) =>
      prec.left(
        PRECEDENCE.rel,
        seq(field('value', $._expression), 'as', field('type', $._type)),
      ),

    unary_expression: ($) =>
      prec(
        PRECEDENCE.unary,
        seq(
          field('operator', choice('!', '-')),
          field('operand', $._expression),
        ),
      ),

    update_expression: ($) =>
      choice(
        prec(
          PRECEDENCE.unary,
          seq(
            field('operator', choice('++', '--')),
            field('argument', $._expression),
          ),
        ),
        prec(
          PRECEDENCE.postfix,
          seq(
            field('argument', $._expression),
            field('operator', choice('++', '--')),
          ),
        ),
      ),

    spawn_expression: ($) =>
      prec(PRECEDENCE.unary, seq('spawn', $._expression)),

    await_expression: ($) =>
      prec(PRECEDENCE.unary, seq('await', $._expression)),

    lambda_expression: ($) =>
      choice(
        prec.right(
          PRECEDENCE.lambda,
          seq(
            field('parameters', $.lambda_parameters),
            '->',
            field('body', choice($.block, $._expression)),
          ),
        ),
        $._brace_lambda,
      ),

    _brace_lambda: ($) =>
      seq(
        '{',
        optional(
          seq(
            field(
              'parameters',
              alias($._brace_lambda_parameters, $.lambda_parameters),
            ),
            '->',
          ),
        ),
        repeat($._statement),
        '}',
      ),

    _brace_lambda_parameters: ($) => commaSep1($.lambda_parameter),
    lambda_parameters: ($) => seq('(', commaSep($.lambda_parameter), ')'),

    lambda_parameter: ($) =>
      seq(
        field('name', $.identifier),
        optional(seq(':', field('type', $._type))),
      ),

    if_expression: ($) =>
      prec.right(
        PRECEDENCE.lambda,
        seq(
          'if',
          field('condition', $.parenthesized_expression),
          field('consequence', $._expression),
          'else',
          field('alternative', $._expression),
        ),
      ),

    switch_expression: ($) =>
      seq(
        'switch',
        field('value', $.parenthesized_expression),
        field('body', alias($._switch_expression_body, $.switch_block)),
      ),

    _switch_expression_body: ($) =>
      seq('{', repeat(choice($.switch_arm, $.switch_default_arm)), '}'),

    switch_arm: ($) =>
      prec.right(
        seq(
          'case',
          field('label', $._case_label),
          optional(field('guard', $.guard)),
          '->',
          field('value', $._expression),
          optional(choice(';', ',')),
        ),
      ),

    switch_default_arm: ($) =>
      prec.right(
        seq(
          'default',
          '->',
          field('value', $._expression),
          optional(choice(';', ',')),
        ),
      ),

    parenthesized_expression: ($) => seq('(', $._expression, ')'),

    field_access: ($) =>
      prec(
        PRECEDENCE.call,
        seq(
          field('object', $._primary_expression),
          '.',
          field(
            'field',
            choice(
              $.identifier,
              alias(
                choice(...PRIMITIVE_TYPES, 'record', 'await', 'spawn'),
                $.identifier,
              ),
            ),
          ),
        ),
      ),


    class_literal: ($) =>
      prec(
        PRECEDENCE.call,
        seq(field('type', $._primary_expression), '.', 'class'),
      ),

    call_expression: ($) =>
      choice(
        prec.right(
          PRECEDENCE.call,
          seq(
            field('function', $._simple_primary),
            field('arguments', $.argument_list),
            optional(
              field('lambda', alias($._brace_lambda, $.lambda_expression)),
            ),
          ),
        ),
        prec.dynamic(
          1,
          prec.right(
            seq(
              field('function', $._simple_primary),
              field('type_arguments', $.type_arguments),
              field('arguments', $.argument_list),
              optional(
                field('lambda', alias($._brace_lambda, $.lambda_expression)),
              ),
            ),
          ),
        ),
        prec(
          PRECEDENCE.call,
          seq(
            field('function', choice($.identifier, $.field_access)),
            field('lambda', alias($._brace_lambda, $.lambda_expression)),
          ),
        ),
      ),

    argument_list: ($) => seq('(', commaSep($._expression), ')'),

    array_access: ($) =>
      prec(
        PRECEDENCE.call,
        seq(
          field('array', $._primary_expression),
          '[',
          field('index', $._expression),
          ']',
        ),
      ),

    object_creation_expression: ($) =>
      prec(
        PRECEDENCE.call,
        seq(
          'new',
          field('type', $._non_function_type),
          field('arguments', $.argument_list),
        ),
      ),

    array_creation_expression: ($) =>
      prec(
        PRECEDENCE.call,
        seq(
          'new',
          field('type', $._non_function_type),
          '[',
          field('size', $._expression),
          ']',
        ),
      ),

    _type: ($) => choice($._non_function_type, $.function_type),

    _non_function_type: ($) =>
      choice(
        $.void_type,
        $.primitive_type,
        alias($.identifier, $.type_identifier),
        $.scoped_type_identifier,
        $.generic_type,
        $.array_type,
        $.nullable_type,
      ),

    void_type: (_) => 'void',
    primitive_type: (_) => choice(...PRIMITIVE_TYPES),

    scoped_type_identifier: ($) =>
      seq(
        field(
          'scope',
          choice(
            alias($.identifier, $.type_identifier),
            $.scoped_type_identifier,
          ),
        ),
        '.',
        field('name', alias($.identifier, $.type_identifier)),
      ),

    generic_type: ($) =>
      prec.dynamic(
        1,
        seq(
          choice(
            alias($.identifier, $.type_identifier),
            $.scoped_type_identifier,
          ),
          $.type_arguments,
        ),
      ),

    type_arguments: ($) => seq('<', commaSep($._type), '>'),
    array_type: ($) => seq(field('element', $._non_function_type), '[', ']'),
    nullable_type: ($) => seq(field('type', $._non_function_type), '?'),

    function_type: ($) =>
      prec.right(
        seq('(', commaSep($._type), ')', '->', field('return_type', $._type)),
      ),

    _literal: ($) =>
      choice(
        $.integer_literal,
        $.float_literal,
        $.string_literal,
        $.character_literal,
        $.boolean_literal,
        $.null_literal,
      ),

    integer_literal: (_) =>
      token(choice(/0[xX][0-9a-fA-F]+[lL]?/, /[0-9]+[lL]?/)),

    float_literal: (_) =>
      token(
        choice(
          /[0-9]+\.[0-9]+([eE][+-]?[0-9]+)?[fFdD]?/,
          /[0-9]+[eE][+-]?[0-9]+[fFdD]?/,
        ),
      ),

    string_literal: ($) =>
      seq(
        '"',
        repeat(choice($.string_fragment, $.escape_sequence)),
        token.immediate('"'),
      ),

    string_fragment: (_) => token.immediate(prec(1, /[^"\\]+/)),

    character_literal: ($) =>
      seq(
        "'",
        choice(
          alias(token.immediate(/[^'\\\n]/), $.character_content),
          $.escape_sequence,
        ),
        token.immediate("'"),
      ),

    escape_sequence: (_) =>
      token.immediate(seq('\\', choice(/u[0-9a-fA-F]{4}/, /[^u]/))),

    boolean_literal: (_) => choice('true', 'false'),
    null_literal: (_) => 'null',
    this: (_) => 'this',
    super: (_) => 'super',
    // @ts-ignore
    identifier: (_) => /[\p{L}_$][\p{L}\p{Nd}_$]*/,
    line_comment: (_) => token(seq('//', /[^\n]*/)),
    block_comment: (_) => token(seq('/*', /[^*]*\*+([^/*][^*]*\*+)*/, '/')),
  },
});

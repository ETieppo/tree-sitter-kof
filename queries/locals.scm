; Scopes

[
  (source_file)
  (class_declaration)
  (interface_declaration)
  (record_declaration)
  (method_declaration)
  (constructor_declaration)
  (function_declaration)
  (main_declaration)
  (lambda_expression)
  (block)
  (for_statement)
  (for_in_statement)
  (catch_clause)
  (switch_case)
  (switch_arm)
] @local.scope

; Definitions

(variable_declaration
  name: (identifier) @local.definition.var)

(for_in_statement
  name: (identifier) @local.definition.var)

(catch_clause
  name: (identifier) @local.definition.var)

(type_pattern
  name: (identifier) @local.definition.var)

(pattern_binding
  name: (identifier) @local.definition.var)

(parameter
  name: (identifier) @local.definition.parameter)

(lambda_parameter
  name: (identifier) @local.definition.parameter)

(field_declaration
  name: (identifier) @local.definition.field)

(entity_field
  name: (identifier) @local.definition.field)

(function_declaration
  name: (identifier) @local.definition.function)

(main_declaration
  name: (identifier) @local.definition.function)

(extern_declaration
  name: (identifier) @local.definition.function)

(method_declaration
  name: (identifier) @local.definition.method)

(class_declaration
  name: (identifier) @local.definition.type)

(interface_declaration
  name: (identifier) @local.definition.type)

(record_declaration
  name: (identifier) @local.definition.type)

(enum_declaration
  name: (identifier) @local.definition.type)

(entity_declaration
  name: (identifier) @local.definition.type)

(type_parameter
  name: (type_identifier) @local.definition.type)

(enum_constant) @local.definition.constant

; References

(identifier) @local.reference

(type_identifier) @local.reference

#include "tree_sitter/parser.h"

enum TokenType {
  RETURN_VALUE_START,
  ERROR_SENTINEL,
};

void *tree_sitter_kof_external_scanner_create(void) { return NULL; }

void tree_sitter_kof_external_scanner_destroy(void *payload) {}

unsigned tree_sitter_kof_external_scanner_serialize(void *payload,
                                                    char *buffer) {
  return 0;
}

void tree_sitter_kof_external_scanner_deserialize(void *payload,
                                                  const char *buffer,
                                                  unsigned length) {}

bool tree_sitter_kof_external_scanner_scan(void *payload, TSLexer *lexer,
                                           const bool *valid_symbols) {
  if (valid_symbols[ERROR_SENTINEL])
    return false;
  if (!valid_symbols[RETURN_VALUE_START])
    return false;

  while (lexer->lookahead == ' ' || lexer->lookahead == '\t') {
    lexer->advance(lexer, true);
  }

  if (lexer->eof(lexer) || lexer->lookahead == '\n' ||
      lexer->lookahead == '\r' || lexer->lookahead == ';' ||
      lexer->lookahead == '}') {
    return false;
  }

  lexer->mark_end(lexer);

  if (lexer->lookahead == '/') {
    lexer->advance(lexer, false);
    if (lexer->lookahead == '/' || lexer->lookahead == '*')
      return false;
  }

  lexer->result_symbol = RETURN_VALUE_START;
  return true;
}

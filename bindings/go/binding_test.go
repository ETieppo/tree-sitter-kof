package tree_sitter_kof_test

import (
	"testing"

	tree_sitter "github.com/tree-sitter/go-tree-sitter"
	tree_sitter_kof "github.com/etieppo/tree-sitter-kof/bindings/go"
)

func TestCanLoadGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_kof.Language())
	if language == nil {
		t.Errorf("Error loading Kof grammar")
	}
}

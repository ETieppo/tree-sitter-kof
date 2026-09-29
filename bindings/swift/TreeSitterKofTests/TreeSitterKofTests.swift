import XCTest
import SwiftTreeSitter
import TreeSitterKof

final class TreeSitterKofTests: XCTestCase {
    func testCanLoadGrammar() throws {
        let parser = Parser()
        let language = Language(language: tree_sitter_kof())
        XCTAssertNoThrow(try parser.setLanguage(language),
                         "Error loading Kof grammar")
    }
}

import io.github.treesitter.jtreesitter.Language;
import io.github.treesitter.jtreesitter.kof.TreeSitterKof;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;

public class TreeSitterKofTest {
    @Test
    public void testCanLoadLanguage() {
        assertDoesNotThrow(() -> new Language(TreeSitterKof.language()));
    }
}

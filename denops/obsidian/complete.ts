import {
  assertEquals,
  CompletionItem as LspCompletionItem,
  TextEdit,
} from "../deps.ts";

export type CompletionItem = LspCompletionItem & {
  textEdit: NonNullable<TextEdit>;
};

export function findNoteCandidate(input: string): string | undefined {
  const nearestBracketsIdx = input.lastIndexOf("[[");
  if (nearestBracketsIdx < 0) {
    return undefined;
  }
  return input.substring(nearestBracketsIdx + 2);
}

/**
 * create completion item (lsp).
 *
 * @param text - the value to be entered
 * @param sortText - the value to be used for comparison
 * @param lineNumber - line number (0-indexed)
 * @param completePos - complete position
 * @returns Lsp completion item
 */
export function makeLspCompleteItem(
  text: string,
  sortText: string,
  lineNumber: number,
  completePos: number,
): CompletionItem {
  return {
    label: text,
    sortText,
    textEdit: {
      newText: text,
      range: {
        start: {
          line: lineNumber,
          character: completePos - 2,
        },
        end: {
          line: lineNumber,
          character: completePos + text.length,
        },
      },
    },
  };
}

Deno.test("findNoteCandidate", () => {
  assertEquals(findNoteCandidate(""), undefined);
  assertEquals(findNoteCandidate("none"), undefined);
  assertEquals(findNoteCandidate("[["), "");
  assertEquals(findNoteCandidate("[[]]"), "]]");
  assertEquals(findNoteCandidate("[[note"), "note");
  assertEquals(findNoteCandidate("# [[note"), "note");
  assertEquals(findNoteCandidate("[[note1]][[note2"), "note2");
});

Deno.test("makeLspCompleteItem", () => {
  assertEquals(
    makeLspCompleteItem(
      "[[id|foo]]",
      "[[foo]]",
      10,
      2,
    ),
    {
      label: "[[id|foo]]",
      sortText: "[[foo]]",
      textEdit: {
        newText: "[[id|foo]]",
        range: {
          start: {
            line: 10,
            character: 0,
          },
          end: {
            line: 10,
            character: 12,
          },
        },
      },
    },
  );
});

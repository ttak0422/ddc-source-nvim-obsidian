import {
  BaseSource,
  DdcGatherItems,
  Item,
} from "https://deno.land/x/ddc_vim@v3.2.0/types.ts";
import {
  GatherArguments,
} from "https://deno.land/x/ddc_vim@v3.2.0/base/source.ts";
import {
  CompletionItem as LspCompletionItem,
  TextEdit,
} from "https://deno.land/x/vscode_languageserver_types@v0.1.0/mod.ts";

type CompletionItem = LspCompletionItem & { textEdit: NonNullable<TextEdit> };
type Params = {
  dir: string;
};
type Note = {
  id?: string;
  option?: string;
};

export class Source extends BaseSource<Params> {
  private counter = 0;

  override async gather(
    { denops, sourceParams, completePos, context, onCallback }: GatherArguments<
      Params
    >,
  ): Promise<DdcGatherItems> {
    const searchWord = this.findSearchWord(context.input);
    if (searchWord != null && searchWord.length == 0) {
      return [];
    }

    this.counter = (this.counter + 1) % 100;
    const id = "source/" + this.name + "/" + this.counter;

    const [payload] = await Promise.all([
      onCallback(id) as Promise<{
        items?: Note[];
      }>,
      denops.call(
        "luaeval",
        "require('ddc_nvim_obsidian').request_items(_A.arguments, _A.id)",
        {
          arguments: {
            opts: {
              dir: sourceParams.dir,
            },
            search: searchWord,
          },
          id,
        },
      ),
    ]);

    if (payload?.items?.length == null) {
      return [];
    }

    const items: Item[] = payload.items
      .filter((note) => note.id && note.option)
      .map((note) =>
        this.makeCompletionItem(
          note,
          context.lineNr - 1,
          completePos,
        )
      );

    return {
      items,
      isIncomplete: false,
    };
  }

  override params(): Params {
    return {
      dir: "~/vault",
    };
  }

  private findSearchWord(input: string): string | null {
    const nearestBracketsIdx = input.lastIndexOf("[[");
    if (nearestBracketsIdx < 0) {
      return null;
    }
    return input.substring(nearestBracketsIdx + 2);
  }

  /**
   * create ddc item.
   *
   * @param note - note
   * @param lineNumber - line number (0-indexed)
   * @param completePos - complete position
   */
  private makeCompletionItem(
    note: Note,
    lineNumber: number,
    completePos: number,
  ): Item {
    const visual = "[[" + note.option + "]]";
    const content = note.id + "|" + note.option;
    const text = "[[" + content + "]]";
    const cmpItem: CompletionItem = {
      label: text,
      sortText: visual,
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

    return {
      word: text,
      abbr: content,
      user_data: {
        lspitem: JSON.stringify(cmpItem),
      },
    };
  }
}

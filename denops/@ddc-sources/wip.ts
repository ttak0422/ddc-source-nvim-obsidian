import {
  BaseSource,
  DdcGatherItems,
  Item,
} from "../obsidian/deps/ddc/types.ts";
import { GatherArguments } from "../obsidian/deps/ddc/sources.ts";
import { CompletionItem, findNoteCandidate } from "../obsidian/complete.ts";

type Params = {
  dir: string;
};
type NewNote = {
  id?: string;
};

export class Source extends BaseSource<Params> {
  private counter = 0;

  override async gather(
    { denops, sourceParams, completePos, context, onCallback }: GatherArguments<
      Params
    >,
  ): Promise<DdcGatherItems> {
    const candicate = findNoteCandidate(context.input);
    if (candicate == null || candicate.length == 0) {
      return [];
    }

    this.counter = (this.counter + 1) % 100;
    const id = "source/" + this.name + "/" + this.counter;

    const [payload] = await Promise.all([
      onCallback(id) as Promise<{
        item?: NewNote[];
      }>,
      denops.call(
        "luaeval",
        "require('ddc_nvim_obsidian').request_items(_A.arguments, _A.id)",
        {
          arguments: {
            opts: {
              dir: sourceParams.dir,
            },
            note: candicate,
          },
          id,
        },
      ),
    ]);

    if (payload?.item == null) {
      return [];
    }

    const item: Item[] = payload.items
      .filter((note) => note.id && note.option)
      .map((note) =>
        this.makeCompletionItem(
          note,
          context.lineNr - 1,
          completePos,
        )
      );
    const item = this.makeCompletionItem

    return {
      items: [item],
      isIncomplete: false,
    };
  }

  override params(): Params {
    return {
      dir: "~/vault",
    };
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


import {
  BaseSource,
  DdcGatherItems,
  Item,
} from "../obsidian/deps/ddc/types.ts";
import { GatherArguments } from "../obsidian/deps/ddc/sources.ts";
import {
  findNoteCandidate,
  makeLspCompleteItem,
} from "../obsidian/complete.ts";

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
    const search = findNoteCandidate(context.input);
    if (search == null || search.length == 0) {
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
            search,
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
        this.makeDdcCompleteItem(
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

  private makeDdcCompleteItem(
    note: Note,
    lineNumber: number, // 0-indexed
    completePos: number,
  ): Item {
    const visual = "[[" + note.option + "]]";
    const content = note.id + "|" + note.option;
    const text = "[[" + content + "]]";
    const lspCmpItem = makeLspCompleteItem(
      text,
      visual,
      lineNumber,
      completePos,
    );
    return {
      word: text,
      abbr: content,
      user_data: {
        lspitem: JSON.stringify(lspCmpItem),
      },
    };
  }
}

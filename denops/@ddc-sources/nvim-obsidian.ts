import { BaseSource, DdcGatherItems, GatherArguments, Item } from "../deps.ts";
import {
  findNoteCandidate,
  makeLspCompleteItem,
} from "../obsidian/complete.ts";

type Params = {
  dir: string;
};
type Note = {
  id: string;
  option?: string;
};
type ObsidianUserData = {
  lspitem: string;
};

export class Source extends BaseSource<Params> {
  private counter = 0;

  override async gather(
    { denops, sourceParams, completePos, context, onCallback }: GatherArguments<
      Params
    >,
  ): Promise<DdcGatherItems<ObsidianUserData>> {
    const search = findNoteCandidate(context.input);
    if (search == null || search.length == 0) {
      return [];
    }

    this.counter = (this.counter + 1) % 100;
    const id = "source/" + this.name + "/" + this.counter;

    const [payload] = await Promise.all([
      onCallback(id) as Promise<{
        items?: Partial<Note>[];
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
    const items: Item<ObsidianUserData>[] = (payload.items ?? [])
      .filter((note): note is Note => !!note.id)
      .map((note) =>
        note.option
          ? this.makeAliasedItem(
            note.id,
            note.option,
            context.lineNr - 1,
            completePos,
          )
          : this.makeIdItem(
            note.id,
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

  private makeIdItem(
    noteId: string,
    lineNumber: number, // 0-indexed
    completePos: number,
  ): Item<ObsidianUserData> {
    const text = "[[" + noteId + "]]";
    const lspCmpItem = makeLspCompleteItem(
      text,
      text,
      lineNumber,
      completePos,
    );
    return {
      word: text,
      abbr: noteId,
      user_data: {
        lspitem: JSON.stringify(lspCmpItem),
      },
    };
  }

  private makeAliasedItem(
    noteId: string,
    alias: string,
    lineNumber: number, // 0-indexed
    completePos: number,
  ): Item<ObsidianUserData> {
    const visual = "[[" + noteId + "]]";
    const content = noteId + "|" + alias;
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

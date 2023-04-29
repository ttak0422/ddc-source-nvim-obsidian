import {
  BaseSource,
  DdcGatherItems,
  GatherArguments,
  Item,
  OnCompleteDoneArguments,
} from "../deps.ts";
import {
  findNoteCandidate,
  makeLspCompleteItem,
} from "../obsidian/complete.ts";

type Params = {
  dir: string;
};
type NewNote = {
  id: string;
  title: string;
};
type ObsidianNewUserData = {
  lspitem: string;
  noteId: string;
  noteTitle: string;
};

export class Source extends BaseSource<Params> {
  private counter = 0;

  override async gather(
    { denops, sourceParams, completePos, context, onCallback }: GatherArguments<
      Params
    >,
  ): Promise<DdcGatherItems<ObsidianNewUserData>> {
    const title = findNoteCandidate(context.input);
    if (title == null || title.length == 0) {
      return [];
    }

    this.counter = (this.counter + 1) % 100;
    const id = "source/" + this.name + "/" + this.counter;

    const [payload] = await Promise.all([
      onCallback(id) as Promise<{
        id?: string;
      }>,
      denops.call(
        "luaeval",
        "require('ddc_nvim_obsidian').publish_id(_A.arguments, _A.id)",
        {
          arguments: {
            opts: this.makeObsidianOpts(sourceParams),
            title,
          },
          id,
        },
      ),
    ]);

    if (payload?.id == null) {
      return [];
    }

    const item = this.makeDdcCompletionItem(
      { id: payload.id, title },
      context.lineNr - 1,
      completePos,
    );

    return {
      items: [item],
      isIncomplete: true,
    };
  }

  override params(): Params {
    return {
      dir: "~/vault",
    };
  }

  override onCompleteDone(
    { denops, sourceParams, userData }: OnCompleteDoneArguments<
      Params,
      ObsidianNewUserData
    >,
  ): Promise<void> {
    return denops.call(
      "luaeval",
      "require('ddc_nvim_obsidian').create_note(_A.arguments, _A.id)",
      {
        arguments: {
          opts: this.makeObsidianOpts(sourceParams),
          id: userData.noteId,
          title: userData.noteTitle,
        },
      },
    ) as Promise<void>;
  }

  private makeObsidianOpts(
    params: Params,
  ) {
    return {
      dir: params.dir,
    };
  }

  private makeDdcCompletionItem(
    note: NewNote,
    lineNumber: number, // 0-indexed
    completePos: number,
  ): Item<ObsidianNewUserData> {
    const visual = "[[" + note.title + "]]";
    const content = note.id + "|" + note.title;
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
        noteId: note.id,
        noteTitle: note.title,
      },
    };
  }
}

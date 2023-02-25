local obsidian = require("obsidian")
local config = require("obsidian.config")
local util = require("obsidian.util")

local request_items = function(arguments, id)
  local opts = config.ClientOpts.normalize(arguments.opts)
  local client = obsidian.new(opts)

  local items = {}
  for note in client:search(arguments.search, "--ignore-case") do
    -- id only
    table.insert(items, {
      id = note.id,
    })
    local aliases = note.aliases or {}
    for _, alias in pairs(aliases) do
      local options = {}
      local alias_case_matched = util.match_case(arguments.search, alias)
      if
        alias_case_matched ~= nil
        and alias_case_matched ~= alias
        and not util.contains(aliases, alias_case_matched)
      then
        table.insert(options, alias_case_matched)
      end

      table.insert(options, alias)

      for _, option in pairs(options) do
        -- id + alias
        table.insert(items, {
          id = note.id,
          option = option,
        })
      end
    end
  end

  vim.api.nvim_call_function("ddc#callback", { id, {
    items = items,
  } })
end

local publish_id = function(arguments, id)
  local opts = config.ClientOpts.normalize(arguments.opts)

  -- TODO: support setup
  -- https://github.com/epwalsh/obsidian.nvim/blob/main/README.md
  opts.note_id_func = function(title)
    local suffix = ""
    if title ~= nil then
      suffix = title:gsub(" ", "-"):gsub("[^A-Za-z0-9-]", ""):lower()
    else
      for _ = 1, 4 do
        suffix = suffix .. string.char(math.random(65, 90))
      end
    end
    return tostring(os.time()) .. "-" .. suffix
  end

  local client = obsidian.new(opts)
  vim.api.nvim_call_function("ddc#callback", { id, {
    id = client:new_note_id(arguments.title),
  } })
end

local create_note = function(arguments)
  local client = obsidian.new(arguments.opts)
  client:new_note(arguments.title, arguments.id, vim.fn.expand("%:p:h"))
end

return {
  request_items = request_items,
  publish_id = publish_id,
  create_note = create_note,
}

local obsidian = require("obsidian")
local config = require("obsidian.config")
local util = require("obsidian.util")

local request_items = function(arguments, id)
  local opts = config.ClientOpts.normalize(arguments.opts)
  local client = obsidian.new(opts)

  local items = {}
  for note in client:search(arguments.search, "--ignore-case") do
    for _, alias in pairs(note.aliases) do
      local options = {}
      local alias_case_matched = util.match_case(arguments.search, alias)
      if
        alias_case_matched ~= nil
        and alias_case_matched ~= alias
        and not util.contains(note.aliases, alias_case_matched)
      then
        table.insert(options, alias_case_matched)
      end

      table.insert(options, alias)

      for _, option in pairs(options) do
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

return {
  request_items = request_items,
}

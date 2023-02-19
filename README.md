# ddc-source-nvim-obsidian

obsidian.nvim completion for ddc.vim.

## Requirements

- [obsidian.nvim](https://github.com/epwalsh/obsidian.nvim)
- [ddc.vim](https://github.com/Shougo/ddc.vim)
- [vim-vsnip-integ](https://github.com/hrsh7th/vim-vsnip-integ)
- [vim-vsnip](https://github.com/hrsh7th/vim-vsnip)

## Configuration

```vim
function! Obsidian() abort
        call ddc#custom#patch_buffer('sources', ['nvim-obsidian'])
        call ddc#custom#patch_buffer('sourceOptions', #{
              \ nvim-obsidian: #{
              \   mark: 'O',
              \ }})
        call ddc#custom#patch_buffer('sourceParams', #{
              \ nvim-obsidian: #{
              \   dir: '~/vault',
              \ }})
endfunction

autocmd BufRead,BufNewFile ~/vault/**/*.md call Obsidian()
```

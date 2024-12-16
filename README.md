# Referece by Prose Mirror

# Data flow

[Diagram link](https://www.mermaidchart.com/raw/d0189296-f4d0-4c5a-a73a-cd6d2fd2517e?theme=light&version=v0.1&format=svg)

# TODO

## Selection

- [x] Automatically calculate Cursor position
- [x] Sync DOM partially

## Paragraph Node

- [x] Insert text
- [x] Delete text
- [ ] merge Node with Back Button
- [ ] Divide Node with Enter Button

# EXPLANATIONS

- Every block is based on `paragraph`
- It should be wrapped `paragraph` IF one line is only wrotten as `bold`
- It should be wrapped `paragraph` IF one line has only a `image`

# RoadMap

- [ ] Update State with plugin and Keymap definition
- [ ] [Update cursor pointer](https://github.com/ProseMirror/prosemirror-model/blob/master/src/resolvedpos.ts)

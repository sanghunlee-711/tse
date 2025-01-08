# Reference by Prose Mirror

# Data flow

[Diagram link](https://www.mermaidchart.com/raw/d0189296-f4d0-4c5a-a73a-cd6d2fd2517e?theme=light&version=v0.1&format=svg)

# TODO

## Selection

- [x] Automatically calculate Cursor position
- [x] Sync DOM partially

## Paragraph Node

- [x] 새로운 글자를 타이핑 하는 경우, 캐럿 위치는 글자가 주입된 다음에 위치해야 한다.
- [x] 기존의 글자를 지우는 경우, 캐럿 위치는 글자가 주입된 이전에 위치애햐 한다.
- [x] 노드의 마지막에서 엔터가 된 경우, 새로운 문단의 첫번째 위치에 캐럿이 위치 해야한다.
- [x] 노드의 중간 위치에서 엔터가 된 경우, 새로운 문단의 첫번째 위치에 캐럿이 위치 해야한다.
- [x] Paragraph안에 일반텍스트의 마지막지점과 강조 텍스트 노드의 시작지점이 겹치는 경우 노드 업데이트가 제대로 되지 않는 현상
  - [x] 삭제
  - [ ] 삽입
- [ ] 노드의 첫번째 위치에서 backSpace가 된 경우 이전 노드의 마지막에 캐럿이 위치 해야한다.

# EXPLANATIONS

- Every block is based on `paragraph`
- It should be wrapped `paragraph` IF one line is only written as `bold`
- It should be wrapped `paragraph` IF one line has only a `image`

# RoadMap

- [x] Update State with plugin and Keymap definition
- [ ] [Update cursor pointer](https://github.com/ProseMirror/prosemirror-model/blob/master/src/resolvedpos.ts)

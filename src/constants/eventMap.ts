export const EventMap = {
  insertText: (offset: number) => offset + 1,
  deleteText: (offset: number) => offset - 1,
  enterText: (offset: number) => 0,
};

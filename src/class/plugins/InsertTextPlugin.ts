import EditorView from '../EditorView';
import Transaction from '../Transaction';
import EditorPlugin from './EditorPlugin';

/**
 * 텍스트 삽입 트랜잭션을 생성합니다.
 * @param {string} text - 삽입할 텍스트
 * @returns {Transaction} 생성된 트랜잭션
 */
function createInsertTextTransaction(
  text: string,
  view: EditorView
): Transaction {
  const { startOffset, endOffset } = view.selection;
  const node = view.state.getNodeFrom(startOffset, endOffset);
  const offsetResult = view.state.getWindowOffsetFrom(
    startOffset,
    endOffset,
    view.rootElement
  );

  if (!offsetResult) throw new Error('windowOffset범위를 찾지 못했습니다.');

  const { windowStartOffset, windowEndOffset } = offsetResult;

  const transaction = new Transaction(view.state);
  const currentContent = node.content[0] as string;

  const updatedContent = [
    currentContent.slice(0, windowStartOffset) +
      text +
      currentContent.slice(windowEndOffset),
  ];
  node.content = updatedContent;
  transaction.updateNode(node);

  return transaction;
}

export class InsertTextPlugin implements EditorPlugin {
  eventType: keyof HTMLElementEventMap = 'input';

  on(event: Event, view: EditorView) {
    const e = event as InputEvent;
    if (e.inputType === 'insertText') {
      const transaction = createInsertTextTransaction(e.data || '', view);
      view.dispatch(transaction);
    }
  }
}

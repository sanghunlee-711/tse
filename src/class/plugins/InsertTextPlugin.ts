import { EventMap } from '@src/constants/eventMap';
import EditorView from '../EditorView';
import Transaction from '../Transaction';
import EditorPlugin from './EditorPlugin';
import { getCurrentWindowRangeAndNodeFrom } from '@src/utils/offset';

/**
 * @descriptions 문자열 생성 시 에디터의 커서 포인터가 제대로 위치하게 만들기 위한 메서드
 */
function updateCarrotPosition(
  stateStartOffset: number,
  stateEndOffset: number,
  view: EditorView
) {
  const result = getCurrentWindowRangeAndNodeFrom(
    stateStartOffset,
    stateEndOffset,
    view
  );

  if (!result) throw new Error('범위를 찾을 수 없습니다.');

  const { selection, windowStartOffset, windowEndOffset, windowNode, range } =
    result;

  range.setStart(windowNode, EventMap['insertText'](windowStartOffset));
  range.setEnd(windowNode, EventMap['insertText'](windowEndOffset));

  selection.removeAllRanges();
  selection.addRange(range);
}

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
  afterSyncDOM(transaction: Transaction, view: EditorView) {
    updateCarrotPosition(
      transaction.startOffset || 0,
      transaction.endOffset || 0,
      view
    );
  }
}

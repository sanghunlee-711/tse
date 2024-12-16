import { EventMap } from '@src/constants/eventMap';
import EditorView from '../EditorView';
import Transaction from '../Transaction';
import EditorPlugin from './EditorPlugin';
import { getCurrentWindowRangeAndNodeFrom } from '@src/utils/offset';

/**
 * @descriptions 문자열 삭제 시 에디터의 커서 포인터가 제대로 위치하게 만들기 위한 메서드
 * @param startOffset
 * @param endOffset
 * @returns
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

  range.setStart(windowNode, EventMap['deleteText'](windowStartOffset));
  range.setEnd(windowNode, EventMap['deleteText'](windowEndOffset));

  selection.removeAllRanges();
  selection.addRange(range);
}

/**
 * 텍스트 제거 트랜잭션을 생성합니다.
 * @param {string} text - 현재 텍스트
 * @returns {Transaction} 생성된 트랜잭션
 */
function createDeleteTextTransaction(
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
    currentContent.slice(0, windowStartOffset - 1) +
      currentContent.slice(windowEndOffset),
  ];

  node.content = updatedContent;
  transaction.updateNode(node);

  return transaction;
}

export class DeleteTextPlugin implements EditorPlugin {
  eventType: keyof HTMLElementEventMap = 'input';

  on(event: Event, view: EditorView) {
    const e = event as InputEvent;
    if (e.inputType === 'deleteContentBackward') {
      const transaction = createDeleteTextTransaction(e.data || '', view);
      view.dispatch(transaction, this);
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

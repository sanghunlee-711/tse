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

  const {
    selection,
    windowStartOffset,
    windowEndOffset,
    windowNode,
    range,
    contentIndex,
  } = result;

  const node = windowNode.childNodes[contentIndex];

  range.setStart(node, EventMap['insertText'](windowStartOffset));
  range.setEnd(node, EventMap['insertText'](windowEndOffset));

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
  const { content, contentIndex } = view.state.getNodeContentFrom(
    startOffset,
    endOffset
  );
  const offsetResult = view.state.getWindowOffsetFrom(
    startOffset,
    endOffset,
    view.rootElement
  );

  if (!offsetResult) throw new Error('windowOffset범위를 찾지 못했습니다.');

  const { windowStartOffset, windowEndOffset } = offsetResult;

  const transaction = new Transaction(view.state);

  if (typeof content === 'string') {
    const updatedContent =
      content.slice(0, windowStartOffset) +
      text +
      content.slice(windowEndOffset);

    node.content[contentIndex] = updatedContent;
  } else {
    // *TODO: 에러처리 필요할 것 같다.
    throw new Error('문자가 아닌 node가 탐색 되었습니다.');
  }

  transaction.updateNode(node);

  return transaction;
}

export class InsertTextPlugin implements EditorPlugin {
  eventType: keyof HTMLElementEventMap = 'input';

  on(event: Event, view: EditorView) {
    const e = event as InputEvent;
    if (e.inputType === 'insertText') {
      const transaction = createInsertTextTransaction(e.data || '', view);
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

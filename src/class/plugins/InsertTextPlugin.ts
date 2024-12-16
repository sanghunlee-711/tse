import { EventMap } from '@src/constants/eventMap';
import EditorView from '../EditorView';
import Transaction from '../Transaction';
import EditorPlugin from './EditorPlugin';
import { getCurrentWindowRangeAndNodeFrom } from '@src/utils/offset';

/**
 * @descriptions DOM Node가 rerender될 때 현재 캐럿 및 Selection의 위치를 적절하게 유지하기 위한 메서드.
 * [x] 새로운 글자를 타이핑 하는 경우, 캐럿 위치는 글자가 주입된 다음에 위치해야 한다.
 * [x] 기존의 글자를 지우는 경우, 캐럿 위치는 글자가 주입된 이전에 위치애햐 한다.
 * [ ] 노드의 마지막에서 엔터가 된 경우, 새로운  문단의 첫번째 위치에 캐럿이 위치 해야한다.
 * [ ] 노드의 중간 위치에서 엔터가 된 경우, 새로운 문단의 첫번째 위치에 캐럿이 위치 해야한다.
 * [ ] 노드의 첫번째 위치에서 backSpace가 된 경우 이전 노드의 마지막에 캐럿이 위치 해야한다.
 * TODO: 발생되는 이벤트에 따라 caretPosition이 달라져야 하므로 별도로 분기처리가 필요함
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

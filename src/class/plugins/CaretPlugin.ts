import EditorView from '../EditorView';
import Transaction from '../Transaction';
import EditorPlugin from './EditorPlugin';
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
  const selection = window.getSelection();

  if (!selection || !view.rootElement) {
    console.warn('Unable to update selection.');
    return;
  }

  const offsetResult = view.state.getWindowOffsetFrom(
    stateStartOffset,
    stateEndOffset,
    view.rootElement
  );

  if (!offsetResult) throw new Error('windowOffset범위를 찾지 못했습니다.');

  const { windowStartOffset, windowEndOffset } = offsetResult;

  // TLDR; getWindowNodeFrom는 Text를 가진 하위 노드인 경우 그 텍스트를 가진 상위 노드를 반환해주므로 firstChild를 활용
  const windowNode = view.state.getWindowNodeFrom(
    stateStartOffset,
    stateEndOffset,
    view.rootElement
  ).firstChild as Node;

  const range = document.createRange();
  console.log(
    'range.startOffset:',
    range.startOffset,
    'range.endOffset',
    range.endOffset,
    range.startContainer,
    'windowNode',
    windowNode,
    windowNode.textContent
  );

  range.setStart(windowNode, windowStartOffset);
  range.setEnd(windowNode, windowEndOffset);

  selection.removeAllRanges();
  selection.addRange(range);
}

export default class CaretPlugin implements EditorPlugin {
  eventType: keyof HTMLElementEventMap = 'keyup';
  on = (e: Event, view: EditorView) => {
    // 구현 내용
  };
  //   afterSyncDOM = (transaction: Transaction, view: EditorView) => {
  //     updateCarrotPosition(
  //       transaction.startOffset || 0,
  //       transaction.endOffset || 0,
  //       view
  //     );
  //   };
}

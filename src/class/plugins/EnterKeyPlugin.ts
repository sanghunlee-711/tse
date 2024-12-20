import { getCurrentWindowRangeAndNodeFrom } from '@src/utils/offset';
import EditorView from '../EditorView';
import Transaction from '../Transaction';
import EditorPlugin from './EditorPlugin';
import { EventMap } from '@src/constants/eventMap';

//TODO: 문자열에 해당하는 Italic, Bold, Text ETC...는 다음 문단으로 넘어가야함.
//UL, LI와 같은 리스트의 경우 다음 리스트로 만들어 줘야함.(텍스트에서 치는 경우 다음 문단으로 텍스트 잘라서 넘어가야함.)
/**
 * @descriptions 엔터키 클릭 시 에디터의 커서 포인터가 제대로 위치하게 만들기 위한 메서드
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

  range.setStart(node, EventMap['enterText'](windowStartOffset));
  range.setEnd(node, EventMap['enterText'](windowEndOffset));

  selection.removeAllRanges();
  selection.addRange(range);
}

/**
 * 텍스트 삽입 트랜잭션을 생성합니다.
 * @param {string} text - 삽입할 텍스트
 * @returns {Transaction} 생성된 트랜잭션
 */
function enterTextTransaction(view: EditorView): Transaction {
  const { startOffset, endOffset } = view.selection;
  const node = view.state.getNodeFrom(startOffset, endOffset);
  const { content, contentIndex } = view.state.getNodeContentFrom(
    startOffset,
    endOffset
  );

  const siblingContents = view.state.getSiblingContentFrom(
    startOffset,
    endOffset
  );

  const currParagraphIdx = view.state.getParagraphIdxFrom(
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

  //1. 현재 노드의 content에서 slice를 쳐서 잘라냄.
  //2. 현재 노드 컨텐츠의 index에서 그 뒤까지 모든 인덱스를 새로운 paragraph를 만들고 넣음.
  //3. 새로이 만든

  //   if (typeof content === 'string') {
  //     const updatedContent =
  //       content.slice(0, windowStartOffset) + content.slice(windowEndOffset);

  //     node.content[contentIndex] = updatedContent;
  //   } else {
  //     // *TODO: 에러처리 필요할 것 같다.
  //     throw new Error('문자가 아닌 node가 탐색 되었습니다.');
  //   }

  transaction.updateNode(node);

  return transaction;
}

export class EnterKeyPlugin implements EditorPlugin {
  eventType: keyof HTMLElementEventMap = 'keyup';
  on(event: Event, view: EditorView) {
    const e = event as KeyboardEvent;

    if (e.key === 'Enter') {
      enterTextTransaction(view);
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

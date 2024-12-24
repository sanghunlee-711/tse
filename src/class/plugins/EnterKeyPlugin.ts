import { getCurrentWindowRangeAndNodeFrom } from '@src/utils/offset';
import EditorView from '../EditorView';
import Transaction from '../Transaction';
import EditorPlugin from './EditorPlugin';
import { EventMap } from '@src/constants/eventMap';
import TSENode from '../TSENode';

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

  const node = windowNode.childNodes[contentIndex].parentNode as Node;

  range.setStart(node, EventMap['enterText'](windowStartOffset));
  range.setEnd(node, EventMap['enterText'](windowEndOffset));

  selection.removeAllRanges();
  selection.addRange(range);
}

/**
 * 엔터키를 누른 경우 현재 위치의 다음 컨텐츠 및 siblings들을 문단(paragraph)의 node로 만들어서 현재 다음의 문단으로 넣어줘야한다.
 *
 * @param {string} text - 삽입할 텍스트
 * @returns {Transaction} 생성된 트랜잭션
 */
function enterTextTransaction(view: EditorView): Transaction {
  const { startOffset: selectionStartOffset, endOffset: selectionEndOffset } =
    view.selection;
  /**
   * @description 알 수 없는 이유로 offset이 1 더해져서 들어오기에 임의로 -1 처리.
   */
  const startOffset =
      selectionStartOffset - 1 > 0 ? selectionStartOffset - 1 : 0,
    endOffset = selectionEndOffset - 1 > 0 ? selectionEndOffset - 1 : 0;

  console.log(
    '@@@',
    startOffset,
    endOffset,
    view.selection,
    view.state.selection
  );
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
  //2. slice친 컨텐츠를 동일 노드의 분할된 컨텐츠로 만듦;

  if (typeof content === 'string') {
    const currContentPrev = content.slice(0, windowStartOffset);
    const currContentNext = content.slice(windowEndOffset);
    const prevSiblingNodes = siblingContents.slice(0, contentIndex);
    const nextSiblingNodes = siblingContents.slice(contentIndex + 1);
    const nextLineContent = [currContentNext, ...nextSiblingNodes];
    console.log({ windowStartOffset, windowEndOffset, startOffset, endOffset });
    node.content[contentIndex] = currContentPrev;
    const prevParagraph = view.state.doc.content.slice(0, currParagraphIdx),
      currentParagraph = view.state.doc.content[currParagraphIdx],
      newParagraph = new TSENode('paragraph', {}, nextLineContent),
      nextParagraph = view.state.doc.content.slice(currParagraphIdx + 1);

    console.log({
      currParagraphIdx,
      prevParagraph,
      currentParagraph,
      newParagraph,
      nextParagraph,
    });
    view.state.doc.content = [
      ...prevParagraph,
      currentParagraph,
      newParagraph,
      ...nextParagraph,
    ];
    transaction.updateNode(view.state.doc);

    return transaction;
  } else {
    //TSENode인 경우 후처리 필요
  }

  transaction.updateNode(node);

  return transaction;
}

export class EnterKeyPlugin implements EditorPlugin {
  eventType: keyof HTMLElementEventMap = 'keyup';
  on(event: Event, view: EditorView) {
    const e = event as KeyboardEvent;
    console.log(view.state, view.selection);
    if (e.key === 'Enter') {
      console.log('enter event  count');
      const transaction = enterTextTransaction(view);
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

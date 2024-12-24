import { getCurrentWindowRangeAndNodeFrom } from '@src/utils/offset';
import EditorView from '../EditorView';
import Transaction from '../Transaction';
import EditorPlugin from './EditorPlugin';
import { EventMap } from '@src/constants/eventMap';
import TSENode, { TSENodeContent } from '../TSENode';

//TODO: UL, LI와 같은 리스트의 경우 다음 리스트로 만들어 줘야함.(텍스트에서 치는 경우 다음 문단으로 텍스트 잘라서 넘어가야함.)
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
 * @param {EditorView} view - 현재 view
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
  const { content: stateContent, contentIndex } = view.state.getNodeContentFrom(
    startOffset,
    endOffset
  );
  const transaction = new Transaction(view.state);
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

  const dfs = (
    root: TSENode,
    parent: TSENode | null,
    parentIdx: number | null
  ): TSENode | null => {
    const currContent = root.content;

    for (let i = 0; i < currContent.length; i++) {
      const content = currContent[i];

      if (content instanceof TSENode) {
        const result = dfs(content, root, i);
        if (result) return result;
      }

      if (content === stateContent) {
        /**
         * @description bold, italic과 같이 paragraph안에 더 깊은 뎁스로 있는 textNode인 경우
         * TODO: 강조 타입을 커스텀 할 수 있게 외부로 뺄 수 있는 방법을 고려해야한다.
         */
        const emphasizedNoeType = ['bold', 'italic'];
        const listNodeType = ['li', 'ul', 'ol'];

        const isEmphasizedTextNode =
          parent?.type === 'paragraph' &&
          parentIdx !== null &&
          emphasizedNoeType.includes(root.type);

        const isListNode =
          listNodeType.includes(parent?.type || '') &&
          parentIdx !== null &&
          listNodeType.includes(root.type);

        const isRawTextNode =
          parent?.type === 'doc' &&
          root.type === 'paragraph' &&
          parentIdx !== null;

        if (isEmphasizedTextNode) {
          const prevParagraph = view.state.doc.content.slice(
              0,
              currParagraphIdx
            ),
            currentParagraph = view.state.doc.content[currParagraphIdx],
            nextParagraph = view.state.doc.content.slice(currParagraphIdx + 1);

          const prevContent = (content as string).slice(0, windowStartOffset),
            nextContent = (content as string).slice(windowEndOffset);

          const updatedCurrentParagraph = new TSENode('paragraph', {}, [
              ...(currentParagraph as TSENode).content.slice(0, parentIdx),
              new TSENode(root.type, {}, [prevContent]),
            ]),
            newParagraph = new TSENode('paragraph', {}, [
              new TSENode(root.type, {}, [nextContent]),
              ...(currentParagraph as TSENode).content.slice(parentIdx + 1),
            ]);

          view.state.doc.content = [
            ...prevParagraph,
            updatedCurrentParagraph,
            newParagraph,
            ...nextParagraph,
          ];

          return view.state.doc;
        } else if (isRawTextNode) {
          const prevParagraph = view.state.doc.content.slice(
              0,
              currParagraphIdx
            ),
            currentParagraph = view.state.doc.content[
              currParagraphIdx
            ] as TSENode,
            nextParagraph = view.state.doc.content.slice(currParagraphIdx + 1);
          const prevContent = (content as string).slice(0, windowStartOffset),
            nextContent = (content as string).slice(windowEndOffset);
          const prevContentInCurrentParagraph = currentParagraph.content.slice(
            0,
            contentIndex
          );
          const nextContentInCurrentParagraph = currentParagraph.content.slice(
            contentIndex + 1
          );
          const updatedParagraph = new TSENode('paragraph', {}, [
            ...prevContentInCurrentParagraph,
            prevContent,
          ]);
          const newParagraph = new TSENode('paragraph', {}, [
            nextContent,
            ...nextContentInCurrentParagraph,
          ]);

          view.state.doc.content = [
            ...prevParagraph,
            updatedParagraph,
            newParagraph,
            ...nextParagraph,
          ];
          return view.state.doc;
        } else if (isListNode) {
          console.log('welcome listNode', 'currentType : ', root.type);
        }
        return view.state.doc;
      }
    }
    return null;
  };

  const result = dfs(view.state.doc, null, null);
  if (!result) throw new Error('문단 찾지 못한 에러 같습니다.');
  console.log({ result });
  transaction.updateNode(result);
  return transaction;
}

export class EnterKeyPlugin implements EditorPlugin {
  eventType: keyof HTMLElementEventMap = 'keyup';
  on(event: Event, view: EditorView) {
    const e = event as KeyboardEvent;

    if (e.key === 'Enter') {
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

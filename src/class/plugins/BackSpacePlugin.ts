import { EventMap } from '@src/constants/eventMap';
import EditorView from '../EditorView';
import Transaction from '../Transaction';
import EditorPlugin from './EditorPlugin';
import { getCurrentWindowRangeAndNodeFrom } from '@src/utils/offset';
import TSENode from '../TSENode';

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

  const {
    selection,
    windowStartOffset,
    windowEndOffset,
    windowNode,
    range,
    contentIndex,
  } = result;

  const node = windowNode.childNodes[contentIndex];

  range.setStart(node, EventMap['deleteText'](windowStartOffset));
  range.setEnd(node, EventMap['deleteText'](windowEndOffset));

  selection.removeAllRanges();
  selection.addRange(range);
}

/**
 * 텍스트 제거 트랜잭션을 생성합니다.
 * @returns {Transaction} 생성된 트랜잭션
 */
function createDeleteTextTransaction(view: EditorView): Transaction {
  const { startOffset, endOffset } = view.selection;

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
      if (content == stateContent) {
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

        console.log({
          root,
          isRawTextNode,
          isEmphasizedTextNode,
          currParagraphIdx,
          startOffset,
        });

        if (isEmphasizedTextNode) {
          const isStartInParagraph = root.startOffset === startOffset;
          const prevParagraph = view.state.doc.content.slice(
              0,
              currParagraphIdx - 1
            ),
            rightBeforeParagraph = view.state.doc.content[
              currParagraphIdx - 1
            ] as TSENode,
            currentParagraph = view.state.doc.content[
              currParagraphIdx
            ] as TSENode,
            nextParagraph = view.state.doc.content.slice(currParagraphIdx + 1);
          console.log({
            root,
            prevParagraph,
            rightBeforeParagraph,
            currentParagraph,
            nextParagraph,
            currParagraphIdx,
            startOffset,
          });
          /**
           * case1) emphasizedNode의 startOffset보다 큰 값의 windowStartOffset을 가진 경우, 그냥 지우게 둠.
           * case2) emphasizedNode의 startOffset과 동일한 windowStartOffset을 가진 경우 현재 paragraph의 bold이전의 컨텐츠 인덱스로 노드를 이동시켜 삭제 처리 해줌.
           *  emphasizedNode가 0번째 인덱스인 경우는 직전 paragraph의 마지막 컨텐츠로 현재 paragraph의 모든 컨텐츠를 넣어줌.
           * case3)
           */
          const isInRange =
            root.startOffset < startOffset && typeof content === 'string';
          const isStartInEmphasizedNode =
            root.startOffset < startOffset && contentIndex !== 0;
          if (isInRange) {
            const updatedContent =
              content.slice(0, windowStartOffset - 1) +
              content.slice(windowEndOffset);
            root.content[contentIndex] = updatedContent;
            return root;
          }

          if (isStartInEmphasizedNode) {
            const prevNode = root.content[contentIndex - 1];
            console.log('@isStartInEmphasizedNode', { prevNode });

            // if (typeof prevNode === 'string') {
            //   const updatedContent =
            //     prevNode.slice(0, windowStartOffset - 1) +
            //     prevNode.slice(windowEndOffset);

            //   root.content[contentIndex - 1] = updatedContent;
            //   return root;
            // }
          }
        } else if (isRawTextNode) {
          const isStartInParagraph = root.startOffset === startOffset;
          const prevParagraph = view.state.doc.content.slice(
              0,
              currParagraphIdx - 1
            ),
            rightBeforeParagraph = view.state.doc.content[
              currParagraphIdx - 1
            ] as TSENode,
            currentParagraph = view.state.doc.content[
              currParagraphIdx
            ] as TSENode,
            nextParagraph = view.state.doc.content.slice(currParagraphIdx + 1);

          const nextContent = (content as string).slice(windowEndOffset);
          //* TODO: 이전 문단의 마지막이 문자열이면 문자열에 바로 붙여줘야 하고 그렇지 않다면 push를 하는 형태로 개선 필요
          if (isStartInParagraph && currParagraphIdx !== 0) {
            currentParagraph.content.forEach((eachContent) => {
              rightBeforeParagraph.content.push(eachContent);
            });

            view.state.doc.content = [
              ...prevParagraph,
              rightBeforeParagraph,
              ...nextParagraph,
            ];
          } else if (typeof content === 'string') {
            /**
             * 현재 paragraph에서 위치한 content가 모두 지워진 상태라면 해당 인덱스의 컨텐츠를 배열에서 삭제해줘야 한다.
             */
            const updatedContent =
              content.slice(0, windowStartOffset - 1) +
              content.slice(windowEndOffset);

            root.content[contentIndex] = updatedContent;
            return root;
          }
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

export class BackSpacePlugin implements EditorPlugin {
  eventType: keyof HTMLElementEventMap = 'input';

  on(event: Event, view: EditorView) {
    const e = event as InputEvent;
    if (e.inputType === 'deleteContentBackward') {
      const transaction = createDeleteTextTransaction(view);
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

import EditorView from '@src/class/EditorView';
import { OFFSET_DELIMITER } from '@src/constants/delimiter';
import { ROOT_NODE_NAME } from '@src/constants/node';

/**
 * @descriptions window DOM노드와 windowOffset을 통해 TSENode에서 사용될 stateOffset으로 반환해줍니다.
 * @param {Node} node - DOM 노드
 * @param {number} windowOffset - windowNode의 offset
 * @returns {number} TSENode에서 사용가능한 stateOffset
 */
export function calculateAbsoluteOffsetFromDOM(
  node: Node,
  windowOffset: number
): number {
  const $content = document.getElementById(ROOT_NODE_NAME);
  let currentNode = node;
  let accumulatedOffset = windowOffset;

  while (currentNode && currentNode.previousSibling) {
    currentNode = currentNode.previousSibling;

    const isElement = currentNode.nodeType === Node.ELEMENT_NODE,
      isTextNode = currentNode.nodeType === Node.TEXT_NODE;

    if (isElement) {
      const element = currentNode as HTMLElement;

      if (element.nodeName === 'P') {
        accumulatedOffset += element.textContent?.length || 0;
        accumulatedOffset += OFFSET_DELIMITER;
      } else {
        //bold, i 태그 등에 들어있는 텍스트 관리를 위한 조건
        accumulatedOffset += element.textContent?.length || 0;
      }
    } else if (isTextNode) {
      const textNode = currentNode as Text;
      accumulatedOffset += textNode.length;
    }
  }

  if (currentNode?.parentNode && currentNode.parentNode !== $content) {
    return (
      accumulatedOffset +
      calculateAbsoluteOffsetFromDOM(currentNode.parentNode, 0)
    );
  }

  return accumulatedOffset;
}
/**
 * @descriptions 현재의 windowRange객체와 Node를 반환해줍니다.
 * @param stateStartOffset Selection에 존재하는 상태관리를 위한 TSENode의 StartOffset
 * @param stateEndOffset Selection에 존재하는 상태관리를 위한 TSENode의 EndOffset
 * @param view EditorView
 * @returns
 */
export function getCurrentWindowRangeAndNodeFrom(
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

  // TODO : getWindowNodeFrom는 Text를 가진 하위 노드인 경우 그 텍스트를 가진 상위 노드를 반환해주므로 firstChild를 활용
  const windowNode = view.state.getWindowNodeFrom(
    stateStartOffset,
    stateEndOffset,
    view.rootElement
  );
  const {
    node: tseNode,
    content,
    contentIndex,
  } = view.state.getNodeContentFrom(stateStartOffset, stateEndOffset);

  const range = document.createRange();

  return {
    selection,
    windowStartOffset,
    windowEndOffset,
    windowNode,
    range,
    tseNode,
    content,
    contentIndex,
  };
}

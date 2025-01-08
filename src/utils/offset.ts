import EditorView from '@src/class/EditorView';
import TSENode from '@src/class/TSENode';
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

  const windowNode = view.state.getWindowNodeFrom(
    stateStartOffset,
    stateEndOffset,
    view.rootElement
  );

  const contents = view.state.getNodeContentFrom(
    stateStartOffset,
    stateEndOffset
  );

  const range = document.createRange();

  return {
    selection,
    windowStartOffset,
    windowEndOffset,
    windowNode,
    range,
    contents,
  };
}

/**
 * @description offset을 통해 node의 content 들과 해당 content의 Index들을 반환 합니다.
 * @param stateStartOffset
 * @param stateEndOffset
 */
export function getAllNodeContentsWithin(
  stateStartOffset: number,
  stateEndOffset: number,
  root: TSENode
): Array<{ node: TSENode; contentIndex: number; content: string | TSENode }> {
  const results: Array<{
    node: TSENode;
    contentIndex: number;
    content: string | TSENode;
  }> = [];

  const dfs = (node: TSENode) => {
    const isInsideNode =
      node.startOffset <= stateEndOffset && node.endOffset >= stateStartOffset;

    if (!isInsideNode) return;

    const contents = node.content;
    let currentOffset = node.startOffset;
    let contentLength: number;

    for (let i = 0; i < contents.length; i++) {
      const content = contents[i];

      if (typeof content === 'string') {
        contentLength = content.length;
      } else {
        contentLength =
          content.endOffset - content.startOffset + OFFSET_DELIMITER;
      }

      const contentStart = currentOffset;
      const contentEnd = currentOffset + contentLength;

      const isOverlapping = !(
        contentEnd < stateStartOffset || contentStart > stateEndOffset
      );

      if (isOverlapping) {
        results.push({ node, contentIndex: i, content });

        if (content instanceof TSENode) {
          dfs(content);
        }
      }

      currentOffset += contentLength;
    }
  };

  dfs(root);

  if (results.length === 0) {
    throw new Error(
      '해당 범위에 해당하는 content를 찾을 수 없습니다. 범위를 확인해주세요.'
    );
  }

  return results;
}

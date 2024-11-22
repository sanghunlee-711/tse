import { OFFSET_DELIMITER } from '@src/constants/delimiter';
import { ROOT_NODE_NAME } from '@src/constants/node';

/**
 * DOM 노드로부터 절대 오프셋을 계산합니다.
 * @param {Node} node - DOM 노드
 * @param {number} offset - 노드 내부의 상대 오프셋
 * @returns {number} 절대 오프셋
 */
export function calculateAbsoluteOffsetFromDOM(
  node: Node,
  offset: number
): number {
  const $content = document.getElementById(ROOT_NODE_NAME);
  let currentNode = node;
  let accumulatedOffset = offset;

  while (currentNode && currentNode.previousSibling) {
    currentNode = currentNode.previousSibling;
    const textLength = currentNode.textContent?.length || 0;
    accumulatedOffset += textLength + (textLength > 0 ? OFFSET_DELIMITER : 0);
  }

  if (currentNode?.parentNode && currentNode.parentNode !== $content) {
    return (
      accumulatedOffset +
      calculateAbsoluteOffsetFromDOM(currentNode.parentNode, 0)
    );
  }

  return accumulatedOffset;
}

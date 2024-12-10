import TSENode from '@src/class/TSENode';
import { OFFSET_DELIMITER } from '@src/constants/delimiter';
import { ROOT_NODE_NAME } from '@src/constants/node';

/**
 * window DOM 노드로부터 절대 오프셋을 계산합니다.
 * window DOM노드의 상황을 통해 TSENode에서 사용될 절대 offset으로 반환해줍니다.
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

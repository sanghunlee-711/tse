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

/**
 * @description offset을 통해 node의 content와 해당 content의 Index를 반환 합니다.
 * @param stateStartOffset
 * @param stateEndOffset
 */
export function getNodeContentWith(
  stateStartOffset: number,
  stateEndOffset: number,
  root: TSENode
): {
  node: TSENode;
  contentIndex: number;
  content: string | TSENode;
} {
  const dfs = (
    node: TSENode
  ): {
    node: TSENode;
    contentIndex: number;
    content: string | TSENode;
  } | null => {
    const isInsideNode =
      node.startOffset <= stateStartOffset && node.endOffset >= stateEndOffset;

    if (!isInsideNode) return null;

    const contents = node.content;
    // node 내에서 offset 계산을 위해 현재 노드의 시작 오프셋을 기준으로 순회
    let currentOffset = node.startOffset;
    let contentLength: number;
    for (let i = 0; i < contents.length; i++) {
      const content = contents[i];

      if (typeof content === 'string') {
        contentLength = content.length;
      } else {
        //paragraph인 경우에 해당 할 것이므로 OFFSET_DELIMITER를 추가해준다.
        // TSENode 일 경우 해당 노드의 범위를 이용
        contentLength =
          content.endOffset - content.startOffset + OFFSET_DELIMITER;
      }

      const contentStart = currentOffset;
      const contentEnd = currentOffset + contentLength;

      // 해당 content가 stateStartOffset와 stateEndOffset를 포함하는지 확인
      const isInsideContent =
        contentStart <= stateStartOffset && contentEnd >= stateEndOffset;

      if (isInsideContent) {
        if (content instanceof TSENode) {
          // content가 또 다른 TSENode일 경우, 재귀적으로 탐색

          const found = dfs(content);
          if (found) return found;
        } else {
          const result = { node, contentIndex: i, content };

          // content가 문자열인 경우, 여기서 찾았으므로 반환
          return result;
        }
      }

      currentOffset += contentLength;
    }

    // 현재 node 범위 내에 있으나 하위 content에서 발견하지 못한 경우 null 반환
    return null;
  };

  const result = dfs(root);

  if (!result) {
    throw new Error(
      '해당 범위에 해당하는 content를 찾을 수 없습니다. 범위를 확인해주세요.'
    );
  }

  return result;
}

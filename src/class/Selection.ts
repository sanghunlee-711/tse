import { calculateAbsoluteOffsetFromDOM } from '@src/utils/offset';
import TSENode from './TSENode';

class Selection {
  rootNode: TSENode;
  startOffset: number = 0;
  endOffset: number = 0;
  matchedNode: TSENode | null = null;

  constructor(rootNode: TSENode) {
    this.rootNode = rootNode;
  }

  updateRootNode(doc: TSENode) {
    this.rootNode = doc;
  }

  updateSelection() {
    const selection = window.getSelection();
    if (!selection?.rangeCount) return;
    const range = selection.getRangeAt(0);

    this.startOffset = calculateAbsoluteOffsetFromDOM(
      range.startContainer,
      range.startOffset
    );
    this.endOffset = calculateAbsoluteOffsetFromDOM(
      range.endContainer,
      range.endOffset
    );

    this.matchedNode = this.findNodeByOffset(this.rootNode, this.startOffset);

    //아래는 테스트를 위한 섹션
    const output = document.getElementById('output');
    const nodeContent =
      typeof this.matchedNode?.content === 'string'
        ? this.matchedNode.content
        : this.matchedNode?.content?.join('');

    if (this.startOffset === this.endOffset) {
      if (output) {
        output.innerText = `커서 위치: ${this.startOffset}, 노드 내용: "${nodeContent}", 노드 범위: "${this.matchedNode?.startOffset} ~ ${this.matchedNode?.endOffset}"`;
      }
    } else {
      if (output) {
        output.textContent = `선택 범위: ${this.startOffset} ~ ${this.endOffset}, 노드 내용: "${nodeContent}", 노드 범위: "${this.matchedNode?.startOffset} ~ ${this.matchedNode?.endOffset}"`;
      }
    }
  }

  /**
   * TSENode와 offset을 통해 TSENode를 찾아냅니다.
   * @param {TSENode} node - TSENode (루트 TSENode)
   * @param {number} offset - 노드 내부의 상대 오프셋
   * @returns {TSENode} TSENode
   */
  findNodeByOffset(node: TSENode | string, offset: number): TSENode | null {
    if (typeof node === 'string') return null;
    if (offset >= node.startOffset && offset <= node.endOffset) {
      if (typeof node.content === 'string') {
        return node;
      }
      if (Array.isArray(node.content)) {
        for (const child of node.content) {
          const found = this.findNodeByOffset(child, offset);
          if (found) return found;
        }
      }
      return node;
    }
    return null;
  }
}

export default Selection;

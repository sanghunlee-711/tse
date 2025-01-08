import {
  calculateAbsoluteOffsetFromDOM,
  getNodeContentWith,
} from '@src/utils/offset';
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

    const result = getNodeContentWith(
      this.startOffset,
      this.endOffset,
      this.rootNode
    );
    if (!result)
      throw new Error('Selection을 통해 matchedNode찾기에 실패하였습니다.');
    this.matchedNode = result.node;

    //아래는 테스트를 위한 섹션
    const output = document.getElementById('output');
    const nodeContent =
      typeof this.matchedNode?.content === 'string'
        ? this.matchedNode.content
        : this.matchedNode?.content?.join('');

    if (this.startOffset === this.endOffset) {
      if (output) {
        output.innerText = `stateOffset: ${this.startOffset}, \n 노드 내용: "${nodeContent}", \n 노드 범위: "${this.matchedNode?.startOffset} ~ ${this.matchedNode?.endOffset}"\n 현재 노드 컨텐츠: ${JSON.stringify(this.rootNode.content, null, 2)}`;
      }
    } else {
      if (output) {
        output.textContent = `선택 범위: ${this.startOffset} ~ ${this.endOffset}, 노드 내용: "${nodeContent}", 노드 범위: "${this.matchedNode?.startOffset} ~ ${this.matchedNode?.endOffset}"`;
      }
    }
  }
}

export default Selection;

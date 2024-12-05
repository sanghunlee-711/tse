import EditorState from './EditorState';
import Schema from './Schema';
import TSENode, { TSENodeContent } from './TSENode';

/**
 * @description
 * Transaction 클래스는 문서 상태를 변경하는 여러 단계를 저장하고,
 * 노드 추가/삭제와 같은 명령을 기록,
 * apply 메서드를 통해 한 번에 상태를 갱신.
 */

interface TransactionAttrs {
  [key: string]: any;
}

class Transaction {
  steps: ((doc: TSENode) => TSENode)[] = []; // 트랜잭션에 적용할 단계 함수 배열
  changedRange: { from: number; to: number } | null = null; // 변경 범위
  state: EditorState; //상태에 해당 단계의 Transaction 실행 시 start,endOFfset이 존재한다.
  startOffset: number | null = null;
  endOffset: number | null = null;

  constructor(state: EditorState) {
    this.state = state;
    this.startOffset = this.state.selection.startOffset;
    this.endOffset = this.state.selection.endOffset;
  }

  /**
   * 변경 범위를 업데이트합니다.
   * @param {number} from - 변경 시작 인덱스
   * @param {number} to - 변경 끝 인덱스
   */
  updateChangedRange(from: number, to: number) {
    if (!this.changedRange) {
      this.changedRange = { from, to };
    } else {
      this.changedRange = {
        from: Math.min(this.changedRange.from, from),
        to: Math.max(this.changedRange.to, to),
      };
    }
  }

  modifyTransactionOffset(startOffset: number, endOffset: number) {
    this.startOffset = startOffset;
    this.endOffset = endOffset;
  }

  // 새로운 노드를 추가하는 단계 설정
  addNode(
    type: string,
    attrs: TransactionAttrs,
    content: (TSENode | string)[] = [],
    addNodeIndex?: number
  ): this {
    const newNode = this.state.schema.createNode(type, attrs, content);
    this.steps.push((doc) => {
      let newContent = doc.content;

      if (addNodeIndex) {
        const prevContent = doc.content.slice(0, addNodeIndex + 1);

        const nextContent = doc.content.slice(addNodeIndex + 1);

        newContent = [...prevContent, newNode, ...nextContent];

        this.updateChangedRange(doc.content.length, doc.content.length + 1);
      } else {
        newContent = [...doc.content, newNode];
        this.updateChangedRange(doc.content.length, doc.content.length + 1);
      }

      return new TSENode(doc.type, doc.attrs, newContent);
    });
    return this;
  }

  // 특정 노드의 속성을 업데이트하는 단계 설정
  updateNodeAttrs(nodeIndex: number, newAttrs: TransactionAttrs): this {
    this.steps.push((doc) => {
      const updatedContent = doc.content.map((node, index) => {
        if (index === nodeIndex && node instanceof TSENode) {
          return new TSENode(
            node.type,
            { ...newAttrs },
            node.content,
            node.startOffset
          );
        }

        return node;
      });

      this.updateChangedRange(nodeIndex, nodeIndex + 1);

      return new TSENode(doc.type, doc.attrs, updatedContent);
    });

    return this;
  }

  // 특정 노드의 속성을 업데이트하는 단계 설정
  updateNodeContents(nodeIndex: number, newContents: TSENodeContent[]): this {
    this.steps.push((doc) => {
      const updatedContent = doc.content.map((node, index) => {
        if (index === nodeIndex && node instanceof TSENode) {
          return new TSENode(
            node.type,
            node.attrs,
            newContents,
            node.startOffset
          );
        }

        return node;
      });

      this.updateChangedRange(nodeIndex, nodeIndex + 1);

      const result = new TSENode(doc.type, doc.attrs, updatedContent);

      return result;
    });

    return this;
  }
}

export default Transaction;

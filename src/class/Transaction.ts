import { OFFSET_DELIMITER } from '@src/constants/delimiter';
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

  /**
   *
   * @param type 노드 타입
   * @param attrs 노드 속성 eg. id, class
   * @param content 노드가 가질 컨텐츠 ['contents', 'foo', 'bar']
   * @param addNodeIndex 인덱스가 있는 경우 해당 위치에 노드를 끼워넣는다.
   * @returns Transaction
   */
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

  updateNodeContents(
    changedNode: TSENode,
    newContents: TSENodeContent[]
  ): this {
    this.steps.push((doc) => {
      const updateContentRecursively = (node: TSENode): TSENode => {
        // 현재 노드가 변경 대상 노드인 경우 업데이트
        if (node === changedNode) {
          return new TSENode(
            node.type,
            node.attrs,
            newContents,
            node.startOffset
          );
        }

        // 현재 노드가 아닌 경우 하위 content를 재귀적으로 탐색
        const updatedContent = node.content.map((content) => {
          if (content instanceof TSENode) {
            return updateContentRecursively(content);
          }
          return content; // 문자열인 경우 그대로 유지
        });

        // 업데이트된 content로 새로운 노드 생성
        return new TSENode(
          node.type,
          node.attrs,
          updatedContent,
          node.startOffset
        );
      };

      // 루트 노드에서 재귀적으로 탐색 시작
      const updatedDoc = updateContentRecursively(doc);

      // 변경된 노드의 범위를 다시 계산
      const changedNodeStart = changedNode.startOffset;
      const changedNodeEnd =
        changedNode.startOffset +
        newContents.reduce((len, content) => {
          if (typeof content === 'string') {
            return len + content.length;
          } else if (content instanceof TSENode) {
            return (
              len + content.endOffset - content.startOffset + OFFSET_DELIMITER
            );
          }
          return len;
        }, 0);

      this.updateChangedRange(changedNodeStart, changedNodeEnd);

      return updatedDoc;
    });

    return this;
  }
}

export default Transaction;

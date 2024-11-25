import TSENode from './TSENode';
import Transaction from './Transaction';
import Selection from './Selection';
import Schema from './Schema';
import { OFFSET_DELIMITER } from '@src/constants/delimiter';

export interface EditorStateConfig {
  schema: Schema; // schema 속성 추가
  doc?: TSENode; // 문서의 초기 상태 (옵션)
}

class EditorState {
  schema: Schema; // schema 속성 추가
  doc: TSENode;
  selection: Selection;

  constructor(config: EditorStateConfig, selection: Selection) {
    this.schema = config.schema;
    this.doc = config.doc || this.schema.createNode('doc', {}, []);
    this.selection = selection;
  }

  apply(transaction: Transaction): EditorState {
    let updatedDoc = this.doc;
    transaction.steps.forEach((step) => {
      updatedDoc = step(updatedDoc);
    });

    updatedDoc.recalculateOffsets();

    return new EditorState(
      { schema: this.schema, doc: updatedDoc },
      this.selection
    );
  }

  resolvePosition(offset: number) {
    let accumulatedOffset = 0;
    /**
     * @description 문단을 넘어가면 traverse를 할 때마다 다음 노드의 첫번째 offset이 이전 노드의 마지막 offset보다 1이 크기에 재귀 카운트를 활용
     */
    let traverseCount = 0;

    const traverse = (
      node: TSENode
    ): { node: TSENode; localOffset: number } | null => {
      for (const child of node.content) {
        if (typeof child === 'string') {
          const currentNodeOffsetDiff = node.endOffset - node.startOffset;

          if (
            accumulatedOffset + currentNodeOffsetDiff >=
            offset - traverseCount
          ) {
            return {
              node,
              localOffset: offset - accumulatedOffset - traverseCount,
            };
          }

          accumulatedOffset += currentNodeOffsetDiff;
        } else if (child instanceof TSENode) {
          const result = traverse(child);
          //*TODO: content내에 다른 TSENode가 있는 경우 이 방식이 유효한지에 대해서는 추가 고민 필요
          traverseCount += OFFSET_DELIMITER;
          if (result) return result;
        }
      }
      return null;
    };

    const result = traverse(this.doc);
    if (!result) throw new Error('Offset out of bounds');

    return result;
  }

  toJSON(): any {
    return {
      schema: this.schema.spec, // 스키마 스펙만 직렬화
      doc: this.doc.toJSON(), // 문서 내용을 JSON 형식으로 직렬화
      selection: this.selection,
    };
  }
}

export default EditorState;

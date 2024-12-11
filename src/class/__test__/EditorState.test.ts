import { describe, expect, it } from 'vitest';
import EditorState from '../EditorState';
import { OFFSET_DELIMITER } from '@src/constants/delimiter';
import TSENode from '../TSENode';
import Selection from '../Selection';
import Schema from '../Schema';

describe('TSENode recalculateOffsets 테스트', () => {
  it('같은 stateStartOffset과 stateEndOffset (17, 17)', () => {
    const schemaSpec = {
      nodes: {
        doc: { content: 'block+' },
        paragraph: { group: 'block' },
        heading: { group: 'block', attrs: { level: 1 } },
      },
    };
    const schema = new Schema(schemaSpec);

    const root = new TSENode('doc', {}, [
      new TSENode('paragraph', {}, [
        'ABC_',
        new TSENode('bold', {}, ['BOLD']),
        '_EFG',
      ]),
      new TSENode('paragraph', {}, ['ABC_']),
      new TSENode('paragraph', {}, ['HIJ']),
    ]);

    /**
     *  A B C _ B O L D _ E F G
     * 0 1 2 3 4 5 6 7 8 9 10 11 12
     *  A B C _
     * 13 14 15 16 17
     *  H I J
     * 18 19 20 21
     */
    const editorState = new EditorState(
      { schema, doc: root },
      new Selection(root)
    );
    root.recalculateOffsets();

    const result = editorState.getWindowOffsetFrom(17, 17);
    console.log(
      '@@@@',
      'StartOffset : ',
      editorState.doc.startOffset,
      'endOffset : ',
      editorState.doc.endOffset
    );
    expect(result?.windowStartOffset).toBe(4); // Paragraph 2, 마지막 "ABC "의 끝
    expect(result?.windowEndOffset).toBe(4); // 동일 위치
  });
});

import { describe, it, expect } from 'vitest';
import EditorState from '../EditorState';
import Schema from '../Schema';
import Selection from '../Selection';
import TSENode from '../TSENode';

const schemaSpec = {
  nodes: {
    doc: { content: 'block+' },
    paragraph: { group: 'block' },
    heading: { group: 'block', attrs: { level: 1 } },
  },
};
const doc = new TSENode(
  'doc',
  {
    id: 'test',
  },
  [
    new TSENode('paragraph', {}, ['Hello, World!']),
    new TSENode('paragraph', {}, ['ProseMirror-inspired editor']),
    new TSENode('paragraph', {}, [
      'Some Text is Start and ',
      new TSENode('bold', {}, ['Bold Text']),
      ' and more text',
    ]),
  ]
);
const selection = new Selection(doc);
const schema = new Schema(schemaSpec);
describe('EditorState > getWindowNodeFrom', () => {
  it('중첩된 Bold 노드와 여러 paragraph의 DOM 매핑 테스트', () => {
    const BOLD_TEXT = 'BOLD',
      FIRST_PARAGRAPH_TEXT = 'ABC ',
      SECOND_PARAGRAPH_TEXT = 'DEF';

    const bold = new TSENode('bold', {}, [BOLD_TEXT]);
    const paragraph1 = new TSENode('paragraph', {}, [
      FIRST_PARAGRAPH_TEXT,
      bold,
    ]);
    const paragraph2 = new TSENode('paragraph', {}, [SECOND_PARAGRAPH_TEXT]);
    const root = new TSENode('doc', {}, [paragraph1, paragraph2]);

    // 가상 DOM 생성
    const rootElement = document.createElement('div');
    const p1 = document.createElement('p');
    const boldElement = document.createElement('b');
    boldElement.textContent = BOLD_TEXT;
    p1.append(FIRST_PARAGRAPH_TEXT, boldElement);
    const p2 = document.createElement('p');
    p2.textContent = SECOND_PARAGRAPH_TEXT;
    rootElement.append(p1, p2);

    const state = new EditorState({ schema, doc: root }, selection);
    root.recalculateOffsets();
    // 상태 오프셋을 기반으로 DOM 노드 찾기
    const result = state.getWindowNodeFrom(
      4, // BOLD_TEXT의 시작
      8, // BOLD_TEXT의 끝
      rootElement
    );

    expect(result.textContent).toEqual(boldElement.textContent); // Bold DOM 노드가 반환되어야 함
  });
  it('stateOffset마지막 위치에서 DOM노드 가져오는지 테스트', () => {
    const BOLD_TEXT = 'BOLD',
      FIRST_PARAGRAPH_TEXT = 'ABC ',
      SECOND_PARAGRAPH_TEXT = 'DEF';
    /**
     *  A B C B O L D
     * 0 1 2 3 4 5 6 7
     *  D E F
     * 8 9 10 11
     */
    const bold = new TSENode('bold', {}, [BOLD_TEXT]);
    const paragraph1 = new TSENode('paragraph', {}, [
      FIRST_PARAGRAPH_TEXT,
      bold,
    ]);
    const paragraph2 = new TSENode('paragraph', {}, [SECOND_PARAGRAPH_TEXT]);
    const root = new TSENode('doc', {}, [paragraph1, paragraph2]);

    // 가상 DOM 생성
    const rootElement = document.createElement('div');
    const p1 = document.createElement('p');
    const boldElement = document.createElement('b');
    boldElement.textContent = BOLD_TEXT;
    p1.append(FIRST_PARAGRAPH_TEXT, boldElement);
    const p2 = document.createElement('p');
    p2.textContent = SECOND_PARAGRAPH_TEXT;
    rootElement.append(p1, p2);

    const state = new EditorState({ schema, doc: root }, selection);
    root.recalculateOffsets();
    // 상태 오프셋을 기반으로 DOM 노드 찾기
    const result = state.getWindowNodeFrom(
      7, // BOLD_TEXT의 시작
      7, // BOLD_TEXT의 끝
      rootElement
    );

    expect(result.textContent).toEqual(boldElement.textContent); // Bold DOM 노드가 반환되어야 함
  });
  it('세개 이상의 문단에서 중간 문단의 마지막 offset 위치에서 DOM노드를 정상적으로 가져오는지 테스트', () => {
    const FIRST_PARAGRAPH_TEXT = 'ABC',
      SECOND_PARAGRAPH_TEXT = 'DEFG',
      THIRD_PARAGRAPH_TEXT = 'HIJ';
    /**
     *  A B C
     * 0 1 2 3
     *  D E F G
     * 4 5 6 7 8
     *  H I J
     * 9 10 11 12
     */

    const paragraph1 = new TSENode('paragraph', {}, [FIRST_PARAGRAPH_TEXT]);
    const paragraph2 = new TSENode('paragraph', {}, [SECOND_PARAGRAPH_TEXT]);
    const paragraph3 = new TSENode('paragraph', {}, [THIRD_PARAGRAPH_TEXT]);
    const root = new TSENode('doc', {}, [paragraph1, paragraph2, paragraph3]);

    // 가상 DOM 생성
    const rootElement = document.createElement('div');
    const p1 = document.createElement('p');
    p1.append(FIRST_PARAGRAPH_TEXT);
    const p2 = document.createElement('p');
    p2.textContent = SECOND_PARAGRAPH_TEXT;
    const p3 = document.createElement('p');
    p3.textContent = THIRD_PARAGRAPH_TEXT;
    rootElement.append(p1, p2, p3);

    const state = new EditorState({ schema, doc: root }, selection);
    root.recalculateOffsets();
    // 상태 오프셋을 기반으로 DOM 노드 찾기
    const result = state.getWindowNodeFrom(
      8, // 두번째문단의 끝
      8, // 두번째문단의 끝
      rootElement
    );

    expect(result.textContent).toEqual(p2.textContent); // Bold DOM 노드가 반환되어야 함
  });
  it('세개 이상의 문단에서 중간 문단의 첫번째 offset 위치에서 DOM노드를 정상적으로 가져오는지 테스트', () => {
    const FIRST_PARAGRAPH_TEXT = 'ABC',
      SECOND_PARAGRAPH_TEXT = 'DEFG',
      THIRD_PARAGRAPH_TEXT = 'HIJ';
    /**
     *  A B C
     * 0 1 2 3
     *  D E F G
     * 4 5 6 7 8
     *  H I J
     * 9 10 11 12
     */

    const paragraph1 = new TSENode('paragraph', {}, [FIRST_PARAGRAPH_TEXT]);
    const paragraph2 = new TSENode('paragraph', {}, [SECOND_PARAGRAPH_TEXT]);
    const paragraph3 = new TSENode('paragraph', {}, [THIRD_PARAGRAPH_TEXT]);
    const root = new TSENode('doc', {}, [paragraph1, paragraph2, paragraph3]);

    // 가상 DOM 생성
    const rootElement = document.createElement('div');
    const p1 = document.createElement('p');
    p1.append(FIRST_PARAGRAPH_TEXT);
    const p2 = document.createElement('p');
    p2.textContent = SECOND_PARAGRAPH_TEXT;
    const p3 = document.createElement('p');
    p3.textContent = THIRD_PARAGRAPH_TEXT;
    rootElement.append(p1, p2, p3);

    const state = new EditorState({ schema, doc: root }, selection);
    root.recalculateOffsets();
    // 상태 오프셋을 기반으로 DOM 노드 찾기
    const result = state.getWindowNodeFrom(
      4, // 두번째문단의 시작
      4, // 두번째문단의 시작
      rootElement
    );

    expect(result.textContent).toEqual(p2.textContent); // Bold DOM 노드가 반환되어야 함
  });
});

describe('EditorState > getWindowOffsetFrom', () => {
  it('두번째 이상의 문단에서 끝 또는 제일 앞의 windowOffset계산', () => {
    const FIRST_PARAGRAPH_TEXT = 'ABC ',
      SECOND_PARAGRAPH_TEXT = 'DEF';

    const paragraph1 = new TSENode('paragraph', {}, [FIRST_PARAGRAPH_TEXT]);
    const paragraph2 = new TSENode('paragraph', {}, [SECOND_PARAGRAPH_TEXT]);
    const root = new TSENode('doc', {}, [paragraph1, paragraph2]);
    /**
     *  A B C
     * 0 1 2 3 --- stateOffset
     *  D E F
     * 4 5 6 7 --- stateOffset
     */

    // 가상 DOM 생성
    const rootElement = document.createElement('div');
    const p1 = document.createElement('p');
    p1.textContent = FIRST_PARAGRAPH_TEXT;
    const p2 = document.createElement('p');
    p2.textContent = SECOND_PARAGRAPH_TEXT;
    rootElement.append(p1, p2);

    const state = new EditorState({ schema, doc: root }, selection);
    root.recalculateOffsets();

    // 첫 번째 첫번쨰 텍스트 위치 확인
    const result1 = state.getWindowOffsetFrom(0, 0, rootElement);
    expect(result1).toEqual({ windowStartOffset: 0, windowEndOffset: 0 });

    const result2 = state.getWindowOffsetFrom(3, 3, rootElement);
    expect(result2).toEqual({ windowStartOffset: 3, windowEndOffset: 3 });

    // 두 번째 문단의 첫번째 텍스트 확인
    const result3 = state.getWindowOffsetFrom(4, 4, rootElement);
    expect(result3).toEqual({ windowStartOffset: 0, windowEndOffset: 0 });

    // 두 번째 문단의 마지막 텍스트 확인
    const result4 = state.getWindowOffsetFrom(7, 7, rootElement);
    expect(result4).toEqual({ windowStartOffset: 3, windowEndOffset: 3 });
  });

  it('중첩된 Bold 노드와 여러 paragraph의 OFFSET_DELIMITER 계산', () => {
    const BOLD_TEXT = 'BOLD',
      FIRST_PARAGRAPH_TEXT = 'ABC ',
      SECOND_PARAGRAPH_TEXT = 'DEF';

    const bold = new TSENode('bold', {}, [BOLD_TEXT]);
    const paragraph1 = new TSENode('paragraph', {}, [
      FIRST_PARAGRAPH_TEXT,
      bold,
    ]);
    const paragraph2 = new TSENode('paragraph', {}, [SECOND_PARAGRAPH_TEXT]);
    const root = new TSENode('doc', {}, [paragraph1, paragraph2]);
    /**
     * ABCBOLD
     * DEF
     */

    // 가상 DOM 생성
    const rootElement = document.createElement('div');
    const p1 = document.createElement('p');
    const boldElement = document.createElement('b');
    boldElement.textContent = BOLD_TEXT;
    p1.append(FIRST_PARAGRAPH_TEXT, boldElement);
    const p2 = document.createElement('p');
    p2.textContent = SECOND_PARAGRAPH_TEXT;
    rootElement.append(p1, p2);

    const state = new EditorState({ schema, doc: root }, selection);
    root.recalculateOffsets();
    // 첫 번째 문단의 전체 텍스트 확인
    const result1 = state.getWindowOffsetFrom(0, 7, rootElement);
    expect(result1).toEqual({ windowStartOffset: 0, windowEndOffset: 7 });

    // 첫 번째 문단의 Bold 텍스트 확인
    const result2 = state.getWindowOffsetFrom(3, 7, rootElement);
    expect(result2).toEqual({ windowStartOffset: 0, windowEndOffset: 4 });

    // 첫 번째 문단의 마지막 중첩된 위치 확인
    const result3 = state.getWindowOffsetFrom(7, 7, rootElement);
    expect(result3).toEqual({ windowStartOffset: 4, windowEndOffset: 4 });

    // 두 번째 문단의 전체 텍스트 확인
    const result4 = state.getWindowOffsetFrom(8, 11, rootElement);
    expect(result4).toEqual({ windowStartOffset: 0, windowEndOffset: 3 });

    // 두 번째 문단의 전체 텍스트 확인
    const result5 = state.getWindowOffsetFrom(11, 11, rootElement);
    expect(result5).toEqual({ windowStartOffset: 3, windowEndOffset: 3 });
  });
});

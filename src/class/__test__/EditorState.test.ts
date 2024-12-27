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
      FIRST_PARAGRAPH_TEXT = 'ABC_',
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
  it('두개의 문단에서 stateOffset마지막 위치에서 DOM노드 가져오는지 테스트', () => {
    const BOLD_TEXT = 'BOLD',
      FIRST_PARAGRAPH_TEXT = 'ABC_',
      SECOND_PARAGRAPH_TEXT = 'DEF';
    /**
     *  A B C _ B O L D
     * 0 1 2 3 4 5 6 7 8
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
      8, // BOLD_TEXT의 시작
      8, // BOLD_TEXT의 끝
      rootElement
    );

    expect(result.textContent).toEqual(boldElement.textContent); // Bold DOM 노드가 반환되어야 함
  });

  it('문단내에서 자식 TSENode앞의 위치에서 텍스트 DOM노드 가져오는지 테스트', () => {
    const BOLD_TEXT = 'BOLD',
      FIRST_PARAGRAPH_TEXT = 'ABC_',
      SECOND_PARAGRAPH_TEXT = 'DEF';
    /**
     *  A B C _ B O L D
     * 0 1 2 3 4 5 6 7 8
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
      4, // BOLD_TEXT의 시작
      4, // BOLD_TEXT의 시작
      rootElement
    );

    expect(result.textContent).toEqual(FIRST_PARAGRAPH_TEXT); //TextNode의 마지막이자 Bold노드의 첫번째 이므로 TextNode가 반환되어야 함.
  });

  it('두개의 문단에서 stateOffset시작 위치에서 DOM노드 가져오는지 테스트', () => {
    const BOLD_TEXT = 'BOLD',
      FIRST_PARAGRAPH_TEXT = 'ABC',
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
      8, // 두번 째 문단 첫번째 문자의 시작
      8, // 두번 째 문단 첫번째 문자의 시작
      rootElement
    );

    expect(result.textContent).toEqual(p2.textContent); // Bold DOM 노드가 반환되어야 함
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
     * 0 1 2 3 ---> stateOffset
     *  D E F G
     * 4 5 6 7 8 ---> stateOffset
     *  H I J
     * 9 10 11 12 ---> stateOffset
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

  it('세개 이상의 문단에서 두번쨰 문단의 중간 offset 위치에서 DOM노드를 정상적으로 가져오는지 테스트', () => {
    const FIRST_PARAGRAPH_TEXT = 'ABC',
      SECOND_PARAGRAPH_TEXT = 'DEFG',
      THIRD_PARAGRAPH_TEXT = 'HIJ';
    /**
     *  A B C
     * 0 1 2 3 ---> stateOffset
     *  D E F G
     * 4 5 6 7 8 ---> stateOffset
     *  H I J
     * 9 10 11 12 ---> stateOffset
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
      6, // 두번째문단의 시작
      6, // 두번째문단의 시작
      rootElement
    );

    expect(result.textContent).toEqual(p2.textContent); // Bold DOM 노드가 반환되어야 함
  });
});

describe('EditorState > getWindowOffsetFrom', () => {
  it('두개의 문단에서 첫번째 문단의 stateOffset이 주어진 경우, 동일한 값을 반환해야 한다.', () => {
    const FIRST_PARAGRAPH_TEXT = 'ABCBOLD',
      SECOND_PARAGRAPH_TEXT = 'DEF';
    /**
     *  A B C B O L D
     * 0 1 2 3 4 5 6 7
     *  D E F
     * 8 9 10 11
     */

    const paragraph1 = new TSENode('paragraph', {}, [FIRST_PARAGRAPH_TEXT]);
    const paragraph2 = new TSENode('paragraph', {}, [SECOND_PARAGRAPH_TEXT]);
    const root = new TSENode('doc', {}, [paragraph1, paragraph2]);

    // 가상 DOM 생성
    const rootElement = document.createElement('div');
    const p1 = document.createElement('p');
    p1.append(FIRST_PARAGRAPH_TEXT);
    const p2 = document.createElement('p');
    p2.textContent = SECOND_PARAGRAPH_TEXT;
    rootElement.append(p1, p2);

    const state = new EditorState({ schema, doc: root }, selection);
    root.recalculateOffsets();
    // 상태 오프셋을 기반으로 DOM 노드 찾기
    const result = state.getWindowOffsetFrom(
      4, // BOLD_TEXT의 시작
      4, // BOLD_TEXT의 끝
      rootElement
    );

    expect(result).toEqual({
      windowStartOffset: 4,
      windowEndOffset: 4,
    });
  });

  it('두개의 문단에서 첫번째 문단의 시작 위치의 stateOffset인 경우, 0을 반환해야 한다.', () => {
    const FIRST_PARAGRAPH_TEXT = 'ABCBOLD',
      SECOND_PARAGRAPH_TEXT = 'DEF';
    /**
     *  A B C B O L D
     * 0 1 2 3 4 5 6 7
     *  D E F
     * 8 9 10 11
     */

    const paragraph1 = new TSENode('paragraph', {}, [FIRST_PARAGRAPH_TEXT]);
    const paragraph2 = new TSENode('paragraph', {}, [SECOND_PARAGRAPH_TEXT]);
    const root = new TSENode('doc', {}, [paragraph1, paragraph2]);

    // 가상 DOM 생성
    const rootElement = document.createElement('div');
    const p1 = document.createElement('p');
    p1.append(FIRST_PARAGRAPH_TEXT);
    const p2 = document.createElement('p');
    p2.textContent = SECOND_PARAGRAPH_TEXT;
    rootElement.append(p1, p2);

    const state = new EditorState({ schema, doc: root }, selection);
    root.recalculateOffsets();
    // 상태 오프셋을 기반으로 DOM 노드 찾기
    const result = state.getWindowOffsetFrom(
      0, // BOLD_TEXT의 시작
      0, // BOLD_TEXT의 끝
      rootElement
    );

    expect(result).toEqual({
      windowStartOffset: 0,
      windowEndOffset: 0,
    });
  });

  it('두개의 문단에서 첫번째 문단의 마지막 위치의 stateOffset인 경우, 적절한 값을 반환해야 한다.', () => {
    const FIRST_PARAGRAPH_TEXT = 'ABCBOLD',
      SECOND_PARAGRAPH_TEXT = 'DEF';
    /**
     *  A B C B O L D
     * 0 1 2 3 4 5 6 7
     *  D E F
     * 8 9 10 11
     */

    const paragraph1 = new TSENode('paragraph', {}, [FIRST_PARAGRAPH_TEXT]);
    const paragraph2 = new TSENode('paragraph', {}, [SECOND_PARAGRAPH_TEXT]);
    const root = new TSENode('doc', {}, [paragraph1, paragraph2]);

    // 가상 DOM 생성
    const rootElement = document.createElement('div');
    const p1 = document.createElement('p');
    p1.append(FIRST_PARAGRAPH_TEXT);
    const p2 = document.createElement('p');
    p2.textContent = SECOND_PARAGRAPH_TEXT;
    rootElement.append(p1, p2);

    const state = new EditorState({ schema, doc: root }, selection);
    root.recalculateOffsets();
    // 상태 오프셋을 기반으로 DOM 노드 찾기
    const result = state.getWindowOffsetFrom(
      7, // BOLD_TEXT의 시작
      7, // BOLD_TEXT의 끝
      rootElement
    );

    expect(result).toEqual({
      windowStartOffset: 7,
      windowEndOffset: 7,
    });
  });

  it('두개의 문단에서 두번째 문단의 시작 위치의 stateOffset인 경우, 0을 반환해야 한다.', () => {
    const FIRST_PARAGRAPH_TEXT = 'ABCBOLD',
      SECOND_PARAGRAPH_TEXT = 'DEF';
    /**
     *  A B C B O L D
     * 0 1 2 3 4 5 6 7
     *  D E F
     * 8 9 10 11
     */

    const paragraph1 = new TSENode('paragraph', {}, [FIRST_PARAGRAPH_TEXT]);
    const paragraph2 = new TSENode('paragraph', {}, [SECOND_PARAGRAPH_TEXT]);
    const root = new TSENode('doc', {}, [paragraph1, paragraph2]);

    // 가상 DOM 생성
    const rootElement = document.createElement('div');
    const p1 = document.createElement('p');
    p1.append(FIRST_PARAGRAPH_TEXT);
    const p2 = document.createElement('p');
    p2.textContent = SECOND_PARAGRAPH_TEXT;
    rootElement.append(p1, p2);

    const state = new EditorState({ schema, doc: root }, selection);
    root.recalculateOffsets();
    // 상태 오프셋을 기반으로 DOM 노드 찾기
    const result = state.getWindowOffsetFrom(
      8, // BOLD_TEXT의 시작
      8, // BOLD_TEXT의 끝
      rootElement
    );

    expect(result).toEqual({
      windowStartOffset: 0,
      windowEndOffset: 0,
    });
  });

  it('두개의 문단에서 두번째 문단의 마지막 위치의 stateOffset인 경우, 적절한 값을 반환해야 한다.', () => {
    const FIRST_PARAGRAPH_TEXT = 'ABCBOLD',
      SECOND_PARAGRAPH_TEXT = 'DEF';
    /**
     *  A B C B O L D
     * 0 1 2 3 4 5 6 7
     *  D E F
     * 8 9 10 11
     */

    const paragraph1 = new TSENode('paragraph', {}, [FIRST_PARAGRAPH_TEXT]);
    const paragraph2 = new TSENode('paragraph', {}, [SECOND_PARAGRAPH_TEXT]);
    const root = new TSENode('doc', {}, [paragraph1, paragraph2]);

    // 가상 DOM 생성
    const rootElement = document.createElement('div');
    const p1 = document.createElement('p');
    p1.append(FIRST_PARAGRAPH_TEXT);
    const p2 = document.createElement('p');
    p2.textContent = SECOND_PARAGRAPH_TEXT;
    rootElement.append(p1, p2);

    const state = new EditorState({ schema, doc: root }, selection);
    root.recalculateOffsets();
    // 상태 오프셋을 기반으로 DOM 노드 찾기
    const result = state.getWindowOffsetFrom(
      11, // 두번째 문단의 시작
      11, // 두번째 문단의 끝
      rootElement
    );

    expect(result).toEqual({
      windowStartOffset: 3,
      windowEndOffset: 3,
    }); // Bold DOM 노드가 반환되어야 함
  });

  it('두개의 문단에서 stateOffset의 범위가 주어진 경우, 적절한 windowOffset을 가져와야한다.', () => {
    const FIRST_PARAGRAPH_TEXT = 'ABCBOLD',
      SECOND_PARAGRAPH_TEXT = 'DEF';
    /**
     *  A B C B O L D
     * 0 1 2 3 4 5 6 7
     *  D E F
     * 8 9 10 11
     */

    const paragraph1 = new TSENode('paragraph', {}, [FIRST_PARAGRAPH_TEXT]);
    const paragraph2 = new TSENode('paragraph', {}, [SECOND_PARAGRAPH_TEXT]);
    const root = new TSENode('doc', {}, [paragraph1, paragraph2]);

    // 가상 DOM 생성
    const rootElement = document.createElement('div');
    const p1 = document.createElement('p');
    p1.append(FIRST_PARAGRAPH_TEXT);
    const p2 = document.createElement('p');
    p2.textContent = SECOND_PARAGRAPH_TEXT;
    rootElement.append(p1, p2);

    const state = new EditorState({ schema, doc: root }, selection);
    root.recalculateOffsets();
    // 상태 오프셋을 기반으로 DOM 노드 찾기
    const result = state.getWindowOffsetFrom(
      3, // BOLD_TEXT의 시작
      7, // BOLD_TEXT의 끝
      rootElement
    );

    expect(result).toEqual({
      windowStartOffset: 3,
      windowEndOffset: 7,
    }); // Bold DOM 노드가 반환되어야 함
  });

  it('세개 이상의 문단에서 두번째 문단의 마지막 offset 위치에서 DOM노드를 정상적으로 가져오는지 테스트', () => {
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
    const result = state.getWindowOffsetFrom(
      8, // 두번째문단의 끝
      8, // 두번째문단의 끝
      rootElement
    );

    expect(result).toEqual({
      windowStartOffset: 4,
      windowEndOffset: 4,
    }); // Bold DOM 노드가 반환되어야 함
  });
  it('세개 이상의 문단에서 두번째 문단의 첫번째 offset 위치에서 DOM노드를 정상적으로 가져오는지 테스트', () => {
    const FIRST_PARAGRAPH_TEXT = 'ABC',
      SECOND_PARAGRAPH_TEXT = 'DEFG',
      THIRD_PARAGRAPH_TEXT = 'HIJ';
    /**
     *  A B C
     * 0 1 2 3 ---> stateOffset
     *  D E F G
     * 4 5 6 7 8 ---> stateOffset
     *  H I J
     * 9 10 11 12 ---> stateOffset
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
    const result = state.getWindowOffsetFrom(
      4, // 두번째문단의 시작
      4, // 두번째문단의 시작
      rootElement
    );

    expect(result?.windowStartOffset).toEqual(0);
    expect(result?.windowEndOffset).toEqual(0);
  });
});

describe('EditorState > getNodeContentFrom', () => {
  it('중첩된 Bold 노드와 여러 paragraph에서 컨텐츠 및 해당 컨텐츠의 인덱스 찾기', () => {
    /**
     *  A B C _ B O L D H E L L O
     * 0 1 2 3 4 5 6 7 8 9 10 11 12 13
     *  D E F
     * 14 15 16 17
     */
    const BOLD_TEXT = 'BOLD',
      FIRST_PARAGRAPH_TEXT = 'ABC_',
      FIRST_PARAGRAPH_LATER_TEXT = 'HELLO',
      SECOND_PARAGRAPH_TEXT = 'DEF';

    const bold = new TSENode('bold', {}, [BOLD_TEXT]);
    const paragraph1 = new TSENode('paragraph', {}, [
      FIRST_PARAGRAPH_TEXT,
      bold,
      FIRST_PARAGRAPH_LATER_TEXT,
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
    const result = state.getNodeContentFrom(
      3, //C 뒤편의 offset
      3 // C 뒤편의 offset
    );

    expect(result.content).toEqual(FIRST_PARAGRAPH_TEXT);
    expect(result.contentIndex).toEqual(0);

    const result2 = state.getNodeContentFrom(
      4, //C_ 뒤편의 offset
      4 // C_ 뒤편의 offset
    );

    expect(result2.content).toEqual(FIRST_PARAGRAPH_TEXT);
    expect(result2.contentIndex).toEqual(0); //BOLD노드 자체의 인덱스를 받아오게 되므로 0이어야 함

    const result3 = state.getNodeContentFrom(
      10, // B 뒤편의 offset
      10 // B 뒤편의 offset
    );

    expect(result3.content).toEqual(FIRST_PARAGRAPH_LATER_TEXT);
    expect(result3.contentIndex).toEqual(2);

    const result4 = state.getNodeContentFrom(
      14, // 두번째 문단 D앞의 offset
      14 // 두번째 문단 D앞의 offset
    );

    expect(result4.content).toEqual(SECOND_PARAGRAPH_TEXT);
    expect(result4.contentIndex).toEqual(0);
  });

  it('paragraph의 마지막 위치인 경우, 컨텐츠 및 해당 컨텐츠의 인덱스 찾기', () => {
    /**
     *  A B C _ B O L D H E L L O
     * 0 1 2 3 4 5 6 7 8 9 10 11 12 13
     *  D E F
     * 14 15 16 17
     *  G H I
     * 18 19 20 21
     */
    const FIRST_PARAGRAPH_TEXT = 'ABC_',
      BOLD_TEXT = 'BOLD',
      FIRST_PARAGRAPH_LATER_TEXT = 'HELLO',
      SECOND_PARAGRAPH_TEXT = 'DEF',
      THIRD_PARAGRAPH_TEXT = 'GHI';

    const bold = new TSENode('bold', {}, [BOLD_TEXT]);
    const paragraph1 = new TSENode('paragraph', {}, [
      FIRST_PARAGRAPH_TEXT,
      bold,
      FIRST_PARAGRAPH_LATER_TEXT,
    ]);
    const paragraph2 = new TSENode('paragraph', {}, [SECOND_PARAGRAPH_TEXT]);
    const paragraph3 = new TSENode('paragraph', {}, [THIRD_PARAGRAPH_TEXT]);
    const root = new TSENode('doc', {}, [paragraph1, paragraph2, paragraph3]);

    // 가상 DOM 생성
    const rootElement = document.createElement('div');
    const p1 = document.createElement('p');
    const boldElement = document.createElement('b');
    boldElement.textContent = BOLD_TEXT;
    p1.append(FIRST_PARAGRAPH_TEXT, boldElement);
    const p2 = document.createElement('p');
    p2.textContent = SECOND_PARAGRAPH_TEXT;
    const p3 = document.createElement('p');
    p3.textContent = THIRD_PARAGRAPH_TEXT;
    rootElement.append(p1, p2, p3);

    const state = new EditorState({ schema, doc: root }, selection);
    root.recalculateOffsets();

    const first = state.getNodeContentFrom(
      13, //두번째 paragraph 가장 마지막 위치
      13 // 두번째 paragraph 가장 마지막 위치
    );

    expect(first.content).toEqual(FIRST_PARAGRAPH_LATER_TEXT);
    expect(first.contentIndex).toEqual(2);

    // 상태 오프셋을 기반으로 DOM 노드 찾기
    const second = state.getNodeContentFrom(
      17, //두번째 paragraph 가장 마지막 위치
      17 // 두번째 paragraph 가장 마지막 위치
    );

    expect(second.content).toEqual(SECOND_PARAGRAPH_TEXT);
    expect(second.contentIndex).toEqual(0);

    const third = state.getNodeContentFrom(
      21, //세번째 paragraph 가장 마지막 위치
      21 // 세번째 paragraph 가장 마지막 위치
    );

    expect(third.content).toEqual(THIRD_PARAGRAPH_TEXT);
    expect(third.contentIndex).toEqual(0);
  });
});

describe('EditorState > getSiblingContentFrom', () => {
  it('중첩된 Bold 노드와 여러 paragraph에서 컨텐츠 및 해당 컨텐츠의 인덱스 찾기', () => {
    /**
     *  A B C _ B O L D H E L L O
     * 0 1 2 3 4 5 6 7 8 9 10 11 12 13
     *  D E F
     * 14 15 16 17
     */
    const BOLD_TEXT = 'BOLD',
      FIRST_PARAGRAPH_TEXT = 'ABC_',
      FIRST_PARAGRAPH_LATER_TEXT = 'HELLO',
      SECOND_PARAGRAPH_TEXT = 'DEF';

    const bold = new TSENode('bold', {}, [BOLD_TEXT]);
    const paragraph1 = new TSENode('paragraph', {}, [
      FIRST_PARAGRAPH_TEXT,
      bold,
      FIRST_PARAGRAPH_LATER_TEXT,
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
    const result = state.getSiblingContentFrom(
      3, //C 뒤편의 offset
      3 // C 뒤편의 offset
    );
    const expectedBoldNode = result[1] as TSENode;
    expect(result[0]).toEqual(FIRST_PARAGRAPH_TEXT);
    expect(expectedBoldNode.content).toEqual([BOLD_TEXT]);
    expect(result[2]).toEqual(FIRST_PARAGRAPH_LATER_TEXT);
  });
});

describe('EditorState > getParagraphIdxFrom', () => {
  it('중첩된 Bold 노드와 여러 paragraph에서 컨텐츠 및 해당 컨텐츠의 인덱스 찾기', () => {
    /**
     *  A B C _ B O L D H E L L O
     * 0 1 2 3 4 5 6 7 8 9 10 11 12 13
     *  D E F
     * 14 15 16 17
     */
    const BOLD_TEXT = 'BOLD',
      FIRST_PARAGRAPH_TEXT = 'ABC_',
      FIRST_PARAGRAPH_LATER_TEXT = 'HELLO',
      SECOND_PARAGRAPH_TEXT = 'DEF';

    const bold = new TSENode('bold', {}, [BOLD_TEXT]);
    const paragraph1 = new TSENode('paragraph', {}, [
      FIRST_PARAGRAPH_TEXT,
      bold,
      FIRST_PARAGRAPH_LATER_TEXT,
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
    const firstParagraphIdx = state.getParagraphIdxFrom(
      3, //C 뒤편의 offset
      3 // C 뒤편의 offset
    );

    expect(firstParagraphIdx).toEqual(0);

    const firstParagraphIdx2 = state.getParagraphIdxFrom(
      5, //C 뒤편의 offset
      5 // C 뒤편의 offset
    );

    expect(firstParagraphIdx2).toEqual(0);

    const secondParagraphIdx = state.getParagraphIdxFrom(
      14, //C 뒤편의 offset
      14 // C 뒤편의 offset
    );

    expect(secondParagraphIdx).toEqual(1);

    const secondParagraphIdx2 = state.getParagraphIdxFrom(
      17, //C 뒤편의 offset
      17 // C 뒤편의 offset
    );

    expect(secondParagraphIdx2).toEqual(1);
  });
});

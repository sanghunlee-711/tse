import { describe, expect, it } from 'vitest';
import TSENode from '../TSENode';
import { OFFSET_DELIMITER } from '@src/constants/delimiter';

describe('TSENode recalculateOffsets 테스트', () => {
  it('단순한 paragraph 노드의 오프셋 계산', () => {
    const paragraph = new TSENode('paragraph', {}, ['안녕하세요, 세상!']);
    paragraph.recalculateOffsets();
    expect(paragraph.startOffset).toBe(0);
    expect(paragraph.endOffset).toBe(10); // "안녕하세요, 세상!"의 길이 // 문단이 하나 이므로 delimiter미 적용
  });

  it('paragraph 내부에 Bold 노드가 포함된 경우', () => {
    const BOLD_TEXT = '굵은 텍스트';
    const [NORMAL_START_TEXT, NORMAL_END_TEXT] = ['일반 ', ' 텍스트'];
    const bold = new TSENode('bold', {}, [BOLD_TEXT]);
    const paragraph = new TSENode('paragraph', {}, [
      NORMAL_START_TEXT,
      bold,
      NORMAL_END_TEXT,
    ]);
    const TOTAL_LEN =
      NORMAL_START_TEXT.length + BOLD_TEXT.length + NORMAL_END_TEXT.length;

    paragraph.recalculateOffsets();

    expect(paragraph.startOffset).toBe(0);
    expect(paragraph.endOffset).toBe(TOTAL_LEN); // 전체 길이 ("일반 " + "굵은 텍스트" + " 텍스트")
    expect(bold.startOffset).toBe(NORMAL_START_TEXT.length);
    expect(bold.endOffset).toBe(NORMAL_START_TEXT.length + BOLD_TEXT.length); // "굵은 텍스트"의 길이
  });

  it('paragraph 노드 사이의 OFFSET_DELIMITER 적용', () => {
    const FIRST_PARAGRAPH_TEXT = '첫 번째 문단입니다.',
      SECOND_PARAGRAPH_TEXT = '두 번째 문단입니다.';

    const paragraph1 = new TSENode('paragraph', {}, [FIRST_PARAGRAPH_TEXT]);
    const paragraph2 = new TSENode('paragraph', {}, [SECOND_PARAGRAPH_TEXT]);

    const root = new TSENode('doc', {}, [paragraph1, paragraph2]);
    root.recalculateOffsets();

    expect(paragraph1.startOffset).toBe(0);
    expect(paragraph1.endOffset).toBe(FIRST_PARAGRAPH_TEXT.length); // "첫 번째 문단입니다."
    expect(paragraph2.startOffset).toBe(
      FIRST_PARAGRAPH_TEXT.length + OFFSET_DELIMITER
    ); // OFFSET_DELIMITER 추가
    expect(paragraph2.endOffset).toBe(
      FIRST_PARAGRAPH_TEXT.length +
        OFFSET_DELIMITER +
        SECOND_PARAGRAPH_TEXT.length
    ); // "두 번째 문단입니다."
    // expect(root.endOffset).toBe(22); // 마지막 OFFSET_DELIMITER 포함
  });

  it('중첩된 Bold 노드와 여러 paragraph의 OFFSET_DELIMITER 계산', () => {
    const BOLD_TEXT = '굵은 텍스트',
      FIRST_PARAGRAPH_TEXT = ' 일반 텍스트',
      SECOND_PARAGRAPH_TEXT = '새로운 문단';

    const bold = new TSENode('paragraph', {}, [
      new TSENode('bold', {}, [BOLD_TEXT]),
    ]);
    const paragraph1 = new TSENode('paragraph', {}, [
      bold,
      FIRST_PARAGRAPH_TEXT,
    ]);
    const paragraph2 = new TSENode('paragraph', {}, [SECOND_PARAGRAPH_TEXT]);
    const root = new TSENode('doc', {}, [paragraph1, paragraph2]);
    root.recalculateOffsets();

    expect(paragraph1.startOffset).toBe(0);
    expect(paragraph1.endOffset).toBe(
      BOLD_TEXT.length + OFFSET_DELIMITER + FIRST_PARAGRAPH_TEXT.length
    ); // "굵은 텍스트" + " 일반 텍스트"
    expect(paragraph2.startOffset).toBe(15); // OFFSET_DELIMITER 추가
    expect(paragraph2.endOffset).toBe(19); // "새로운 문단"
    expect(root.endOffset).toBe(20); // 마지막 OFFSET_DELIMITER 포함
  });
});

import { describe, it, expect, beforeEach } from 'vitest';
import { calculateAbsoluteOffsetFromDOM } from '../offset';
import { ROOT_NODE_NAME } from '@src/constants/node';

describe('calculateAbsoluteOffsetFromDOM 함수 테스트', () => {
  const OFFSET_DELIMITER = 1;

  beforeEach(() => {
    // 각 테스트 실행 전에 DOM 초기화
    //각 노드별 offset이 7로 판단됨.
    document.body.innerHTML = `
      <div id="${ROOT_NODE_NAME}">
        <div>첫 번째 노드</div> 
        <div>두 번째 노드</div>
        <div>
          <span>중첩된 노드</span>
        </div>
      </div>
    `;
  });

  it('단순 노드의 절대 오프셋을 계산할 수 있어야 한다', () => {
    const root = document.getElementById(ROOT_NODE_NAME);
    const firstNode = root?.firstChild as Node;
    const result = calculateAbsoluteOffsetFromDOM(firstNode, 7);
    const expectedOffset = 7;

    expect(result).toBe(expectedOffset);
  });

  it('형제 노드의 절대 오프셋을 계산할 수 있어야 한다', () => {
    const root = document.getElementById(ROOT_NODE_NAME);
    const secondNode = root?.childNodes[1] as Node;
    const result = calculateAbsoluteOffsetFromDOM(secondNode, 3);
    const firstNodeLength = root?.childNodes[0].textContent?.length || 0;
    const expectedOffset = firstNodeLength + OFFSET_DELIMITER + 3;

    expect(result).toBe(expectedOffset);
  });

  it('중첩된 노드의 절대 오프셋을 계산할 수 있어야 한다', () => {
    const root = document.getElementById(ROOT_NODE_NAME);
    const nestedNode = root?.childNodes[2].firstChild?.firstChild as Node;

    const result = calculateAbsoluteOffsetFromDOM(nestedNode, 7);

    // 각 노드의 textContent 길이를 정확히 계산
    const firstNodeLength = root?.childNodes[0].textContent?.length || 0;
    const secondNodeLength =
      (root?.childNodes[1] as HTMLElement).textContent?.length || 0;

    const expectedOffset =
      firstNodeLength +
      OFFSET_DELIMITER +
      secondNodeLength +
      OFFSET_DELIMITER +
      7;

    console.log('First Node Length:', firstNodeLength);
    console.log('Second Node Length:', secondNodeLength);
    console.log('Result:', result);
    console.log('Expected Offset:', expectedOffset);

    expect(result).toBe(expectedOffset);
  });

  it('루트 노드이고 오프셋이 0인 경우 0을 반환해야 한다', () => {
    document.body.innerHTML = `<div id="${ROOT_NODE_NAME}"></div>`;
    const root = document.getElementById(ROOT_NODE_NAME) as Node;

    const result = calculateAbsoluteOffsetFromDOM(root, 0);
    expect(result).toBe(0);
  });

  it('빈 노드를 추가해도 절대 오프셋이 변하지 않아야 한다', () => {
    const root = document.getElementById(ROOT_NODE_NAME);
    const initialOffset = calculateAbsoluteOffsetFromDOM(root as Node, 0);
    const emptyNode = document.createElement('div');

    root?.appendChild(emptyNode);

    const afterOffset = calculateAbsoluteOffsetFromDOM(root as Node, 0);

    expect(initialOffset).toBe(afterOffset);
  });
});

import { describe, it, expect, beforeEach } from 'vitest';
import { calculateAbsoluteOffsetFromDOM } from '../offset';
import { ROOT_NODE_NAME } from '@src/constants/node';
import TSENode from '@src/class/TSENode';

describe.skip('calculateAbsoluteOffsetFromDOM 함수 테스트', () => {
  const OFFSET_DELIMITER = 1;

  beforeEach(() => {
    /**
     * @description
     * 테스트 진행 전 미리 노드 세팅
     * 첫번째 노드 offset 7
     * 두번째 노드 offset 7
     * 세번째 부모 노드 offset 12
     * 세번째 자식 노드
     */
    document.body.innerHTML = `
      <div id="${ROOT_NODE_NAME}">
        <p>첫 번째 노드</p> 
        <p>두 번째 노드</p>
        <p>
          세번째 <b>중첩된 노드</b> 노드
        </p>
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

  it('중첩된 노드인 경우, 절대 오프셋을 계산할 수 있어야 한다', () => {
    const root = document.getElementById(ROOT_NODE_NAME);
    const nestedNode = root?.childNodes[2] as Node;
    console.log({ nestedNode });
    // 각 노드의 textContent 길이를 정확히 계산
    const firstNodeLength = root?.childNodes[0].textContent?.length || 0;
    const secondNodeLength =
      (root?.childNodes[1] as HTMLElement).textContent?.length || 0;

    const result = calculateAbsoluteOffsetFromDOM(
      nestedNode,
      firstNodeLength + OFFSET_DELIMITER + secondNodeLength + OFFSET_DELIMITER
    );

    const expectedOffset =
      firstNodeLength +
      OFFSET_DELIMITER +
      secondNodeLength +
      OFFSET_DELIMITER +
      12;

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

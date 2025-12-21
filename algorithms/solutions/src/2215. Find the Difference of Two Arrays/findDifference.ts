type FindDifference = (nums1: number[], nums2: number[]) => number[][];

/**
 * Accepted
 */
export const findDifference: FindDifference = (nums1, nums2) => {
  // 根據 nums1 和 nums2 建立集合 Set
  const set1 = new Set(nums1);
  const set2 = new Set(nums2);

  // 找出集合 set1 中不在集合 set2 的不同元素，再轉成陣列
  const diff1 = [...set1.difference(set2)];

  // 找出集合 set2 中不在集合 set1 的不同元素，再轉成陣列
  const diff2 = [...set2.difference(set1)];

  // 回傳結果
  return [diff1, diff2];
};

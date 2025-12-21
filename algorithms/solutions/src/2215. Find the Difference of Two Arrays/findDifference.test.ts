import { assertEquals } from '@std/assert';

import { findDifference } from './findDifference.ts';

Deno.test('findDifference', () => {
  assertEquals(findDifference([1, 2, 3], [2, 4, 6]), [
    [1, 3],
    [4, 6],
  ]);

  assertEquals(findDifference([1, 2, 3, 3], [1, 1, 2, 2]), [[3], []]);
});

export default (text: string, chunkSize = 800, chunkOverlap = 80) => {
  const chunks = [];

  let start = 0;

  while (start < text.length) {
    // 取出目前的 chunk
    const chunk = text.slice(start, start + chunkSize);

    // 存儲切分的文檔片段
    chunks.push(chunk);

    // 更新起點（考慮重疊部分）
    start += chunkSize - chunkOverlap;
  }

  return chunks;
};

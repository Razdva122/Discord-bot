export type TTableOptions = {
  title?: string
  tableTitle: true
  markdown?: string
  data: Array<{
    rowTitle: string
    length?: number
  }>
} | {
  title?: string
  tableTitle: false
  markdown?: string
  data: Array<{
    length?: number
  }>
}

function getMaxLengthInArray(array: string[]): number {
  return array.reduce((acc, item) => acc < item.length ? item.length : acc, 0);
}

function normalizeString(inp: string, len: number): string {
  let res = inp;
  if (res.length < len) {
    res = res + ' '.repeat(len - res.length);
  }
  if (res.length > len) {
    res = res.slice(0, len - 3) + '...';
  }
  return res;
}

export function generateTable(data: Array<Array<string | number>>, options: TTableOptions): string {
  const dataNormalized = data.map((el) => el.map((item) => String(item)));
  const columnSizes = (options.data as ({ length?: number })[]).map((column, index) => column.length || getMaxLengthInArray(dataNormalized[index]));
  let result = '';

  if (options.title) {
    result += options.title + '\n';
    result += '-'.repeat(columnSizes.length + columnSizes.reduce((acc, item) => acc + item, 0) - 1) + '\n';
  }

  if (options.tableTitle) {
    const title: string[] = [];
    const divider: string[] = [];
    columnSizes.forEach((size, index) => {
      title.push(normalizeString(options.data[index].rowTitle, size));
      divider.push('-'.repeat(size));
    });
    result += title.join('|') + '\n';
    result += divider.join('|') + '\n';
  }

  const rows: string[][] = new Array(dataNormalized[0].length).fill(null).map((el) => []);
  dataNormalized.forEach((column, index) => {
    column.forEach((text, colIndex) => {
      rows[colIndex][index] = normalizeString(text, columnSizes[index]);
    });
  });

  rows.forEach((row) => {
    result += row.join('|') + '\n';
  })

  return '```' + (options.markdown ? options.markdown : '') + '\n' + result + '```';
}

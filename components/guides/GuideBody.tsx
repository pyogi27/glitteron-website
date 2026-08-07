import type { GuideBlock } from '@/lib/data/guides'

/**
 * Renders a guide's content blocks.
 *
 * Tables are real <table> markup rather than styled divs: the numbers in these
 * guides are the reason the pages exist, and a table is what both a screen
 * reader and an answer engine can read the relationships out of.
 */
export default function GuideBody({ blocks }: { blocks: GuideBlock[] }) {
  return (
    <>
      {blocks.map((block, i) => {
        if (block.type === 'p') {
          return <p key={i}>{block.text}</p>
        }

        if (block.type === 'list') {
          return (
            <ul key={i} className="flex flex-col gap-3 pl-5 list-disc marker:text-[#A8552C]">
              {block.items.map(item => (
                <li key={item} className="pl-1.5">
                  {item}
                </li>
              ))}
            </ul>
          )
        }

        if (block.type === 'note') {
          return (
            <aside
              key={i}
              className="border-l-2 border-[#A8552C] bg-[#E6E0D6] rounded-r-xl px-5 py-4 text-[15px] leading-[1.7]"
            >
              {block.text}
            </aside>
          )
        }

        return (
          // Narrow screens scroll the table rather than the page.
          <figure key={i} className="my-1 -mx-6 sm:mx-0 overflow-x-auto">
            <table className="w-full min-w-[420px] border-collapse text-[14.5px] px-6 sm:px-0">
              {block.caption && (
                <caption className="text-left text-[10px] font-medium tracking-[0.16em] uppercase text-[#5C5449] pb-3 px-6 sm:px-0">
                  {block.caption}
                </caption>
              )}
              <thead>
                <tr>
                  {block.head.map(h => (
                    <th
                      key={h}
                      scope="col"
                      className="text-left font-medium text-[#2C2825] border-b border-[#C9C0B2] py-2.5 pr-5 first:pl-6 sm:first:pl-0"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map(row => (
                  <tr key={row.join('|')} className="align-top">
                    {row.map((cell, ci) => (
                      <td
                        key={ci}
                        className={`border-b border-[#D8D0C4] py-2.5 pr-5 first:pl-6 sm:first:pl-0 leading-[1.6] ${
                          ci === 0 ? 'text-[#2C2825]' : 'text-[#5C5449]'
                        }`}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </figure>
        )
      })}
    </>
  )
}

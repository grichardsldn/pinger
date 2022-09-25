
export type Type = 'NORMAL' | 'BIG'

export type Message = {
  msg: string,
  row: number,
  col?: number,
  len?: number,
  style?: Type,
  colour?: string,
}

export const postMessage = async (id: string, msg: Message, address: string): Promise<boolean> => {
  const cmd = `${address}/id/${id}?` + new URLSearchParams(msg as any)
  console.log(cmd)
  await fetch(cmd)
  return true
}

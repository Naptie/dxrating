import type { Env } from './index.js'
import type { ILuoXueResponse } from './types/luoxue.js'
import { getEnv } from './env.js'

// Fetch player data from LuoXue API
export async function getLuoxueData(friendCode: string): Promise<string | ILuoXueResponse> {
  try {
    const env = getEnv()
    const res = await fetch(
      `https://maimai.lxns.net/api/v0/maimai/player/${friendCode}/bests`,
      {
        method: 'GET',
        headers: {
          Authorization: (env as Env).LUOXUE_API_KEY,
        },
      },
    )

    const data: any = await res.json()
    return res.status === 200 ? data : data.message
  }
  catch (e) {
    return (e as Error).message
  }
}

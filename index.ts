import * as child from 'child_process';

type PingSuccess = {
  sent: number,
  received: number,
  min: number,
  max: number,
}
type PingError = {
  error: string
}

type PingResult = {
  success?: PingSuccess,
  error?: PingError,
  host: string,
}

const ping = async (host: string): Promise<PingResult> => {
  const pingCmd = `ping -q -c 10 ${host}`
 
  return new Promise( (res, rej) => {
    child.exec(pingCmd, (err, stdout, stderr) => {
      if (err) {
        res({ host, error: {error: err.message.split('\n')?.[1]}})
        return;
      }

      const lines = stdout.split('\n')
      const packetsRegex = /^(?<tx>[0-9]*) packets transmitted, (?<rx>[0-9]*) packets received.*$/
      const packetsMatch = lines.map(l => l.match(packetsRegex)?.groups).find(m => !!m)
      const timesRegex = /^round-trip min\/avg\/max\/stddev = (?<min>[\.|0-9]*)\/(?<avg>[\.|0-9]*)\/(?<max>[\.|0-9]*)\/(?<stddev>[\.|0-9]*) ms$/
      const timesMatch = lines.map(l => l.match(timesRegex)?.groups).find(m => !!m)

      if (!packetsMatch || !timesMatch) {
        res({ host, error: {error: 'could not parse ping output'}})
      } else {
        res({ host, success: { 
          sent: parseFloat(packetsMatch.tx), 
          received: parseFloat(packetsMatch.rx),
          min: parseFloat(timesMatch.min),
          max: parseFloat(timesMatch.max), 
        }})
      }
    });
  })
}

ping('www.google.com').then((res)=> {console.log(JSON.stringify(res, null, 2))})



import * as child from 'child_process';
import * as VC100 from './vc100client';

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

// 10 packets transmitted, 10 received, 0% packet loss, time 9013ms
// rtt min/avg/max/mdev = 6.315/6.663/7.553/0.362 ms

      const lines = stdout.split('\n')
      const packetsRegex = /^(?<tx>[0-9]*) packets transmitted, (?<rx>[0-9]*) received.*$/
      const packetsMatch = lines.map(l => l.match(packetsRegex)?.groups).find(m => !!m)
      const timesRegex = /^rtt min\/avg\/max\/mdev = (?<min>[\.|0-9]*)\/(?<avg>[\.|0-9]*)\/(?<max>[\.|0-9]*)\/(?<stddev>[\.|0-9]*) ms$/
      const timesMatch = lines.map(l => l.match(timesRegex)?.groups).find(m => !!m)

      if (!packetsMatch || !timesMatch) {
	console.log({GDR: '', packetsMatch, timesMatch})
	console.log(stdout)
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

const main = async () => {
  const pingData = await ping('www.google.com')
  console.log(JSON.stringify(pingData, null, 2))
  const row = 1;
  const address = 'http://starbug1.local:1664'

  if (!!pingData.error) {
    await VC100.postMessage('ping', {
      row,
      len: 80,
      msg: pingData.error.error,
      colour: 'red',
      style: 'NORMAL',
    }, address)
  }
  let warn=false
  if (!!pingData.success) {
    const data = pingData.success
    if (data.received !== data.sent) {
      warn = true;
    }
    const jitter = data.max - data.min
    if (jitter > (data.min * 2) {
      warn=true;
    }

    if (data.max > 25) {
      warn=true;
    }
   
    const times = `${Math.floor(data.min)}-${Math.floor(data.max)}ms `
    const packets = `${data.received}/${data.sent} `
    const colour = warn ? {colour: 'red' } : {}
    await VC100.postMessage('ping', {
      row,
      len: 80,
      msg: `${pingData.host} ${warn?packets:''} ${times}`,
      style: 'NORMAL',
      ...colour
    }, address)
  }

  console.log(JSON.stringify(pingData, null, 2))
}

main().then((result)=> {
})

export {};


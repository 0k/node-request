import http from 'http'
import https from 'https'

import { t, e } from '@0k.io/types-request'

const requesters: any = { http, https }


const httpRequest = (opts: t.coreHttpOpts) => {
    const httpsOpts = {
        host: opts.host,
        path: opts.path,
        method: opts.method,
        ...(opts.headers && { headers: opts.headers }),
        ...(opts.port && { port: opts.port }),
    }
    const requester = requesters[opts.protocol]
    if (!requester) {
        throw new Error(
            `Protocol ${opts.protocol} unsupported by this implementation`
        )
    }
    return new Promise((resolve, reject) => {
        let req = requester.request(httpsOpts, (res: any) => {
            const { statusCode } = res
            let rawData = ''

            res.on('data', (chunk: any) => {
                rawData += chunk
            })
            res.on('end', () => {
                if (!statusCode || statusCode.toString().slice(0, 1) !== '2') {
                    res.resume()
                    reject(
                        new e.HttpError(
                            statusCode,
                            res.statusMessage,
                            rawData,
                            res
                        )
                    )
                    return
                } else {
                    if (opts.responseHeaders) {
                        for (const header in res.headers) {
                            opts.responseHeaders[header] = res.headers[header]
                        }
                    }
                    resolve(rawData)
                }
            })
        })

        if (opts.data) {
            if (typeof opts.data !== 'string')
                opts.data = JSON.stringify(opts.data)
            req.write(opts.data)
        }
        req.end()

        req.on('error', (err: any) => {
            console.error(
                `Encountered an error trying to make a request: ${err.message}`
            )
            reject(new e.RequestFailed(err.message))
        })
    })
}


export { httpRequest, e, t }

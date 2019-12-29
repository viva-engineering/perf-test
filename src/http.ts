
import { request as httpRequest, RequestOptions, IncomingMessage } from 'http';
import { request as httpsRequest } from 'https';
import { HRTime, msDiff } from './utils';

export interface HttpRequestOptions {
	ssl?: boolean;
	host: string;
	port?: number;
	path: string;
	method: string;
	headers?: Headers;
	body?: string | Buffer;
}

export interface Headers {
	[header: string]: string | string[];
}

export interface Times {
	enqueued?: HRTime;
	started?: HRTime;
	dnsLookupComplete?: HRTime;
	tcpConnectionEstablished?: HRTime;
	tlsHandshakeCompleted?: HRTime;
	firstByteReceived?: HRTime;
	completed?: HRTime;
}

export interface HttpRequestResult {
	statusCode?: number;
	statusText?: string;
	body?: string;
	headers?: Headers;
	durations?: Durations;
	error?: Error & { code?: string };
}

export interface Durations {
	total: number;
	queued: number;
	dnsLookup: number;
	tcpConnection: number;
	tlsHandshake: number;
	timeToFirstByte: number;
	contentDownload: number;
}

/**
 * Makes an HTTP(S) request, and resolves with the results
 */
export const request = (opts: HttpRequestOptions) : Promise<HttpRequestResult> => {
	const times: Times = {
		enqueued: process.hrtime()
	};

	const result: HttpRequestResult = { };

	return new Promise((resolve, reject) => {
		const reqOptions: RequestOptions = {
			hostname: opts.host,
			port: opts.port || (opts.ssl ? 443 : 80),
			path: opts.path,
			method: opts.method
		};

		const makeRequest = opts.ssl ? httpsRequest : httpRequest;
		const onResponse = (res: IncomingMessage) => {
			result.statusCode = res.statusCode;
			result.statusText = res.statusMessage;

			let data: string = '';

			res.once('readable', () => times.firstByteReceived = process.hrtime());

			res.on('data', (chunk: string) => data += chunk);
			res.on('end', () => {
				times.completed = process.hrtime();
				result.body = data;
				result.headers = res.headers;
				result.durations = calculateDurations(times);

				resolve(result);
			});
		};

		const req = makeRequest(reqOptions, onResponse);

		req.on('socket', (socket) => {
			times.started = process.hrtime();

			socket.on('lookup', () => {
				times.dnsLookupComplete = process.hrtime();
			});

			socket.on('connect', () => {
				times.tcpConnectionEstablished = process.hrtime();
			});

			socket.on('secureConnect', () => {
				times.tlsHandshakeCompleted = process.hrtime();
			});
		});

		req.on('error', (error) => {
			times.completed = process.hrtime();
			result.durations = calculateDurations(times);
			result.error = error;

			resolve(result);
		});

		if (opts.headers) {
			Object.keys(opts.headers).forEach((header) => {
				req.setHeader(header, opts.headers[header]);
			});
		}
		
		if (opts.body) {
			req.write(opts.body);
		}

		req.end();
	});
};



const calculateDurations = (times: Times) : Durations => {
	return {
		total: msDiff(times.enqueued, times.completed),
		queued: msDiff(times.enqueued, times.started),
		dnsLookup: msDiff(times.started, times.dnsLookupComplete),
		tcpConnection: msDiff(times.dnsLookupComplete, times.tcpConnectionEstablished),
		tlsHandshake: msDiff(times.tcpConnectionEstablished, times.tlsHandshakeCompleted),
		timeToFirstByte: times.tlsHandshakeCompleted
			? msDiff(times.tlsHandshakeCompleted, times.firstByteReceived)
			: msDiff(times.tcpConnectionEstablished, times.firstByteReceived),
		contentDownload: msDiff(times.firstByteReceived, times.completed)
	};
};

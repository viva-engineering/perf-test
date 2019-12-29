
import { Request } from './request';
import { PhaseDefinition } from './suite';
import { request, Headers, Durations } from './http';

export interface HttpRequestOptions {
	method: string;
	ssl?: boolean;
	host: string;
	port?: number;
	path: string;
	headers?: Headers;
	body?: string | Buffer;
}

export class HttpRequest extends Request<HttpRequestOptions> {
	public readonly type = 'http';

	public statusCode: number;
	public statusText: string;
	public body: string;
	public headers: Headers;
	public durations: Durations;
	public error?: Error & { code?: string };

	public duration: number;
	public result: string | number;

	constructor(name: string, groups: string[], phase: PhaseDefinition, public readonly params: HttpRequestOptions) {
		super(name, groups, phase);
	}

	protected async run() {
		const result = await request({
			ssl: this.params.ssl,
			host: this.params.host,
			port: this.params.port,
			method: this.params.method,
			path: this.params.path,
			headers: this.params.headers,
			body: this.params.body
		});

		this.statusCode = result.statusCode;
		this.statusText = result.statusText;
		this.body = result.body;
		this.headers = result.headers;
		this.durations = result.durations;
		this.error = result.error;

		this.duration = result.durations.total;
		
		return this.error
			? this.error.code || this.error.name
			: this.statusCode;
	}
}

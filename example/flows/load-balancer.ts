
import { config } from '../config';
import { UserFlow, HttpRequest } from '../../src/index';

export class LoadBalancerFlow extends UserFlow {
	public readonly name = 'load-balancer';

	// No Setup
	protected readonly setup;

	protected async run() {
		await this.runRequest(HttpRequest, 'healthcheck', [ ], {
			method: 'GET',
			host: config.host,
			port: config.port,
			ssl: config.ssl,
			path: '/healthcheck',
		});
	}
}

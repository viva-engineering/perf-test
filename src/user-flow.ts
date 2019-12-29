
import { nowISO } from './utils';
import { PhaseDefinition } from './suite';
import { Request, RequestConstructor } from './request';
import { EventEmitter } from 'events';

export interface UserFlowConstructor<T extends UserFlow> {
	new (phase: PhaseDefinition): T;
}

let nextId = 1;

export abstract class UserFlow extends EventEmitter {
	public readonly flowId = nextId++;
	public readonly requests: Request<any>[] = [ ];

	constructor(public readonly phase: PhaseDefinition) {
		super();
	}

	/** ISO formatted timestamp representing when the flow started */
	public startTime: string;

	/** ISO formatted timestamp representing when the flow finished */
	public finishTime: string;

	public abstract readonly name: string;

	public async exec() {
		// Run the setup function if one is defined
		if (this.setup) {
			await this.setup();
		}

		// Start the clock *after* the setup runs
		this.emit('start');
		this.startTime = nowISO();

		await this.run();

		this.finishTime = nowISO();
		this.emit('finish');
	}

	protected async abstract run();
	protected async abstract setup();

	public async runRequest<P, R extends Request<P>>(Req: RequestConstructor<R, P>, name: string, groups: string[], params: P) : Promise<R> {
		const req = new Req(name, groups, this.phase, params);

		this.requests.push(req);

		await req.exec();

		this.emit('request', req);

		return req;
	}

	public on(event: 'start', callback: () => void);
	public on(event: 'finish', callback: () => void);
	public on(event: 'request', callback: (req: Request<any>) => void);
	public on(event: string, callback: (...args: any[]) => void) {
		return super.on(event, callback);
	}
}


import { nowISO } from './utils';
import { PhaseDefinition } from './suite';

export interface RequestConstructor<T extends Request<P>, P> {
	new (name: string, groups: string[], phase: PhaseDefinition, params: P) : T;
}

let nextId = 1;

export abstract class Request<T> {
	public readonly id = nextId++;
	public readonly abstract type: string;

	public startTime: string;
	public finishTime: string;

	/** Duration of the request in milliseconds */
	public abstract duration: number;

	/** The description, code, name, etc. representing the result of the request. For example,
	  * for an HTTP request, this might be the status code - or a failed request, it might be
	  * an error code. */
	public result: string | number;

	constructor(
		public readonly name: string,
		public readonly groups: string[],
		public readonly phase: PhaseDefinition
	) { }

	protected abstract async run() : Promise<string | number>;

	public async exec() {
		this.startTime = nowISO();
		this.result = await this.run();
		this.finishTime = nowISO();
	}
}

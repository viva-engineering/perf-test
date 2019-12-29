
import { randItemWeighted } from './rand';
import { sleep, nowSecond, nowISO, timeout, HRTime } from './utils';
import { UserFlow, UserFlowConstructor } from './user-flow';
import { Request } from './request';
import { Ramp } from './ramp';
import { EventEmitter } from 'events';

export interface PhaseDefinition {
	/** Descriptive name for the phase */
	name?: string;

	/** The duration in seconds that this phase should last */
	duration: number;

	/** The number of new user flows start per second during this phase */
	flowRate: number;

	/** If provided, the flow rate will ramp up or down to this number throughout the duration of the phase */
	rampTo?: number;
}

export interface FlowDefinition {
	/** The actual user flow to be run */
	flow: UserFlowConstructor<UserFlow>;

	/** The relative weight for this flow to be chosen */
	weight: number;

	/** The list of phases during which this flow will be run. Flow will run during all phases if excluded */
	phases?: string[];
}

export interface SuiteDefinition {
	/** Description name for the suite */
	name?: string;

	/** Definition of the phases to be run in the suite */
	phases: PhaseDefinition[];

	/** Definition of the flows to be used in the suite */
	flows: FlowDefinition[];

	/** Time (in ms) that the suite will wait for user flows to complete after the suite is finished */
	finishTimeout?: number;
}

export class Suite extends EventEmitter {
	protected readonly running: Set<UserFlow> = new Set();

	protected readonly flowsByFlow: Map<FlowDefinition, UserFlow[]> = new Map();
	protected readonly flowsByPhase: Map<PhaseDefinition, UserFlow[]> = new Map();

	public startTime: string;
	public finishTime: string;
	public hrStartTime: HRTime;
	public hrDuration: HRTime;

	protected started = false;
	protected finished = false;
	protected currentPhase: PhaseDefinition;
	protected onComplete: (value?: any) => void;

	constructor(public readonly definition: SuiteDefinition) {
		super();

		for (let i = 0; i < definition.flows.length; i++) {
			const flow = definition.flows[i];

			this.flowsByFlow.set(flow, [ ]);
		}
	}

	public async exec() {
		this.emit('start');

		this.startTime = nowISO();
		this.hrStartTime = process.hrtime();

		await this.run();

		this.hrDuration = process.hrtime(this.hrStartTime);
		this.finishTime = nowISO();

		this.emit('finish');
	}

	public on(event: 'start', callback: () => void);
	public on(event: 'finish', callback: () => void);
	public on(event: 'phase-start', callback: (phase: PhaseDefinition) => void);
	public on(event: 'phase-finish', callback: (phase: PhaseDefinition) => void);
	public on(event: 'flow-start', callback: (flow: UserFlow, phase: PhaseDefinition) => void);
	public on(event: 'flow-finish', callback: (flow: UserFlow, phase: PhaseDefinition) => void);
	public on(event: 'request', callback: (req: Request<any>) => void);
	public on(event: string, callback: (...args: any[]) => void) {
		return super.on(event, callback);
	}

	protected async run() {
		this.started = true;
		this.finished = false;

		const promise = new Promise((resolve) => {
			this.onComplete = resolve;
		});

		for (let i = 0; i < this.definition.phases.length; i++) {
			const phase = this.definition.phases[i];

			if (! phase.name) {
				phase.name = `Phase ${i}`;
			}

			this.flowsByPhase.set(phase, [ ]);

			await this.runPhase(phase);

			this.currentPhase = null;
		}

		this.finished = true;

		// Wait for any outstanding requests to finish
		if (this.running.size) {
			try {
				await timeout(this.definition.finishTimeout || 10000, promise);
			}

			catch (error) {
				console.warn(`Timed out waiting for ${this.running.size} user flows to complete`);
			}
		}
	}

	protected async runPhase(phase: PhaseDefinition) {
		this.currentPhase = phase;

		this.emit('phase-start', phase);

		// The list of flows that can run during this phase
		const flows = this.definition.flows.filter((flow) => {
			return flow.phases == null || flow.phases.includes(phase.name);
		});

		const ramp = new Ramp(phase.duration, phase.flowRate, phase.rampTo);

		let started = 0;
		let expected = 0;

		do {
			expected += ramp.countForCurrentSecond();

			while (started < (expected | 0)) {
				this.startNewUserFlow(phase, flows);
				started++;
			}

			await sleep(100);
		}
		while (! ramp.finished);

		this.emit('phase-finish', phase);
	}

	protected startNewUserFlow(phase: PhaseDefinition, flows: FlowDefinition[]) {
		return this.runUserFlow(phase, randItemWeighted(flows));
	}

	protected async runUserFlow(phase: PhaseDefinition, definition: FlowDefinition) {
		const flow = new definition.flow(phase);

		this.running.add(flow);
		this.flowsByFlow.get(definition).push(flow);
		this.flowsByPhase.get(phase).push(flow);

		flow.on('start', () => this.emit('flow-start', flow));
		flow.on('finish', () => this.emit('flow-finish', flow));

		flow.on('request', (req) => {
			this.emit('request', req);
		});

		await flow.exec();

		this.running.delete(flow);

		// If this was the last outstanding request, resolve the suite promise
		if (this.finished && this.running.size === 0) {
			this.onComplete();
		}
	}
}

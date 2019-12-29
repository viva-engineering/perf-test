
import { Request } from '../request';
import { UserFlow } from '../user-flow';
import { Suite, PhaseDefinition } from '../suite';

export interface Output {
	onCycle?(): void;
	onSuiteStart?(): void;
	onSuiteFinish?(): void;
	onPhaseStart?(phase: PhaseDefinition): void;
	onPhaseFinish?(phase: PhaseDefinition): void;
	onFlowStart?(flow: UserFlow, phase: PhaseDefinition): void;
	onFlowFinish?(flow: UserFlow, phase: PhaseDefinition): void;
	onRequest?(request: Request<any>): void;
}

export abstract class Output {
	constructor(
		protected readonly suite: Suite
	) { }

	protected init() {
		if (this.onSuiteStart) {
			this.suite.on('start', this.onSuiteStart);
		}
		
		if (this.onSuiteFinish) {
			this.suite.on('finish', this.onSuiteFinish);
		}
		
		if (this.onPhaseStart) {
			this.suite.on('phase-start', this.onPhaseStart);
		}
		
		if (this.onPhaseFinish) {
			this.suite.on('phase-finish', this.onPhaseFinish);
		}
		
		if (this.onFlowStart) {
			this.suite.on('flow-start', this.onFlowStart);
		}
		
		if (this.onFlowFinish) {
			this.suite.on('flow-finish', this.onFlowFinish);
		}
		
		if (this.onRequest) {
			this.suite.on('request', this.onRequest);
		}
	}

	public abstract async flush();
}

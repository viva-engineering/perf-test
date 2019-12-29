
import { Output } from './output';
import { Request } from '../request';
import { UserFlow } from '../user-flow';
import { Suite, PhaseDefinition } from '../suite';
import { basicStats } from '../stats';
import { nowISO, formatMs, HRTime, hrDuration } from '../utils';

export class SimpleOutput extends Output {
	private cycleInterval: NodeJS.Timeout;
	private requestsForCycle: Request<any>[] = [ ];
	private requests: Request<any>[] = [ ];

	constructor(suite: Suite) {
		super(suite);
		this.init();
	}

	public flush() {
		return new Promise((resolve) => {
			process.stdout.write('', resolve);
		});
	}

	public onCycle = () => {
		const requests = this.requestsForCycle.splice(0, this.requestsForCycle.length);

		this.outputSummary(`Segment ending ${nowISO()}`, 5, requests);
	};

	public onSuiteStart = () => {
		this.cycleInterval = setInterval(this.onCycle, 5000);

		console.log(`  Starting suite ${this.suite.definition.name} (${nowISO()})`);
	};

	public onSuiteFinish = () => {
		clearInterval(this.cycleInterval);

		console.log(`  Suite ${this.suite.definition.name} finished (${nowISO()})`);

		const seconds = hrDuration(this.suite.hrDuration) / 1000;

		this.outputSummary('Suite Summary', seconds, this.requests, true);
	};

	public onPhaseStart = (phase: PhaseDefinition) => {
		console.log(`  Starting phase "${phase.name}" (duration=${phase.duration}, flowRate=${phase.flowRate}, rampTo=${phase.rampTo}) (${nowISO()})`);
	};

	public onPhaseFinish = (phase: PhaseDefinition) => {
		console.log(`  Phase "${phase.name}" finished (${nowISO()})`);
	};

	public onFlowStart = (flow: UserFlow, phase: PhaseDefinition) => {
		// 
	};

	public onFlowFinish = (flow: UserFlow, phase: PhaseDefinition) => {
		// 
	};

	public onRequest = (request: Request<any>) => {
		this.requests.push(request);
		this.requestsForCycle.push(request);
	};

	protected rollupResults(requests: Request<any>[]) {
		const results = { };

		for (let i = 0; i < requests.length; i++) {
			const result = requests[i].result;

			if (! results[result]) {
				results[result] = 1;
			}

			else {
				results[result]++;
			}
		}

		return results;
	}

	protected outputSummary(title: string, seconds: number, requests: Request<any>[], suiteDetails: boolean = false) {
		const stats = basicStats('duration', requests);
		const rps = (((requests.length / seconds) * 100) | 0) / 100;
		const results = this.rollupResults(requests);

		console.log(`  ${title}:`);

		if (suiteDetails) {
			console.log(`    start: ${this.suite.startTime}`);
			console.log(`    finish: ${this.suite.finishTime}`);
			console.log(`    requests: ${requests.length}`);
		}

		console.log(`    rps: ${rps}`);
		console.log('    duration:');
		console.log(`      min: ${formatMs(stats.min)}`);
		console.log(`      max: ${formatMs(stats.max)}`);
		console.log(`      avg: ${formatMs(stats.avg)}`);
		console.log(`      p95: ${formatMs(stats.p95)}`);
		console.log(`      p99: ${formatMs(stats.p99)}`);
		console.log('    results:');

		Object.keys(results).forEach((result) => {
			console.log(`      ${result}: ${results[result]}`);
		});

		console.log('');
	}
}

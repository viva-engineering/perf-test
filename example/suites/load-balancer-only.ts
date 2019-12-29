
import { Suite } from '../../src/index';
import { LoadBalancerFlow } from '../flows/load-balancer';

export const suite = new Suite({
	name: 'load-balancer-only',
	phases: [
		{ name: 'Ramp Up', duration: 30, flowRate: 0.2, rampTo: 10 },
		{ name: 'Sustain', duration: 30, flowRate: 10 },
		{ name: 'Ramp Down', duration: 30, flowRate: 10, rampTo: 0.2 }
	],
	flows: [
		{ flow: LoadBalancerFlow, weight: 1 }
	]
});

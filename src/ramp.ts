
import { nowSecond } from './utils';

export class Ramp {
	protected readonly isStatic: boolean;
	protected readonly startSecond: number;
	protected readonly endSecond: number;

	protected lastSecond: number;
	protected rampFinished = false;

	constructor(
		protected readonly duration: number,
		protected readonly flowRate: number,
		protected readonly rampTo?: number
	) {
		this.isStatic = (rampTo == null);
		this.startSecond = nowSecond();
		this.lastSecond = this.startSecond;
		this.endSecond = this.startSecond + duration;
	}

	public get finished() {
		return this.rampFinished;
	}

	public countForCurrentSecond() {
		if (this.rampFinished) {
			return 0;
		}

		const current = Math.min(nowSecond(), this.endSecond);

		if (current <= this.lastSecond) {
			return 0;
		}

		let count: number;

		// For static ramps (no rampTo provided, just constant flow rate)
		if (this.isStatic) {
			count = (current - this.lastSecond) * this.flowRate;
		}

		// For actual ramps
		else {
			count = 0;

			for (let i = this.lastSecond; i < current; i++) {
				const percent = (current - this.startSecond) / this.duration;

				count += (percent * (this.rampTo - this.flowRate)) + this.flowRate;
			}
		}

		this.lastSecond = current;

		if (current >= this.endSecond) {
			this.rampFinished = true;
		}

		return count;
	}
}

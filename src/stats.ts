
export type WithStat<K extends string> = {
	[key in K]: number;
}

/**
 * Calculates the average of the given data set
 */
export const average = <K extends string>(key: K, values: WithStat<K>[]) => {
	let sum = 0;

	for (let i = 0; i < values.length; i++) {
		sum += values[i][key];
	}

	return sum / values.length;
};

/**
 * Calculates the given percentile of the given data set
 */
export const percentile = <K extends string>(key: K, percent: number, values: WithStat<K>[]) => {
	const data = values
		.map((value) => value[key])
		.sort((a, b) => a - b);

	return calculatePercentile(percent, data);
};

/**
 * Calculates the min, max, average, 95th percentile, and 99th percentile of the given data set
 */
export const basicStats = <K extends string>(key: K, objects: WithStat<K>[]) => {
	if (! objects.length) {
		return { min: NaN, max: NaN, avg: NaN, p95: NaN, p99: NaN };
	}

	let min: number = Infinity;
	let max: number = -Infinity;
	let sum: number = 0;

	const values: number[] = [ ];

	for (let i = 0; i < objects.length; i++) {
		const value = objects[i][key];

		values.push(value);

		if (min > value) {
			min = value;
		}

		if (max < value) {
			max = value;
		}

		sum += value;
	}

	values.sort((a, b) => a - b);

	return {
		min,
		max,
		avg: sum / values.length,
		p95: calculatePercentile(0.95, values),
		p99: calculatePercentile(0.99, values)
	};
};

const calculatePercentile = (percent: number, values: number[]) => {
	const index = (percent * values.length) - 1;
	const indexInt = index | 0;

	if (index === indexInt) {
		return values[index];
	}

	const fraction = index - indexInt;

	return ((1 - fraction) * values[indexInt]) + (fraction * values[indexInt + 1]);
};

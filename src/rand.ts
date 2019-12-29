
/**
 * Generates a pseudo-random double between 0 and 1
 */
export const rand = () => Math.random();

/**
 * Generates a pseudo-random integer between `min` and `max`
 */
export const randInt = (min: number, max: number) => {
	return ((rand() * (max - min)) + min) | 0;
};

/**
 * Chooses a random item from the given list
 */
export const randItem = <T>(items: T[]) => {
	const index = randInt(0, items.length);
};

export interface Weighted {
	weight: number;
}

/**
 * Chooses a random item from a weighted list of options
 */
export const randItemWeighted = <T extends Weighted>(items: T[]) => {
	let total: number;

	for (let i = 0; i < items.length; i++) {
		total += items[i].weight;
	}

	let index: number;
	let value = randInt(0, total);

	for (index = 0; index < items.length; index++) {
		value -= items[index].weight;

		if (value <= 0) {
			break;
		}
	}

	return items[index];
};

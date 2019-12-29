
export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const nowSecond = () => (Date.now() / 1000) | 0;

export const nowISO = () => (new Date).toISOString();

export type HRTime = [ number, number ];

export const hrDuration = (duration: HRTime) : number => {
	return (((duration[0] + duration[1] / 1e9) * 1e6) | 0) / 1e3;
};

/**
 * Calculates the difference in milliseconds (with microsecond precision)
 * between two high resolution timestamps
 */
export const msDiff = (start: HRTime, end: HRTime) : number => {
	if (start == null || end == null) {
		return 0;
	}

	const secondDiff = end[0] - start[0];
	const nanosecondDiff = end[1] - start[1];

	return (((secondDiff + nanosecondDiff / 1e9) * 1e6) | 0) / 1e3;
};

export const timeout = <T>(ms: number, promise: Promise<any>) : Promise<T> => {
	return new Promise((resolve, reject) => {
		let fulfilled = false;

		const onTimeout = () => {
			if (! fulfilled) {
				fulfilled = true;
				reject(new Error('Timed out waiting for promise to fulfill'));
			}
		};

		const onResolve = (result: T) => {
			if (! fulfilled) {
				fulfilled = true;
				resolve(result);
			}
		};

		const onReject = (error: any) => {
			if (! fulfilled) {
				fulfilled = true;
				reject(error);
			}
		};

		setTimeout(onTimeout, ms);
		promise.then(onResolve, onReject);
	});
};

const oneMinute = 60;
const oneHour = 60 * 60;

export const formatMs = (ms: number) => {
	const wholeSeconds = (ms / 1000) | 0;
	const milliseconds = `${(ms - (wholeSeconds * 1000)).toPrecision(6)}ms`;

	if (wholeSeconds < 1) {
		return milliseconds;
	}

	if (wholeSeconds < oneMinute) {
		return `${wholeSeconds}sec ${milliseconds}`;
	}

	if (wholeSeconds < oneHour) {
		const minutes = Math.floor(wholeSeconds / oneMinute);
		const remainingSeconds = wholeSeconds % oneMinute;

		return `${minutes}min ${remainingSeconds}sec ${milliseconds}`;
	}

	const hours = Math.floor(wholeSeconds / oneHour);
	const remainingMinutes = Math.floor(wholeSeconds % oneHour / oneMinute);
	const remainingSeconds = Math.floor(wholeSeconds % oneHour % oneMinute);

	return `${hours}hr ${remainingMinutes}min ${remainingSeconds}sec ${milliseconds}`;
};

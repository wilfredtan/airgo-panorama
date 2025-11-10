// Retry utility for fetch requests
export const fetchWithTimeout = async (
	url: string,
	options: RequestInit, // eslint-disable-line no-undef
	retryCount: number = 3
): Promise<Response> => { // eslint-disable-line no-undef
	for (let attempt = 0; attempt <= retryCount; attempt++) {
		try {
			const response = await fetch(url, options); // eslint-disable-line no-undef
			return response;
		} catch (error) {
			// If this is the last attempt, throw the error
			if (attempt === retryCount) {
				throw error;
			}

			// Wait 1 second before retrying
			await new Promise(resolve => setTimeout(resolve, 1000)); // eslint-disable-line no-undef
		}
	}

	// This should never be reached, but TypeScript requires it
	throw new Error('Unexpected error in fetchWithTimeout');
};

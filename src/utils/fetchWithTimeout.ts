// Utility for fetch requests with exponential backoff
export const fetchWithTimeout = async (
	url: string,
	options: RequestInit, // eslint-disable-line no-undef
	retryCount: number = 2
): Promise<Response> => { // eslint-disable-line no-undef
	for (let attempt = 0; attempt <= retryCount; attempt++) {
		try {
			const response = await fetch(url, options); // eslint-disable-line no-undef

			// Retry on HTTP error status codes (300+)
			if (response.status >= 300) {
				if (attempt === retryCount) {
					return response; // Return the error response on last attempt
				}

				// Exponential backoff: 1s, 2s, 4s, 8s, etc.
				const delayMs = Math.pow(2, attempt) * 1000;
				await new Promise(resolve => setTimeout(resolve, delayMs)); // eslint-disable-line no-undef
				continue;
			}

			return response;
		} catch (error) {
			// If this is the last attempt, throw the error
			if (attempt === retryCount) {
				throw error;
			}

			// Exponential backoff: 1s, 2s, 4s, 8s, etc.
			const delayMs = Math.pow(2, attempt) * 1000;
			await new Promise(resolve => setTimeout(resolve, delayMs)); // eslint-disable-line no-undef
		}
	}

	// This should never be reached, but TypeScript requires it
	throw new Error('Unexpected error in fetchWithTimeout');
};

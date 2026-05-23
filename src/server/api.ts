import type { GameConfig } from '../shared/config';
import type { ServerResponse } from '../shared/types';

import { getSimulatedResponse } from './mocked-server';

export const getResponseData = async (config: GameConfig): Promise<ServerResponse> => {
  // Tiny response delay (why not)
  await new Promise((resolve) => setTimeout(resolve, 300));

  const response = getSimulatedResponse(config);
  if (response.status !== 200) {
    throw new Error(`Server returned status: ${response.status}`);
  }

  const data = JSON.parse(response.data);

  if (
    typeof data === 'object' &&
    data !== null &&
    Array.isArray(data.reelPositions) &&
    typeof data.prize === 'number'
  ) {
    return data as ServerResponse;
  }

  throw new Error('Invalid server response structure');
};

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface OperationHorsLigne {
  id: string;
  createdAt: string;
  method: 'post' | 'put';
  url: string;
  data: Record<string, unknown>;
}

const CLE_QUEUE = 'cnts_queue_operations';

export async function ajouterOperationHorsLigne(
  operation: Omit<OperationHorsLigne, 'id' | 'createdAt'>,
): Promise<void> {
  const queue = await lireQueue();
  queue.push({
    ...operation,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  });
  await AsyncStorage.setItem(CLE_QUEUE, JSON.stringify(queue));
}

export async function lireQueue(): Promise<OperationHorsLigne[]> {
  const brut = await AsyncStorage.getItem(CLE_QUEUE);
  return brut ? (JSON.parse(brut) as OperationHorsLigne[]) : [];
}

export async function retirerOperation(id: string): Promise<void> {
  const queue = await lireQueue();
  await AsyncStorage.setItem(
    CLE_QUEUE,
    JSON.stringify(queue.filter((op) => op.id !== id)),
  );
}

export async function viderQueue(): Promise<void> {
  await AsyncStorage.removeItem(CLE_QUEUE);
}

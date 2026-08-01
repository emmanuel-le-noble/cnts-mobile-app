import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

export function suivreConnexion(
  onEstConnecte: (connecte: boolean) => void,
): () => void {
  const abonnement = NetInfo.addEventListener((etat: NetInfoState) => {
    const connecte = !!etat.isConnected && !!etat.isInternetReachable;
    onEstConnecte(connecte);
  });
  return () => abonnement();
}

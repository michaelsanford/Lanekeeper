import { useState, useEffect } from 'react';

export function useWebPush(apiUrl?: string, authToken?: string) {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.pushManager.getSubscription().then((sub) => {
          setIsSubscribed(!!sub);
        });
      });
    }
  }, []);

  async function requestAndSubscribe(): Promise<boolean> {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      alert('Web Push is not supported in this browser environment.');
      return false;
    }

    setIsLoading(true);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm !== 'granted') {
        setIsLoading(false);
        return false;
      }

      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();

      if (!sub) {
        // VAPID application server key (or dev fallback)
        const vapidKey = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';
        const convertedVapidKey = urlBase64ToUint8Array(vapidKey);

        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey as unknown as BufferSource
        });
      }

      setIsSubscribed(true);

      // Send subscription to backend if API URL is provided
      if (apiUrl && authToken && sub) {
        await fetch(`${apiUrl}/api/v1/notifications/subscribe`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`
          },
          body: JSON.stringify({
            subscription: sub.toJSON(),
            sendTest: true
          })
        });
      }

      setIsLoading(false);
      return true;
    } catch (err) {
      console.warn('Web push subscription failed:', err);
      setIsLoading(false);
      return false;
    }
  }

  return {
    permission,
    isSubscribed,
    isLoading,
    requestAndSubscribe
  };
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

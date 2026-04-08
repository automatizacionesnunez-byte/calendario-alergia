self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const options = {
    body: data.body || 'Es hora de registrar tus síntomas en HealthLog.',
    icon: '/icon-192.png',
    badge: '/badge.png',
    vibrate: [100, 50, 100],
    data: {
      url: self.location.origin
    },
    actions: [
      { action: 'open', title: 'Abrir HealthLog' },
      { action: 'close', title: 'Cerrar' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Recordatorio HealthLog', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  }
});

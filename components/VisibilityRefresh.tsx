'use client';

import { useEffect } from 'react';
import { useRouter } from '@/i18n/navigation';

/**
 * В обычной вкладке браузера возврат на сайт обычно сопровождается
 * либо явным обновлением, либо новым переходом — свежие данные
 * подгружаются сами. В режиме PWA (свернули/развернули приложение на
 * телефоне) такого не происходит: приложение просто показывает то,
 * что уже было отрисовано, сколько угодно долго, даже если данные на
 * сервере изменились (например, админ переселил гостя в другую
 * комнату, пока приложение было свёрнуто).
 *
 * Слушаем возврат видимости/фокуса и тихо обновляем данные текущей
 * страницы через router.refresh() — без перезагрузки всего приложения,
 * без "прыжка" интерфейса, просто свежие данные с сервера.
 */
export default function VisibilityRefresh() {
  const router = useRouter();

  useEffect(() => {
    function handleVisible() {
      if (document.visibilityState === 'visible') {
        router.refresh();
      }
    }

    document.addEventListener('visibilitychange', handleVisible);
    window.addEventListener('focus', handleVisible);

    return () => {
      document.removeEventListener('visibilitychange', handleVisible);
      window.removeEventListener('focus', handleVisible);
    };
  }, [router]);

  return null;
}

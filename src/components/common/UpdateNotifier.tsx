import React, { useEffect, useState } from 'react';
import { Modal, Progress, Button, message } from 'antd';

declare global {
  interface Window {
    electronAPI: {
      checkForUpdates: () => void;
      installUpdate: () => void;
      onUpdateStatus: (callback: (status: string, info: any) => void) => void;
      onUpdateProgress: (callback: (progress: any) => void) => void;
    };
  }
}

const UpdateNotifier: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);
  const [updateInfo, setUpdateInfo] = useState<any>(null);

  useEffect(() => {
    // Слушаем события обновления
    window.electronAPI.onUpdateStatus((status, info) => {
      setStatus(status);
      setUpdateInfo(info);

      if (status === 'available') {
        setVisible(true);
      } else if (status === 'downloaded') {
        message.success('Обновление загружено и будет установлено при перезапуске');
      } else if (status === 'error') {
        message.error('Ошибка при проверке обновлений');
      }
    });

    window.electronAPI.onUpdateProgress((progressObj) => {
      setProgress(Math.round(progressObj.percent));
    });

    // Проверяем обновления при монтировании компонента
    window.electronAPI.checkForUpdates();
  }, []);

  const handleUpdate = () => {
    window.electronAPI.installUpdate();
  };

  const handleCancel = () => {
    setVisible(false);
  };

  return (
    <Modal
      title="Доступно обновление"
      open={visible}
      onOk={handleUpdate}
      onCancel={handleCancel}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          Позже
        </Button>,
        <Button key="update" type="primary" onClick={handleUpdate}>
          Установить обновление
        </Button>,
      ]}
    >
      {status === 'available' && (
        <div>
          <p>Доступна новая версия: {updateInfo?.version}</p>
          <p>{updateInfo?.releaseNotes}</p>
        </div>
      )}
      {progress > 0 && (
        <Progress percent={progress} status="active" />
      )}
    </Modal>
  );
};

export default UpdateNotifier;
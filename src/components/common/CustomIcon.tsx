import React from 'react';
import { ReloadOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

interface CustomIconProps {
  type: 'reload' | 'edit' | 'delete';
}

const iconMap = {
  reload: ReloadOutlined,
  edit: EditOutlined,
  delete: DeleteOutlined
};

export const CustomIcon: React.FC<CustomIconProps> = ({ type }) => {
  const IconComponent = iconMap[type];
  return <IconComponent style={{ color: 'white' }} />;
}; 
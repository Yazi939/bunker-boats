import React from 'react';
import type { AntdIconProps } from '@ant-design/icons/lib/components/AntdIcon';
import * as Icons from '@ant-design/icons';

type IconType = keyof typeof Icons;

interface IconProps extends Partial<AntdIconProps> {
  type: IconType;
}

const defaultProps: Partial<AntdIconProps> = {
  className: 'anticon',
  role: 'img',
  onPointerEnterCapture: () => {},
  onPointerLeaveCapture: () => {}
};

export const Icon: React.FC<IconProps> = ({ type, ...props }) => {
  const IconComponent = Icons[type];
  return <IconComponent {...defaultProps} {...props} />;
}; 
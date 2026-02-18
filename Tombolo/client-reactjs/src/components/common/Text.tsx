import React from 'react';

type Props = { text?: React.ReactNode };

export default function Text({ text }: Props) {
  return <>{text}</>;
}
